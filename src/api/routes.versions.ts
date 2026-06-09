import type { FastifyInstance } from "fastify";
import * as z from "zod/v4";
import type { MemoryService } from "../services/memory.service.js";
import { parseWithSchema } from "../utils/validation.js";

interface DocumentParams {
  id: string;
}

interface VersionParams extends DocumentParams {
  version: string;
}

const VersionRestoreSchema = z.object({
  reason: z.string().max(800).optional()
});

export async function registerVersionsRoutes(app: FastifyInstance, memoryService: MemoryService): Promise<void> {
  app.get<{ Params: DocumentParams }>("/api/docs/:id/versions", async (request) => {
    return {
      versions: await memoryService.listVersions(request.params.id)
    };
  });

  app.get<{ Params: VersionParams }>("/api/docs/:id/versions/:version", async (request) => {
    return memoryService.readVersion(request.params.id, Number(request.params.version));
  });

  app.post<{ Params: VersionParams }>("/api/docs/:id/versions/:version/restore", async (request) => {
    const input = parseWithSchema(VersionRestoreSchema, request.body ?? {});
    return memoryService.restoreVersion(request.params.id, Number(request.params.version), input.reason);
  });

  app.get<{ Params: VersionParams }>("/api/docs/:id/versions/:version/diff", async (request) => {
    return memoryService.compareVersionWithCurrent(request.params.id, Number(request.params.version));
  });
}

