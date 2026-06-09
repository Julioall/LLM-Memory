import type { FastifyInstance } from "fastify";
import { ContextPackSchema, SearchSchema } from "../schemas/document.schema.js";
import type { ContextPackService } from "../services/context-pack.service.js";
import type { SearchService } from "../services/search.service.js";
import { parseWithSchema } from "../utils/validation.js";

export async function registerSearchRoutes(
  app: FastifyInstance,
  searchService: SearchService,
  contextPackService: ContextPackService
): Promise<void> {
  app.post("/api/search", async (request) => {
    const input = parseWithSchema(SearchSchema, request.body);
    return {
      query: input.query,
      results: await searchService.search(input)
    };
  });

  app.post("/api/context-pack", async (request) => {
    const input = parseWithSchema(ContextPackSchema, request.body);
    return contextPackService.create(input);
  });
}

