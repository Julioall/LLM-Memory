import { type IndexedDocument, type ListDocumentsQuery } from "../schemas/document.schema.js";
import { MemoryIndexSchema, type MemoryIndex } from "../schemas/index.schema.js";
import { nowIso } from "../utils/dates.js";
import { AppError } from "../utils/validation.js";
import { FileStore } from "./file-store.js";

const INDEX_PATH = "index.json";
const PRIORITY_WEIGHT: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1
};

export class IndexStore {
  constructor(private readonly files: FileStore) {}

  async ensureReady(): Promise<void> {
    if (!(await this.files.exists(INDEX_PATH))) {
      await this.save({
        version: 1,
        updated_at: nowIso(),
        documents: []
      });
    }
  }

  async load(): Promise<MemoryIndex> {
    try {
      const index = await this.files.readJson<MemoryIndex>(INDEX_PATH);
      return MemoryIndexSchema.parse(index);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        await this.ensureReady();
        return this.load();
      }

      throw error;
    }
  }

  async save(index: MemoryIndex): Promise<void> {
    const sorted = [...index.documents].sort((a, b) => {
      const priorityDelta = (PRIORITY_WEIGHT[b.priority] ?? 0) - (PRIORITY_WEIGHT[a.priority] ?? 0);
      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return b.updated_at.localeCompare(a.updated_at);
    });

    await this.files.writeJsonAtomic(INDEX_PATH, {
      ...index,
      updated_at: nowIso(),
      documents: sorted
    });
  }

  async list(filters: ListDocumentsQuery = {}): Promise<IndexedDocument[]> {
    const index = await this.load();
    const documents = index.documents.filter((document) => {
      if (filters.status) {
        if (document.status !== filters.status) return false;
      } else if (document.status === "deleted") {
        return false;
      }

      if (filters.type && document.type !== filters.type) return false;
      if (filters.category && document.category !== filters.category) return false;
      if (filters.priority && document.priority !== filters.priority) return false;
      if (filters.tag && !document.tags.includes(filters.tag)) return false;

      return true;
    });

    return typeof filters.limit === "number" ? documents.slice(0, filters.limit) : documents;
  }

  async findById(id: string): Promise<IndexedDocument | undefined> {
    const index = await this.load();
    return index.documents.find((document) => document.id === id);
  }

  async requireById(id: string): Promise<IndexedDocument> {
    const document = await this.findById(id);

    if (!document) {
      throw new AppError(404, `Document ${id} was not found`);
    }

    return document;
  }

  async upsert(document: IndexedDocument): Promise<void> {
    const index = await this.load();
    const nextDocuments = index.documents.filter((existing) => existing.id !== document.id);
    nextDocuments.push(document);
    await this.save({ ...index, documents: nextDocuments });
  }

  async remove(id: string): Promise<void> {
    const index = await this.load();
    await this.save({
      ...index,
      documents: index.documents.filter((document) => document.id !== id)
    });
  }

  async stats(): Promise<{ document_count: number; active_count: number; deleted_count: number; updated_at: string }> {
    const index = await this.load();

    return {
      document_count: index.documents.length,
      active_count: index.documents.filter((document) => document.status !== "deleted").length,
      deleted_count: index.documents.filter((document) => document.status === "deleted").length,
      updated_at: index.updated_at
    };
  }
}

