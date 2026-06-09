import type { FastifyInstance } from "fastify";
import type { MemoryService } from "../services/memory.service.js";

export async function registerSystemRoutes(app: FastifyInstance, memoryService: MemoryService): Promise<void> {
  app.get("/health", async () => memoryService.health());
  app.get("/api/system/health", async () => memoryService.health());
}

