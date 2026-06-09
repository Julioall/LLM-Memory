import { type DocumentVersionInfo, type MemoryDocument } from "../schemas/document.schema.js";
import { AppError } from "../utils/validation.js";
import { FileStore } from "./file-store.js";

export class VersionStore {
  constructor(private readonly files: FileStore) {}

  async archive(document: MemoryDocument): Promise<DocumentVersionInfo> {
    const versionPath = this.files.buildVersionPath(document.metadata.id, document.metadata.version);

    if (!(await this.files.exists(versionPath))) {
      await this.files.writeDocument(versionPath, document.metadata, document.content);
    }

    return {
      document_id: document.metadata.id,
      version: document.metadata.version,
      path: versionPath,
      created_at: document.metadata.updated_at,
      summary: document.metadata.summary
    };
  }

  async list(documentId: string): Promise<DocumentVersionInfo[]> {
    const versionsDir = this.files.buildVersionsDir(documentId);
    const files = await this.files.listFiles(versionsDir);
    const versions = await Promise.all(
      files
        .filter((file) => /^v\d+\.md$/.test(file))
        .map(async (file) => {
          const version = Number(file.match(/^v(\d+)\.md$/)?.[1]);
          const versionPath = `${versionsDir}/${file}`;
          const stat = await this.files.stat(versionPath);

          try {
            const document = await this.files.readDocument(versionPath);
            return {
              document_id: documentId,
              version,
              path: versionPath,
              created_at: document.metadata.updated_at,
              summary: document.metadata.summary
            };
          } catch {
            return {
              document_id: documentId,
              version,
              path: versionPath,
              created_at: stat.mtime.toISOString()
            };
          }
        })
    );

    return versions.sort((a, b) => a.version - b.version);
  }

  async read(documentId: string, version: number): Promise<MemoryDocument> {
    const versionPath = this.files.buildVersionPath(documentId, version);

    if (!(await this.files.exists(versionPath))) {
      throw new AppError(404, `Version ${version} for document ${documentId} was not found`);
    }

    return this.files.readDocument(versionPath);
  }
}

