import path from "node:path";
import type { ZodError, ZodType } from "zod/v4";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function parseWithSchema<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new AppError(400, "Invalid request payload", formatZodError(result.error));
  }

  return result.data;
}

export function formatZodError(error: ZodError): Array<{ path: string; message: string }> {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message
  }));
}

export function ensureInsideBase(baseDir: string, candidatePath: string): string {
  const resolvedBase = path.resolve(baseDir);
  const resolvedCandidate = path.resolve(candidatePath);
  const relative = path.relative(resolvedBase, resolvedCandidate);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new AppError(400, "Path traversal is not allowed");
  }

  return resolvedCandidate;
}

export function assertMaxChars(content: string, maxChars: number): void {
  if (content.length > maxChars) {
    throw new AppError(413, `Document content exceeds the configured limit of ${maxChars} characters`);
  }
}

