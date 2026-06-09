import { nowIso } from "../utils/dates.js";
import { FileStore } from "./file-store.js";

export interface AuditEvent {
  action: string;
  document_id?: string;
  summary?: string;
  [key: string]: unknown;
}

export class AuditStore {
  constructor(private readonly files: FileStore) {}

  async log(event: AuditEvent): Promise<void> {
    await this.files.appendJsonLine("audit/audit-log.jsonl", {
      timestamp: nowIso(),
      ...event
    });
  }
}

