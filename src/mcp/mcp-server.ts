import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ContextPackService } from "../services/context-pack.service.js";
import type { MemoryService } from "../services/memory.service.js";
import type { SearchService } from "../services/search.service.js";
import { registerMemoryResources } from "./resources.js";
import { registerMemoryTools } from "./tools.js";

export interface McpServerServices {
  memoryService: MemoryService;
  searchService: SearchService;
  contextPackService: ContextPackService;
}

export function createMemoryMcpServer(services: McpServerServices): McpServer {
  const server = new McpServer(
    {
      name: "persistent-gpt-memory-mcp",
      version: "0.1.0"
    },
    {
      capabilities: {
        logging: {}
      }
    }
  );

  registerMemoryTools(server, services);
  registerMemoryResources(server, services.memoryService);

  return server;
}

