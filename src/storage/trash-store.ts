import { type MemoryDocument } from "../schemas/document.schema.js";
import { FileStore } from "./file-store.js";

export class TrashStore {
  constructor(private readonly files: FileStore) {}

  getTrashPath(document: MemoryDocument): string {
    return this.files.buildTrashPath(document.metadata);
  }

  async writeTrash(document: MemoryDocument): Promise<string> {
    const trashPath = this.getTrashPath(document);
    return this.files.writeDocument(trashPath, document.metadata, document.content);
  }

  async removeTrash(document: MemoryDocument): Promise<void> {
    await this.files.remove(this.getTrashPath(document));
  }
}

