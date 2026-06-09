import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  MemoryContextPackToolSchema,
  MemoryDocCreateToolSchema,
  MemoryDocDeleteToolSchema,
  MemoryDocReadToolSchema,
  MemoryDocRestoreToolSchema,
  MemoryDocUpdateToolSchema,
  MemoryIndexListToolSchema,
  MemorySearchToolSchema,
  MemoryVersionReadToolSchema,
  MemoryVersionRestoreToolSchema,
  MemoryVersionsListToolSchema
} from "../schemas/tool.schema.js";
import type { ContextPackService } from "../services/context-pack.service.js";
import type { MemoryService } from "../services/memory.service.js";
import type { SearchService } from "../services/search.service.js";

export interface McpToolServices {
  memoryService: MemoryService;
  searchService: SearchService;
  contextPackService: ContextPackService;
}

export function registerMemoryTools(server: McpServer, services: McpToolServices): void {
  server.registerTool(
    "memory_index_list",
    {
      title: "List memory index",
      description: "List summarized memory documents without opening full Markdown content.",
      inputSchema: MemoryIndexListToolSchema
    },
    async (args) => jsonToolResult({ documents: await services.memoryService.listIndex(args) })
  );

  server.registerTool(
    "memory_search",
    {
      title: "Search memory",
      description: "Find memory documents by query, type or tag using the compact index.",
      inputSchema: MemorySearchToolSchema
    },
    async (args) =>
      jsonToolResult({
        query: args.query,
        results: await services.searchService.search({
          query: args.query,
          types: args.types,
          tags: args.tags,
          limit: args.limit ?? 10
        })
      })
  );

  server.registerTool(
    "memory_doc_read",
    {
      title: "Read memory document",
      description: "Read a full memory document by id after selecting it from the index or search results.",
      inputSchema: MemoryDocReadToolSchema
    },
    async ({ id }) => jsonToolResult(await services.memoryService.readDocument(id))
  );

  server.registerTool(
    "memory_doc_create",
    {
      title: "Create memory document",
      description: "Create a new persistent memory document with Markdown content and metadata.",
      inputSchema: MemoryDocCreateToolSchema
    },
    async (args) => jsonToolResult(await services.memoryService.createDocument(args))
  );

  server.registerTool(
    "memory_doc_update",
    {
      title: "Update memory document",
      description: "Update an existing document. Requires expected_version and archives the previous version first.",
      inputSchema: MemoryDocUpdateToolSchema
    },
    async ({ id, ...input }) => jsonToolResult(await services.memoryService.updateDocument(id, input))
  );

  server.registerTool(
    "memory_doc_delete",
    {
      title: "Move memory document to trash",
      description: "Move a document to trash. This is not a permanent delete and requires a reason.",
      inputSchema: MemoryDocDeleteToolSchema
    },
    async ({ id, ...input }) => jsonToolResult(await services.memoryService.deleteDocument(id, input))
  );

  server.registerTool(
    "memory_doc_restore",
    {
      title: "Restore memory document",
      description: "Restore a document from trash back into active memory.",
      inputSchema: MemoryDocRestoreToolSchema
    },
    async ({ id, ...input }) => jsonToolResult(await services.memoryService.restoreDocument(id, input))
  );

  server.registerTool(
    "memory_versions_list",
    {
      title: "List document versions",
      description: "List archived versions for one document.",
      inputSchema: MemoryVersionsListToolSchema
    },
    async ({ id }) => jsonToolResult({ versions: await services.memoryService.listVersions(id) })
  );

  server.registerTool(
    "memory_version_read",
    {
      title: "Read document version",
      description: "Read a previous archived version for one document.",
      inputSchema: MemoryVersionReadToolSchema
    },
    async ({ id, version }) => jsonToolResult(await services.memoryService.readVersion(id, version))
  );

  server.registerTool(
    "memory_version_restore",
    {
      title: "Restore document version",
      description: "Restore an archived version as the current document version.",
      inputSchema: MemoryVersionRestoreToolSchema
    },
    async ({ id, version, reason }) => jsonToolResult(await services.memoryService.restoreVersion(id, version, reason))
  );

  server.registerTool(
    "memory_context_pack",
    {
      title: "Create context pack",
      description: "Create a compact Markdown context pack from the most relevant memory documents.",
      inputSchema: MemoryContextPackToolSchema
    },
    async (args) =>
      jsonToolResult(
        await services.contextPackService.create({
          goal: args.goal,
          query: args.query,
          max_documents: args.max_documents ?? 5,
          max_chars: args.max_chars ?? 12_000
        })
      )
  );

  server.registerTool(
    "memory_health",
    {
      title: "Memory health",
      description: "Return server health, storage path and index document counts."
    },
    async () => jsonToolResult(await services.memoryService.health())
  );
}

function jsonToolResult(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

