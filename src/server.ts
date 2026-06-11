import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import cors from "@fastify/cors";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { registerDocsRoutes } from "./api/routes.docs.js";
import { registerIndexRoutes } from "./api/routes.index.js";
import { registerSearchRoutes } from "./api/routes.search.js";
import { registerSystemRoutes } from "./api/routes.system.js";
import { registerVersionsRoutes } from "./api/routes.versions.js";
import { createMemoryMcpServer } from "./mcp/mcp-server.js";
import { ContextPackService } from "./services/context-pack.service.js";
import { MemoryService } from "./services/memory.service.js";
import { SearchService } from "./services/search.service.js";
import { AppError } from "./utils/validation.js";

export interface AppConfig {
  host: string;
  port: number;
  dataDir: string;
  maxDocumentChars: number;
  logLevel: string;
}

export interface AppServices {
  memoryService: MemoryService;
  searchService: SearchService;
  contextPackService: ContextPackService;
}

export interface BuildAppOptions {
  config?: Partial<AppConfig>;
  logger?: boolean;
}

export function loadConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    host: overrides.host ?? process.env.HOST ?? "0.0.0.0",
    port: overrides.port ?? Number(process.env.PORT ?? process.env.APP_PORT ?? 8787),
    dataDir: overrides.dataDir ?? process.env.DATA_DIR ?? path.resolve(process.cwd(), "data"),
    maxDocumentChars: overrides.maxDocumentChars ?? Number(process.env.MAX_DOCUMENT_CHARS ?? 60_000),
    logLevel: overrides.logLevel ?? process.env.LOG_LEVEL ?? "info"
  };
}

export async function createServices(config: AppConfig): Promise<AppServices> {
  const memoryService = new MemoryService({
    dataDir: config.dataDir,
    maxDocumentChars: config.maxDocumentChars
  });
  await memoryService.initialize();

  const searchService = new SearchService(memoryService.indexStore);
  const contextPackService = new ContextPackService(memoryService, searchService);

  return {
    memoryService,
    searchService,
    contextPackService
  };
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const config = loadConfig(options.config);
  const services = await createServices(config);
  const app = fastify({
    logger: options.logger
      ? {
          level: config.logLevel
        }
      : false
  });

  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        error: error.message,
        details: error.details
      });
    }

    const genericError = error as { statusCode?: number; message?: string };
    const statusCode = typeof genericError.statusCode === "number" ? genericError.statusCode : 500;
    return reply.code(statusCode).send({
      error: statusCode >= 500 ? "Internal server error" : genericError.message ?? "Request failed"
    });
  });

  await registerSystemRoutes(app, services.memoryService);
  await registerIndexRoutes(app, services.memoryService);
  await registerDocsRoutes(app, services.memoryService);
  await registerVersionsRoutes(app, services.memoryService);
  await registerSearchRoutes(app, services.searchService, services.contextPackService);

  app.get("/openapi.yaml", async (_request, reply) => {
    const openApiPath = path.resolve(process.cwd(), "openapi/gpt-actions.yaml");
    const yaml = await fs.readFile(openApiPath, "utf8");
    return reply.type("application/yaml; charset=utf-8").send(yaml);
  });

  const sendPrivacyPolicy = async (_request: FastifyRequest, reply: FastifyReply) => {
    const privacyPath = path.resolve(process.cwd(), "docs/PRIVACY_POLICY.md");
    const markdown = await fs.readFile(privacyPath, "utf8");
    return reply.type("text/markdown; charset=utf-8").send(markdown);
  };

  app.get("/privacy", sendPrivacyPolicy);
  app.get("/privacy.md", sendPrivacyPolicy);

  app.post("/mcp", async (request, reply) => {
    const server = createMemoryMcpServer(services);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined
    });

    try {
      await server.connect(transport);
      reply.hijack();
      reply.raw.on("close", () => {
        void transport.close();
        void server.close();
      });
      await transport.handleRequest(request.raw, reply.raw, request.body);
    } catch (error) {
      request.log.error(error);
      if (!reply.raw.headersSent) {
        reply.raw.writeHead(500, { "content-type": "application/json" });
        reply.raw.end(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: "Internal server error"
            },
            id: null
          })
        );
      }
    }
  });

  app.get("/mcp", async (_request, reply) =>
    reply.code(405).send({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed. Use POST for Streamable HTTP MCP requests."
      },
      id: null
    })
  );

  app.delete("/mcp", async (_request, reply) =>
    reply.code(405).send({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed."
      },
      id: null
    })
  );

  return app;
}

async function main(): Promise<void> {
  const config = loadConfig();
  const app = await buildApp({ config, logger: true });

  await app.listen({
    host: config.host,
    port: config.port
  });

  const shutdown = async () => {
    await app.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}
