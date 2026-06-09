# Uso local e exemplos HTTP

## Rodar localmente

```bash
npm install
npm run dev
```

Ou com Docker:

```bash
cp .env.example .env.production
docker compose up -d --build
```

Healthcheck:

```bash
curl http://127.0.0.1:8787/health
```

## Criar documento

```bash
curl -X POST http://127.0.0.1:8787/api/docs \
  -H "content-type: application/json" \
  -d '{
    "title": "Padrão de correção de atividades",
    "type": "process",
    "category": "tutoria",
    "tags": ["correcao", "feedback", "senai"],
    "summary": "Define o padrão de feedback usado para corrigir atividades dos alunos.",
    "content": "# Padrão de correção de atividades\n\nConteúdo do documento...",
    "priority": "high"
  }'
```

## Consultar índice

```bash
curl "http://127.0.0.1:8787/api/index?type=process&tag=feedback"
```

## Buscar documentos

```bash
curl -X POST http://127.0.0.1:8787/api/search \
  -H "content-type: application/json" \
  -d '{"query":"feedback correção", "limit": 5}'
```

## Ler documento

```bash
curl http://127.0.0.1:8787/api/docs/doc_20260609_abc123
```

## Atualizar documento

```bash
curl -X PUT http://127.0.0.1:8787/api/docs/doc_20260609_abc123 \
  -H "content-type: application/json" \
  -d '{
    "content": "# Padrão de correção de atividades\n\nNovo conteúdo...",
    "summary": "Define o padrão atualizado de feedback.",
    "tags": ["correcao", "feedback"],
    "expected_version": 1,
    "change_summary": "Atualizado critério de feedback."
  }'
```

## Listar e ler versões

```bash
curl http://127.0.0.1:8787/api/docs/doc_20260609_abc123/versions
curl http://127.0.0.1:8787/api/docs/doc_20260609_abc123/versions/1
```

## Restaurar versão antiga

```bash
curl -X POST http://127.0.0.1:8787/api/docs/doc_20260609_abc123/versions/1/restore \
  -H "content-type: application/json" \
  -d '{"reason":"Voltar ao padrão anterior"}'
```

## Mover para lixeira e restaurar

```bash
curl -X DELETE http://127.0.0.1:8787/api/docs/doc_20260609_abc123 \
  -H "content-type: application/json" \
  -d '{"reason":"Documento substituído por versão mais específica"}'

curl -X POST http://127.0.0.1:8787/api/docs/doc_20260609_abc123/restore \
  -H "content-type: application/json" \
  -d '{"reason":"Documento voltou a ser necessário"}'
```

## Gerar context pack

```bash
curl -X POST http://127.0.0.1:8787/api/context-pack \
  -H "content-type: application/json" \
  -d '{
    "goal": "Preparar uma nova conversa sobre correção de atividades",
    "query": "correção feedback tutoria",
    "max_documents": 5,
    "max_chars": 12000
  }'
```

## OpenAPI para GPT Actions

```bash
curl http://127.0.0.1:8787/openapi.yaml
```

## MCP

O endpoint remoto MCP fica em:

```txt
http://127.0.0.1:8787/mcp
```

Em produção, use HTTPS:

```txt
https://seu-dominio.com/mcp
```

O servidor usa Streamable HTTP em modo stateless e expõe tools como `memory_index_list`, `memory_search`, `memory_doc_read`, `memory_doc_create`, `memory_doc_update`, `memory_doc_delete`, `memory_versions_list` e `memory_context_pack`.

