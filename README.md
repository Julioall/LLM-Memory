# Persistent GPT Memory MCP

Servidor de memória persistente privada para GPT Actions e MCP. Ele salva documentos Markdown com frontmatter YAML em arquivos locais, mantém um índice compacto em JSON, cria versões antes de updates, move exclusões para lixeira e gera context packs para novas conversas.

Esta primeira versão não usa banco de dados nem autenticação. Rode em ambiente controlado.

## Stack

- Node.js + TypeScript
- Fastify para REST
- SDK oficial MCP TypeScript (`@modelcontextprotocol/sdk`)
- Markdown + YAML frontmatter
- JSON local para índice e audit log
- Docker Compose + Caddy
- GitHub Actions para deploy em VPS

## Rodar localmente

```bash
npm install
npm run dev
```

Healthcheck:

```bash
curl http://127.0.0.1:8787/health
```

Com Docker:

```bash
cp .env.example .env.production
docker compose up -d --build
curl http://127.0.0.1:8787/health
```

## Endpoints principais

- `GET /health`
- `GET /api/index`
- `GET /api/docs`
- `POST /api/docs`
- `GET /api/docs/{id}`
- `PUT /api/docs/{id}`
- `DELETE /api/docs/{id}`
- `POST /api/docs/{id}/restore`
- `GET /api/docs/{id}/versions`
- `GET /api/docs/{id}/versions/{version}`
- `POST /api/docs/{id}/versions/{version}/restore`
- `POST /api/search`
- `POST /api/context-pack`
- `GET /openapi.yaml`
- `POST /mcp`

Exemplos completos estão em [docs/USAGE.md](docs/USAGE.md).

## GPT Actions

1. Faça deploy em HTTPS.
2. Abra `https://SEU_DOMINIO/openapi.yaml`.
3. No editor do GPT personalizado, vá até Actions e crie uma nova Action.
4. Importe o schema OpenAPI.
5. Configure Authentication como `None`.
6. Teste `getMemoryHealth`, `listMemoryIndex`, `searchMemory` e `createMemoryDocument`.
7. Cole as instruções de [docs/GPT_INSTRUCTIONS.md](docs/GPT_INSTRUCTIONS.md) nas instruções do GPT.

Referências oficiais úteis:

- GPT Actions: https://developers.openai.com/api/docs/actions/introduction
- Configuração de Actions: https://help.openai.com/en/articles/9442513-configuring-actions-in-gpts

## ChatGPT Apps / MCP

O endpoint MCP remoto é:

```txt
https://SEU_DOMINIO/mcp
```

Nas configurações atuais do ChatGPT, MCP remoto aparece no fluxo de Apps & Connectors para criar um app/conector em modo desenvolvedor. O servidor precisa estar acessível por HTTPS. Em desenvolvimento local, use um túnel seguro ou ferramenta equivalente.

Referências oficiais úteis:

- MCP para Apps/API: https://developers.openai.com/api/docs/mcp
- Conectar a partir do ChatGPT: https://developers.openai.com/apps-sdk/deploy/connect-chatgpt
- Developer mode: https://developers.openai.com/api/docs/guides/developer-mode

## Estrutura de dados

```txt
data/
├─ index.json
├─ docs/
├─ versions/
├─ trash/
├─ audit/
└─ templates/
```

Cada documento fica em Markdown com frontmatter YAML. O índice guarda apenas metadados e resumo, para o GPT decidir o que abrir sem ler todos os arquivos.

## Segurança

Não exponha este serviço publicamente sem proteção adicional. Como não há autenticação na v1, prefira firewall, VPN, túnel privado, domínio não divulgado ou proxy com controle de acesso. Exclusões normais vão para lixeira; exclusão definitiva exige endpoint separado com `confirm: "PERMANENT_DELETE"`.

## Deploy

Veja [docs/DEPLOY.md](docs/DEPLOY.md).

