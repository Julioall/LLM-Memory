import type { FastifyInstance } from "fastify";
import {
  CreateDocumentSchema,
  DeleteDocumentSchema,
  ListDocumentsQuerySchema,
  PermanentDeleteDocumentSchema,
  RestoreDocumentSchema,
  UpdateDocumentSchema
} from "../schemas/document.schema.js";
import type { MemoryService } from "../services/memory.service.js";
import { parseWithSchema } from "../utils/validation.js";

interface DocumentParams {
  id: string;
}

export async function registerDocsRoutes(app: FastifyInstance, memoryService: MemoryService): Promise<void> {
  app.get("/api/docs", async (request) => {
    const filters = parseWithSchema(ListDocumentsQuerySchema, request.query);
    return {
      documents: await memoryService.listIndex(filters)
    };
  });

  app.post("/api/docs", async (request, reply) => {
    const input = parseWithSchema(CreateDocumentSchema, request.body);
    const document = await memoryService.createDocument(input);
    return reply.code(201).send(document);
  });

  app.get<{ Params: DocumentParams }>("/api/docs/:id", async (request) => {
    return memoryService.readDocument(request.params.id);
  });

  app.put<{ Params: DocumentParams }>("/api/docs/:id", async (request) => {
    const input = parseWithSchema(UpdateDocumentSchema, request.body);
    return memoryService.updateDocument(request.params.id, input);
  });

  app.delete<{ Params: DocumentParams }>("/api/docs/:id", async (request) => {
    const input = parseWithSchema(DeleteDocumentSchema, request.body);
    return memoryService.deleteDocument(request.params.id, input);
  });

  app.post<{ Params: DocumentParams }>("/api/docs/:id/restore", async (request) => {
    const input = parseWithSchema(RestoreDocumentSchema, request.body ?? {});
    return memoryService.restoreDocument(request.params.id, input);
  });

  app.delete<{ Params: DocumentParams }>("/api/docs/:id/permanent", async (request) => {
    const input = parseWithSchema(PermanentDeleteDocumentSchema, request.body);
    return memoryService.permanentDeleteDocument(request.params.id, input);
  });
}

