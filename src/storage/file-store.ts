import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { type DocumentMetadata, type MemoryDocument } from "../schemas/document.schema.js";
import { stringifyMarkdownDocument, parseMarkdownDocument } from "../utils/markdown.js";
import { safeSegment } from "../utils/slug.js";
import { ensureInsideBase } from "../utils/validation.js";

export interface FileStoreOptions {
  dataDir: string;
}

export class FileStore {
  public readonly dataDir: string;

  constructor(options: FileStoreOptions) {
    this.dataDir = path.resolve(options.dataDir);
  }

  async ensureReady(): Promise<void> {
    await Promise.all([
      fs.mkdir(this.dataDir, { recursive: true }),
      fs.mkdir(this.resolveDataPath("docs"), { recursive: true }),
      fs.mkdir(this.resolveDataPath("versions"), { recursive: true }),
      fs.mkdir(this.resolveDataPath("trash"), { recursive: true }),
      fs.mkdir(this.resolveDataPath("audit"), { recursive: true }),
      fs.mkdir(this.resolveDataPath("templates"), { recursive: true })
    ]);
  }

  resolveDataPath(relativePath: string): string {
    const normalized = this.normalizeRelativePath(relativePath);
    return ensureInsideBase(this.dataDir, path.join(this.dataDir, ...normalized.split("/")));
  }

  toDataRelative(absolutePath: string): string {
    const relative = path.relative(this.dataDir, absolutePath);
    return relative.split(path.sep).join("/");
  }

  async readDocument(relativePath: string): Promise<MemoryDocument> {
    const absolutePath = this.resolveDataPath(relativePath);
    const markdown = await fs.readFile(absolutePath, "utf8");
    const parsed = parseMarkdownDocument(markdown);

    return {
      ...parsed,
      path: this.toDataRelative(absolutePath)
    };
  }

  async writeDocument(relativePath: string, metadata: DocumentMetadata, content: string): Promise<string> {
    const absolutePath = this.resolveDataPath(relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, stringifyMarkdownDocument(metadata, content), "utf8");
    return this.toDataRelative(absolutePath);
  }

  async writeJsonAtomic(relativePath: string, value: unknown): Promise<void> {
    const absolutePath = this.resolveDataPath(relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    const tempPath = `${absolutePath}.${crypto.randomBytes(4).toString("hex")}.tmp`;
    await fs.writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    await fs.rename(tempPath, absolutePath);
  }

  async readJson<T>(relativePath: string): Promise<T> {
    const absolutePath = this.resolveDataPath(relativePath);
    const raw = await fs.readFile(absolutePath, "utf8");
    return JSON.parse(raw) as T;
  }

  async exists(relativePath: string): Promise<boolean> {
    try {
      await fs.access(this.resolveDataPath(relativePath));
      return true;
    } catch {
      return false;
    }
  }

  async remove(relativePath: string): Promise<void> {
    await fs.rm(this.resolveDataPath(relativePath), { force: true, recursive: true });
  }

  async appendJsonLine(relativePath: string, value: unknown): Promise<void> {
    const absolutePath = this.resolveDataPath(relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.appendFile(absolutePath, `${JSON.stringify(value)}\n`, "utf8");
  }

  async listFiles(relativePath: string): Promise<string[]> {
    const absolutePath = this.resolveDataPath(relativePath);

    try {
      return await fs.readdir(absolutePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }

      throw error;
    }
  }

  async stat(relativePath: string): Promise<{ mtime: Date; size: number }> {
    const stat = await fs.stat(this.resolveDataPath(relativePath));
    return { mtime: stat.mtime, size: stat.size };
  }

  buildDocumentPath(metadata: Pick<DocumentMetadata, "slug" | "type" | "category">): string {
    const type = safeSegment(metadata.type);
    const category = safeSegment(metadata.category);
    const baseSlug = safeSegment(metadata.slug);
    return `docs/${type}/${category}/${baseSlug}.md`;
  }

  async buildUniqueDocumentPath(
    metadata: Pick<DocumentMetadata, "id" | "slug" | "type" | "category">,
    existingPath?: string
  ): Promise<string> {
    const basePath = this.buildDocumentPath(metadata);

    if (basePath === existingPath || !(await this.exists(basePath))) {
      return basePath;
    }

    const idSuffix = metadata.id.split("_").at(-1) ?? crypto.randomBytes(3).toString("hex");
    const type = safeSegment(metadata.type);
    const category = safeSegment(metadata.category);
    const baseSlug = safeSegment(metadata.slug);
    return `docs/${type}/${category}/${baseSlug}-${idSuffix}.md`;
  }

  buildTrashPath(metadata: Pick<DocumentMetadata, "id" | "slug">): string {
    return `trash/${safeSegment(metadata.id, "document")}/${safeSegment(metadata.slug, "document")}.md`;
  }

  buildVersionPath(documentId: string, version: number): string {
    return `versions/${safeSegment(documentId, "document")}/v${version}.md`;
  }

  buildVersionsDir(documentId: string): string {
    return `versions/${safeSegment(documentId, "document")}`;
  }

  private normalizeRelativePath(relativePath: string): string {
    const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
    const parts = normalized.split("/").filter(Boolean);

    if (parts.some((part) => part === "." || part === "..")) {
      throw new Error("Unsafe relative path");
    }

    return parts.join("/");
  }
}
