import * as z from "zod/v4";
import { IndexedDocumentSchema } from "./document.schema.js";

export const MemoryIndexSchema = z.object({
  version: z.number().int().min(1),
  updated_at: z.string(),
  documents: z.array(IndexedDocumentSchema)
});

export type MemoryIndex = z.infer<typeof MemoryIndexSchema>;

