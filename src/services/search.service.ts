import { type IndexedDocument, type SearchInput } from "../schemas/document.schema.js";
import { IndexStore } from "../storage/index-store.js";

export interface SearchResult extends IndexedDocument {
  score: number;
}

export class SearchService {
  constructor(private readonly indexStore: IndexStore) {}

  async search(input: SearchInput): Promise<SearchResult[]> {
    const queryTokens = tokenize(input.query);
    const documents = await this.indexStore.list({ limit: 200 });
    const filtered = documents.filter((document) => {
      if (input.types?.length && !input.types.includes(document.type)) {
        return false;
      }

      if (input.tags?.length && !input.tags.every((tag) => document.tags.includes(tag))) {
        return false;
      }

      return true;
    });

    return filtered
      .map((document) => ({
        ...document,
        score: scoreDocument(queryTokens, document)
      }))
      .filter((document) => document.score > 0)
      .sort((a, b) => b.score - a.score || b.updated_at.localeCompare(a.updated_at))
      .slice(0, input.limit);
  }
}

function scoreDocument(queryTokens: Set<string>, document: IndexedDocument): number {
  const titleTokens = tokenize(document.title);
  const summaryTokens = tokenize(document.summary);
  const metadataTokens = tokenize(
    [document.type, document.category, document.priority, document.status, ...document.tags].join(" ")
  );
  let score = 0;

  for (const token of queryTokens) {
    if (titleTokens.has(token)) score += 5;
    if (summaryTokens.has(token)) score += 3;
    if (metadataTokens.has(token)) score += 4;
  }

  const documentTokens = new Set([...titleTokens, ...summaryTokens, ...metadataTokens]);
  const union = new Set([...queryTokens, ...documentTokens]);
  const intersection = [...queryTokens].filter((token) => documentTokens.has(token)).length;
  const similarity = union.size === 0 ? 0 : intersection / union.size;

  return score + similarity;
}

function tokenize(value: string): Set<string> {
  const tokens = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter((token) => token.length >= 2);

  return new Set(tokens);
}
