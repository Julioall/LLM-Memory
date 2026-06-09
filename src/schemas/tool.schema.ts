import * as z from "zod/v4";
import {
  ContextPackSchema,
  CreateDocumentSchema,
  DeleteDocumentSchema,
  DocumentStatusSchema,
  DocumentTypeSchema,
  RestoreDocumentSchema,
  SearchSchema,
  UpdateDocumentSchema
} from "./document.schema.js";

export const MemoryIndexListToolSchema = {
  type: DocumentTypeSchema.optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  status: DocumentStatusSchema.optional(),
  limit: z.number().int().min(1).max(200).optional()
};

export const MemorySearchToolSchema = {
  query: SearchSchema.shape.query,
  types: SearchSchema.shape.types,
  tags: SearchSchema.shape.tags,
  limit: SearchSchema.shape.limit
};

export const MemoryDocReadToolSchema = {
  id: z.string().min(1)
};

export const MemoryDocCreateToolSchema = CreateDocumentSchema.shape;
export const MemoryDocUpdateToolSchema = {
  id: z.string().min(1),
  ...UpdateDocumentSchema.shape
};
export const MemoryDocDeleteToolSchema = {
  id: z.string().min(1),
  ...DeleteDocumentSchema.shape
};
export const MemoryDocRestoreToolSchema = {
  id: z.string().min(1),
  ...RestoreDocumentSchema.shape
};
export const MemoryVersionsListToolSchema = {
  id: z.string().min(1)
};
export const MemoryVersionReadToolSchema = {
  id: z.string().min(1),
  version: z.number().int().min(1)
};
export const MemoryVersionRestoreToolSchema = {
  id: z.string().min(1),
  version: z.number().int().min(1),
  reason: z.string().max(800).optional()
};
export const MemoryContextPackToolSchema = ContextPackSchema.shape;

