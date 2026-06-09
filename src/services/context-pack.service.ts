import { type ContextPackInput, type IndexedDocument } from "../schemas/document.schema.js";
import { MemoryService } from "./memory.service.js";
import { SearchService } from "./search.service.js";

export interface ContextPack {
  goal: string;
  selected_documents: IndexedDocument[];
  context_markdown: string;
}

export class ContextPackService {
  constructor(
    private readonly memoryService: MemoryService,
    private readonly searchService: SearchService
  ) {}

  async create(input: ContextPackInput): Promise<ContextPack> {
    const results = await this.searchService.search({
      query: input.query,
      limit: input.max_documents
    });
    const selected: IndexedDocument[] = [];
    const chunks: string[] = [`# Context pack`, "", `Goal: ${input.goal}`, `Query: ${input.query}`, ""];
    let usedChars = chunks.join("\n").length;

    for (const result of results) {
      if (selected.length >= input.max_documents) {
        break;
      }

      const document = await this.memoryService.readDocument(result.id);
      const header = [
        `## ${document.metadata.title}`,
        "",
        `- id: ${document.metadata.id}`,
        `- type: ${document.metadata.type}`,
        `- category: ${document.metadata.category}`,
        `- tags: ${document.metadata.tags.join(", ")}`,
        `- version: ${document.metadata.version}`,
        `- summary: ${document.metadata.summary}`,
        "",
        document.content.trim(),
        ""
      ].join("\n");
      const remaining = input.max_chars - usedChars;

      if (remaining <= 0) {
        break;
      }

      const chunk = header.length > remaining ? `${header.slice(0, Math.max(0, remaining - 24))}\n\n[truncated]\n` : header;
      chunks.push(chunk);
      usedChars += chunk.length;
      selected.push(result);
    }

    return {
      goal: input.goal,
      selected_documents: selected,
      context_markdown: chunks.join("\n").slice(0, input.max_chars)
    };
  }
}

