import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MemoryService } from "../services/memory.service.js";

export function registerMemoryResources(server: McpServer, memoryService: MemoryService): void {
  server.registerResource(
    "memory-index",
    "memory://index",
    {
      title: "Persistent memory index",
      description: "Compact JSON index of active and archived memory documents.",
      mimeType: "application/json"
    },
    async (uri) => {
      const documents = await memoryService.listIndex();

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify({ documents }, null, 2)
          }
        ]
      };
    }
  );

  server.registerResource(
    "memory-document",
    new ResourceTemplate("memory://docs/{id}", {
      list: async () => {
        const documents = await memoryService.listIndex();

        return {
          resources: documents.map((document) => ({
            uri: `memory://docs/${document.id}`,
            name: document.title,
            description: document.summary,
            mimeType: "text/markdown"
          }))
        };
      }
    }),
    {
      title: "Persistent memory document",
      description: "Full Markdown content for a selected memory document.",
      mimeType: "text/markdown"
    },
    async (uri, variables) => {
      const id = String(variables.id);
      const document = await memoryService.readDocument(id);

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: document.content
          }
        ]
      };
    }
  );
}

