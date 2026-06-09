import * as z from "zod/v4";

export const DocumentTypeSchema = z.enum([
  "context",
  "skill",
  "prompt",
  "process",
  "template",
  "project",
  "decision",
  "reference",
  "workflow",
  "correction_criteria",
  "class_plan"
]);

export const DocumentStatusSchema = z.enum(["active", "archived", "deleted"]);
export const DocumentPrioritySchema = z.enum(["low", "medium", "high"]);

export const DocumentMetadataSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  type: DocumentTypeSchema,
  category: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
  status: DocumentStatusSchema.default("active"),
  priority: DocumentPrioritySchema.default("medium"),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
  version: z.number().int().min(1),
  summary: z.string().min(1)
});

export const IndexedDocumentSchema = DocumentMetadataSchema.extend({
  path: z.string().min(1)
});

export const CreateDocumentSchema = z.object({
  title: z.string().min(1).max(200),
  type: DocumentTypeSchema,
  category: z.string().min(1).max(120).default("general"),
  tags: z.array(z.string().min(1).max(60)).default([]),
  summary: z.string().min(1).max(800),
  content: z.string().min(1),
  priority: DocumentPrioritySchema.default("medium")
});

export const UpdateDocumentSchema = z.object({
  content: z.string().min(1),
  summary: z.string().min(1).max(800).optional(),
  tags: z.array(z.string().min(1).max(60)).optional(),
  expected_version: z.number().int().min(1),
  change_summary: z.string().min(1).max(800)
});

export const DeleteDocumentSchema = z.object({
  reason: z.string().min(3).max(800)
});

export const RestoreDocumentSchema = z.object({
  reason: z.string().max(800).optional()
});

export const PermanentDeleteDocumentSchema = z.object({
  confirm: z.literal("PERMANENT_DELETE"),
  reason: z.string().min(3).max(800)
});

export const ListDocumentsQuerySchema = z.object({
  type: DocumentTypeSchema.optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  status: DocumentStatusSchema.optional(),
  priority: DocumentPrioritySchema.optional(),
  limit: z.coerce.number().int().min(1).max(200).optional()
});

export const SearchSchema = z.object({
  query: z.string().min(1),
  types: z.array(DocumentTypeSchema).optional(),
  tags: z.array(z.string().min(1)).optional(),
  limit: z.number().int().min(1).max(50).default(10)
});

export const ContextPackSchema = z.object({
  goal: z.string().min(1),
  query: z.string().min(1),
  max_documents: z.number().int().min(1).max(20).default(5),
  max_chars: z.number().int().min(1000).max(60000).default(12000)
});

export type DocumentType = z.infer<typeof DocumentTypeSchema>;
export type DocumentStatus = z.infer<typeof DocumentStatusSchema>;
export type DocumentPriority = z.infer<typeof DocumentPrioritySchema>;
export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;
export type IndexedDocument = z.infer<typeof IndexedDocumentSchema>;
export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>;
export type DeleteDocumentInput = z.infer<typeof DeleteDocumentSchema>;
export type RestoreDocumentInput = z.infer<typeof RestoreDocumentSchema>;
export type PermanentDeleteDocumentInput = z.infer<typeof PermanentDeleteDocumentSchema>;
export type ListDocumentsQuery = z.infer<typeof ListDocumentsQuerySchema>;
export type SearchInput = z.infer<typeof SearchSchema>;
export type ContextPackInput = z.infer<typeof ContextPackSchema>;

export interface MemoryDocument {
  metadata: DocumentMetadata;
  content: string;
  path: string;
}

export interface DocumentVersionInfo {
  document_id: string;
  version: number;
  path: string;
  created_at: string;
  summary?: string;
}

