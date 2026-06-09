import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp, type AppConfig } from "../src/server.js";

const baseConfig: Partial<AppConfig> = {
  host: "127.0.0.1",
  port: 0,
  logLevel: "silent",
  maxDocumentChars: 20_000
};

describe("Persistent GPT Memory API", () => {
  let dataDir: string;
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "persistent-memory-test-"));
    app = await buildApp({
      config: {
        ...baseConfig,
        dataDir
      }
    });
  });

  afterEach(async () => {
    await app.close();
    await fs.rm(dataDir, { recursive: true, force: true });
  });

  it("handles document lifecycle, versions, trash, restore and context packs", async () => {
    const health = await app.inject({ method: "GET", url: "/health" });
    expect(health.statusCode).toBe(200);
    expect(health.json()).toMatchObject({
      status: "ok",
      document_count: 0
    });

    const createdResponse = await app.inject({
      method: "POST",
      url: "/api/docs",
      payload: {
        title: "Padrão de correção de atividades",
        type: "process",
        category: "tutoria",
        tags: ["correção", "feedback", "senai"],
        summary: "Define o padrão de feedback usado para corrigir atividades dos alunos.",
        content: "# Padrão de correção de atividades\n\nConteúdo inicial de feedback.",
        priority: "high"
      }
    });
    expect(createdResponse.statusCode).toBe(201);
    const created = createdResponse.json();
    const documentId = created.metadata.id as string;
    expect(created.metadata.version).toBe(1);
    expect(created.path).toContain("docs/process/tutoria");

    const indexResponse = await app.inject({ method: "GET", url: "/api/index?type=process&tag=feedback" });
    expect(indexResponse.statusCode).toBe(200);
    expect(indexResponse.json().documents).toHaveLength(1);

    const readResponse = await app.inject({ method: "GET", url: `/api/docs/${documentId}` });
    expect(readResponse.statusCode).toBe(200);
    expect(readResponse.json().content).toContain("Conteúdo inicial");

    const searchResponse = await app.inject({
      method: "POST",
      url: "/api/search",
      payload: {
        query: "feedback correção",
        limit: 5
      }
    });
    expect(searchResponse.statusCode).toBe(200);
    expect(searchResponse.json().results[0].id).toBe(documentId);

    const updateResponse = await app.inject({
      method: "PUT",
      url: `/api/docs/${documentId}`,
      payload: {
        content: "# Padrão de correção de atividades\n\nNovo conteúdo de feedback.",
        summary: "Define o padrão atualizado de feedback usado em correções.",
        tags: ["correcao", "feedback"],
        expected_version: 1,
        change_summary: "Atualizado conteúdo de feedback."
      }
    });
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json().metadata.version).toBe(2);

    const conflictResponse = await app.inject({
      method: "PUT",
      url: `/api/docs/${documentId}`,
      payload: {
        content: "# Conflito",
        expected_version: 1,
        change_summary: "Tentativa com versão antiga."
      }
    });
    expect(conflictResponse.statusCode).toBe(409);

    const versionsResponse = await app.inject({ method: "GET", url: `/api/docs/${documentId}/versions` });
    expect(versionsResponse.statusCode).toBe(200);
    expect(versionsResponse.json().versions).toHaveLength(1);
    expect(versionsResponse.json().versions[0].version).toBe(1);

    const versionReadResponse = await app.inject({ method: "GET", url: `/api/docs/${documentId}/versions/1` });
    expect(versionReadResponse.statusCode).toBe(200);
    expect(versionReadResponse.json().content).toContain("Conteúdo inicial");

    const diffResponse = await app.inject({ method: "GET", url: `/api/docs/${documentId}/versions/1/diff` });
    expect(diffResponse.statusCode).toBe(200);
    expect(diffResponse.json().diff).toContain("Novo conteúdo");

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/api/docs/${documentId}`,
      payload: {
        reason: "Teste de lixeira"
      }
    });
    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteResponse.json().status).toBe("deleted");

    const readDeletedResponse = await app.inject({ method: "GET", url: `/api/docs/${documentId}` });
    expect(readDeletedResponse.statusCode).toBe(410);

    const deletedIndexResponse = await app.inject({ method: "GET", url: "/api/index?status=deleted" });
    expect(deletedIndexResponse.statusCode).toBe(200);
    expect(deletedIndexResponse.json().documents).toHaveLength(1);

    const restoreResponse = await app.inject({
      method: "POST",
      url: `/api/docs/${documentId}/restore`,
      payload: {
        reason: "Teste de restore"
      }
    });
    expect(restoreResponse.statusCode).toBe(200);
    expect(restoreResponse.json().metadata.status).toBe("active");

    const contextPackResponse = await app.inject({
      method: "POST",
      url: "/api/context-pack",
      payload: {
        goal: "Preparar uma conversa sobre feedback",
        query: "feedback correção",
        max_documents: 5,
        max_chars: 5000
      }
    });
    expect(contextPackResponse.statusCode).toBe(200);
    expect(contextPackResponse.json().selected_documents).toHaveLength(1);
    expect(contextPackResponse.json().context_markdown).toContain("Novo conteúdo");
  });

  it("serves and validates the OpenAPI YAML", async () => {
    const response = await app.inject({ method: "GET", url: "/openapi.yaml" });
    expect(response.statusCode).toBe(200);

    const parsed = YAML.parse(response.body);
    expect(parsed.openapi).toBe("3.1.0");
    expect(parsed.paths["/api/docs"].post.operationId).toBe("createMemoryDocument");
    expect(parsed.paths["/api/context-pack"].post.operationId).toBe("createContextPack");
  });
});

