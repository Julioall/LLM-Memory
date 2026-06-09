import type { FastifyInstance } from "fastify";
import { ListDocumentsQuerySchema } from "../schemas/document.schema.js";
import type { MemoryService } from "../services/memory.service.js";
import { parseWithSchema } from "../utils/validation.js";

export async function registerIndexRoutes(app: FastifyInstance, memoryService: MemoryService): Promise<void> {
  app.get("/api/index", async (request) => {
    const filters = parseWithSchema(ListDocumentsQuerySchema, request.query);
    return {
      documents: await memoryService.listIndex(filters)
    };
  });
}

