import matter from "gray-matter";
import { DocumentMetadataSchema, type DocumentMetadata } from "../schemas/document.schema.js";

export function parseMarkdownDocument(markdown: string): { metadata: DocumentMetadata; content: string } {
  const parsed = matter(markdown);
  const metadata = DocumentMetadataSchema.parse(parsed.data);

  return {
    metadata,
    content: parsed.content.trimStart()
  };
}

export function stringifyMarkdownDocument(metadata: DocumentMetadata, content: string): string {
  const normalizedContent = content.endsWith("\n") ? content : `${content}\n`;
  return matter.stringify(normalizedContent, metadata);
}

