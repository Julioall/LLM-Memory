import crypto from "node:crypto";
import path from "node:path";
import {
  type CreateDocumentInput,
  type DeleteDocumentInput,
  type DocumentMetadata,
  type DocumentVersionInfo,
  type IndexedDocument,
  type ListDocumentsQuery,
  type MemoryDocument,
  type PermanentDeleteDocumentInput,
  type RestoreDocumentInput,
  type UpdateDocumentInput
} from "../schemas/document.schema.js";
import { AuditStore } from "../storage/audit-store.js";
import { FileStore } from "../storage/file-store.js";
import { IndexStore } from "../storage/index-store.js";
import { TrashStore } from "../storage/trash-store.js";
import { VersionStore } from "../storage/version-store.js";
import { compactDate, nowIso } from "../utils/dates.js";
import { slugify, safeSegment } from "../utils/slug.js";
import { AppError, assertMaxChars } from "../utils/validation.js";
import { createLineDiff } from "./version.service.js";

export interface MemoryServiceOptions {
  dataDir: string;
  maxDocumentChars?: number;
}

export class MemoryService {
  public readonly files: FileStore;
  public readonly indexStore: IndexStore;
  public readonly versionStore: VersionStore;
  private readonly auditStore: AuditStore;
  private readonly trashStore: TrashStore;
  private readonly maxDocumentChars: number;

  constructor(options: MemoryServiceOptions) {
    this.files = new FileStore({ dataDir: options.dataDir });
    this.indexStore = new IndexStore(this.files);
    this.versionStore = new VersionStore(this.files);
    this.auditStore = new AuditStore(this.files);
    this.trashStore = new TrashStore(this.files);
    this.maxDocumentChars = options.maxDocumentChars ?? 60_000;
  }

  async initialize(): Promise<void> {
    await this.files.ensureReady();
    await this.indexStore.ensureReady();
  }

  async listIndex(filters: ListDocumentsQuery = {}): Promise<IndexedDocument[]> {
    return this.indexStore.list(filters);
  }

  async createDocument(input: CreateDocumentInput): Promise<MemoryDocument> {
    assertMaxChars(input.content, this.maxDocumentChars);

    const timestamp = nowIso();
    const metadata: DocumentMetadata = {
      id: createDocumentId(),
      slug: slugify(input.title, "document"),
      title: input.title.trim(),
      type: input.type,
      category: safeSegment(input.category),
      tags: normalizeTags(input.tags),
      status: "active",
      priority: input.priority,
      created_at: timestamp,
      updated_at: timestamp,
      version: 1,
      summary: input.summary.trim()
    };
    const documentPath = await this.files.buildUniqueDocumentPath(metadata);
    const savedPath = await this.files.writeDocument(documentPath, metadata, input.content);
    const document: MemoryDocument = { metadata, content: input.content, path: savedPath };

    await this.indexStore.upsert(toIndexedDocument(document));
    await this.auditStore.log({
      action: "create",
      document_id: metadata.id,
      new_version: metadata.version,
      summary: metadata.summary
    });

    return document;
  }

  async readDocument(id: string, options: { includeDeleted?: boolean } = {}): Promise<MemoryDocument> {
    const indexed = await this.indexStore.requireById(id);

    if (indexed.status === "deleted" && !options.includeDeleted) {
      throw new AppError(410, `Document ${id} is in trash`);
    }

    return this.files.readDocument(indexed.path);
  }

  async updateDocument(id: string, input: UpdateDocumentInput): Promise<MemoryDocument> {
    assertMaxChars(input.content, this.maxDocumentChars);

    const indexed = await this.indexStore.requireById(id);
    if (indexed.status === "deleted") {
      throw new AppError(409, "Deleted documents must be restored before they can be updated");
    }

    const current = await this.files.readDocument(indexed.path);
    if (current.metadata.version !== input.expected_version) {
      throw new AppError(409, `Version conflict: current version is ${current.metadata.version}`);
    }

    await this.versionStore.archive(current);

    const nextMetadata: DocumentMetadata = {
      ...current.metadata,
      tags: input.tags ? normalizeTags(input.tags) : current.metadata.tags,
      summary: input.summary?.trim() ?? current.metadata.summary,
      status: "active",
      updated_at: nowIso(),
      version: current.metadata.version + 1
    };
    const savedPath = await this.files.writeDocument(indexed.path, nextMetadata, input.content);
    const nextDocument: MemoryDocument = { metadata: nextMetadata, content: input.content, path: savedPath };

    await this.indexStore.upsert(toIndexedDocument(nextDocument));
    await this.auditStore.log({
      action: "update",
      document_id: id,
      old_version: current.metadata.version,
      new_version: nextMetadata.version,
      summary: input.change_summary
    });

    return nextDocument;
  }

  async deleteDocument(id: string, input: DeleteDocumentInput): Promise<IndexedDocument> {
    const indexed = await this.indexStore.requireById(id);
    if (indexed.status === "deleted") {
      throw new AppError(409, "Document is already in trash");
    }

    const current = await this.files.readDocument(indexed.path);
    const deletedMetadata: DocumentMetadata = {
      ...current.metadata,
      status: "deleted",
      updated_at: nowIso()
    };
    const deletedDocument: MemoryDocument = {
      metadata: deletedMetadata,
      content: current.content,
      path: current.path
    };
    const trashPath = await this.trashStore.writeTrash(deletedDocument);
    await this.files.remove(indexed.path);

    const deletedIndex = toIndexedDocument({ ...deletedDocument, path: trashPath });
    await this.indexStore.upsert(deletedIndex);
    await this.auditStore.log({
      action: "delete",
      document_id: id,
      reason: input.reason,
      summary: "Moved document to trash"
    });

    return deletedIndex;
  }

  async restoreDocument(id: string, input: RestoreDocumentInput = {}): Promise<MemoryDocument> {
    const indexed = await this.indexStore.requireById(id);
    if (indexed.status !== "deleted") {
      throw new AppError(409, "Only deleted documents can be restored");
    }

    const deleted = await this.files.readDocument(indexed.path);
    const restoredMetadata: DocumentMetadata = {
      ...deleted.metadata,
      status: "active",
      updated_at: nowIso()
    };
    const restoredPath = await this.files.buildUniqueDocumentPath(restoredMetadata);
    const savedPath = await this.files.writeDocument(restoredPath, restoredMetadata, deleted.content);
    await this.files.remove(indexed.path);

    const restored: MemoryDocument = {
      metadata: restoredMetadata,
      content: deleted.content,
      path: savedPath
    };

    await this.indexStore.upsert(toIndexedDocument(restored));
    await this.auditStore.log({
      action: "restore",
      document_id: id,
      reason: input.reason,
      summary: "Restored document from trash"
    });

    return restored;
  }

  async permanentDeleteDocument(id: string, input: PermanentDeleteDocumentInput): Promise<{ id: string; deleted: true }> {
    const indexed = await this.indexStore.requireById(id);
    await this.files.remove(indexed.path);
    await this.files.remove(this.files.buildVersionsDir(id));
    await this.indexStore.remove(id);
    await this.auditStore.log({
      action: "permanent_delete",
      document_id: id,
      reason: input.reason,
      summary: "Permanently deleted document and versions"
    });

    return { id, deleted: true };
  }

  async listVersions(id: string): Promise<DocumentVersionInfo[]> {
    await this.indexStore.requireById(id);
    return this.versionStore.list(id);
  }

  async readVersion(id: string, version: number): Promise<MemoryDocument> {
    await this.indexStore.requireById(id);
    return this.versionStore.read(id, version);
  }

  async restoreVersion(id: string, version: number, reason?: string): Promise<MemoryDocument> {
    const indexed = await this.indexStore.requireById(id);
    const current = await this.files.readDocument(indexed.path);
    const historical = await this.versionStore.read(id, version);

    await this.versionStore.archive(current);

    const restoredMetadata: DocumentMetadata = {
      ...historical.metadata,
      id: current.metadata.id,
      status: "active",
      updated_at: nowIso(),
      version: current.metadata.version + 1
    };
    const existingPath = indexed.status === "deleted" ? undefined : indexed.path;
    const restoredPath = await this.files.buildUniqueDocumentPath(restoredMetadata, existingPath);
    const savedPath = await this.files.writeDocument(restoredPath, restoredMetadata, historical.content);

    if (path.normalize(savedPath) !== path.normalize(indexed.path)) {
      await this.files.remove(indexed.path);
    }

    const restored: MemoryDocument = {
      metadata: restoredMetadata,
      content: historical.content,
      path: savedPath
    };

    await this.indexStore.upsert(toIndexedDocument(restored));
    await this.auditStore.log({
      action: "version_restore",
      document_id: id,
      restored_version: version,
      new_version: restoredMetadata.version,
      reason,
      summary: `Restored version ${version} as current`
    });

    return restored;
  }

  async compareVersionWithCurrent(id: string, version: number): Promise<{
    document_id: string;
    compared_version: number;
    current_version: number;
    diff: string;
  }> {
    const current = await this.readDocument(id, { includeDeleted: true });
    const historical = await this.versionStore.read(id, version);

    return {
      document_id: id,
      compared_version: version,
      current_version: current.metadata.version,
      diff: createLineDiff(historical.content, current.content)
    };
  }

  async health(): Promise<{
    status: "ok";
    storage_path: string;
    document_count: number;
    active_count: number;
    deleted_count: number;
    index_updated_at: string;
    max_document_chars: number;
  }> {
    const stats = await this.indexStore.stats();

    return {
      status: "ok",
      storage_path: this.files.dataDir,
      document_count: stats.document_count,
      active_count: stats.active_count,
      deleted_count: stats.deleted_count,
      index_updated_at: stats.updated_at,
      max_document_chars: this.maxDocumentChars
    };
  }
}

function toIndexedDocument(document: MemoryDocument): IndexedDocument {
  return {
    ...document.metadata,
    path: document.path
  };
}

function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map((tag) => slugify(tag)).filter(Boolean))];
}

function createDocumentId(): string {
  return `doc_${compactDate()}_${crypto.randomBytes(3).toString("hex")}`;
}

