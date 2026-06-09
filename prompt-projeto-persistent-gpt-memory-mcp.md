# Prompt de Elaboração do Projeto — Persistent GPT Memory MCP

Você é um arquiteto de software sênior e engenheiro DevOps. Quero que você elabore e implemente um projeto completo chamado **Persistent GPT Memory MCP**, com o objetivo de funcionar como uma memória persistente privada para uso em um GPT personalizado/ChatGPT.

## 1. Objetivo do projeto

Criar um servidor MCP e uma API REST compatível com GPT Actions para permitir que o GPT:

- Crie documentos de contexto persistentes.
- Leia documentos salvos.
- Edite documentos existentes.
- Apague documentos quando necessário.
- Liste documentos por tipo, tema, projeto, tag ou prioridade.
- Pesquise documentos por palavra-chave ou similaridade textual simples.
- Consulte um índice antes de decidir quais documentos ler.
- Registre skills, prompts, processos, templates, instruções, padrões e decisões de projeto.
- Mantenha versionamento dos arquivos.
- Recupere versões antigas.
- Gere pacotes de contexto compactos para uso em novas conversas.
- Armazene tudo em arquivos locais na VPS, sem banco de dados obrigatório na primeira versão.

Este projeto será usado inicialmente por uma única pessoa. Não precisa de autenticação, cadastro de usuários, login, JWT, OAuth, Keycloak ou painel administrativo.

Mesmo sem autenticação, o projeto deve ser pensado para rodar em ambiente controlado, preferencialmente protegido por firewall, VPN/rede privada ou domínio não divulgado.

---

## 2. Stack desejada

Use a stack mais rápida e simples para subir em produção.

Preferência:

- Node.js + TypeScript.
- Fastify ou Express para a API REST.
- SDK oficial do MCP em TypeScript para o servidor MCP.
- Armazenamento em arquivos locais.
- Markdown para conteúdo textual.
- JSON/YAML para metadados, índice e configuração.
- Docker e Docker Compose.
- Caddy para HTTPS automático.
- GitHub Actions para deploy em VPS, seguindo um modelo semelhante ao workflow `deploy-vps.yml` enviado como referência.

Não usar banco de dados na primeira versão, a não ser que seja estritamente necessário. Se quiser preparar suporte futuro para SQLite/Postgres, deixar como melhoria futura, não como dependência inicial.

---

## 3. Estrutura esperada do projeto

Criar uma estrutura parecida com esta:

```txt
persistent-gpt-memory-mcp/
├─ src/
│  ├─ server.ts
│  ├─ mcp/
│  │  ├─ mcp-server.ts
│  │  ├─ tools.ts
│  │  └─ resources.ts
│  ├─ api/
│  │  ├─ routes.docs.ts
│  │  ├─ routes.index.ts
│  │  ├─ routes.versions.ts
│  │  ├─ routes.search.ts
│  │  └─ routes.system.ts
│  ├─ storage/
│  │  ├─ file-store.ts
│  │  ├─ index-store.ts
│  │  ├─ version-store.ts
│  │  └─ trash-store.ts
│  ├─ schemas/
│  │  ├─ document.schema.ts
│  │  ├─ index.schema.ts
│  │  └─ tool.schema.ts
│  ├─ services/
│  │  ├─ memory.service.ts
│  │  ├─ search.service.ts
│  │  ├─ version.service.ts
│  │  └─ context-pack.service.ts
│  └─ utils/
│     ├─ slug.ts
│     ├─ markdown.ts
│     ├─ dates.ts
│     └─ validation.ts
├─ data/
│  ├─ index.json
│  ├─ docs/
│  ├─ versions/
│  ├─ trash/
│  ├─ audit/
│  └─ templates/
├─ openapi/
│  └─ gpt-actions.yaml
├─ docs/
│  ├─ README.md
│  ├─ USAGE.md
│  ├─ MEMORY_RULES.md
│  ├─ DEPLOY.md
│  └─ GPT_INSTRUCTIONS.md
├─ tests/
├─ Dockerfile
├─ docker-compose.yml
├─ Caddyfile
├─ .env.example
├─ package.json
├─ tsconfig.json
└─ .github/
   └─ workflows/
      └─ deploy-vps.yml
```

---

## 4. Modelo de armazenamento

A memória será baseada em arquivos.

### 4.1 Documento principal

Cada documento deve ser salvo em Markdown com frontmatter YAML.

Exemplo:

```md
---
id: "doc_20260609_abc123"
slug: "padrao-correcao-atividades"
title: "Padrão de correção de atividades"
type: "process"
category: "tutoria"
tags:
  - "correcao"
  - "feedback"
  - "senai"
status: "active"
priority: "high"
created_at: "2026-06-09T14:00:00-03:00"
updated_at: "2026-06-09T14:00:00-03:00"
version: 1
summary: "Define o padrão de feedback usado para corrigir atividades dos alunos."
---

# Padrão de correção de atividades

Conteúdo do documento...
```

### 4.2 Tipos de documento

Suportar pelo menos estes tipos:

- `context`: contexto geral.
- `skill`: habilidade/instrução reutilizável.
- `prompt`: prompt reutilizável.
- `process`: processo operacional.
- `template`: modelo de documento, mensagem, aula ou artefato.
- `project`: contexto de projeto.
- `decision`: decisão tomada.
- `reference`: referência técnica.
- `workflow`: fluxo de trabalho.
- `correction_criteria`: critérios de correção.
- `class_plan`: padrão ou contexto de plano de aula.

### 4.3 Índice global

Manter um arquivo:

```txt
data/index.json
```

Esse índice deve permitir que o GPT consulte primeiro uma lista resumida dos documentos, sem precisar ler todos os arquivos.

Exemplo de estrutura:

```json
{
  "version": 1,
  "updated_at": "2026-06-09T14:00:00-03:00",
  "documents": [
    {
      "id": "doc_20260609_abc123",
      "slug": "padrao-correcao-atividades",
      "title": "Padrão de correção de atividades",
      "type": "process",
      "category": "tutoria",
      "tags": ["correcao", "feedback", "senai"],
      "status": "active",
      "priority": "high",
      "summary": "Define o padrão de feedback usado para corrigir atividades dos alunos.",
      "path": "docs/process/tutoria/padrao-correcao-atividades.md",
      "updated_at": "2026-06-09T14:00:00-03:00",
      "version": 1
    }
  ]
}
```

O índice deve ser atualizado automaticamente quando documentos forem criados, editados, apagados ou restaurados.

---

## 5. Regras de memória

Criar um arquivo `docs/MEMORY_RULES.md` explicando as regras que o GPT deve seguir.

Regras obrigatórias:

1. Nunca ler todos os documentos sem necessidade.
2. Sempre consultar o índice antes de ler documentos específicos.
3. Usar busca por tag, tipo, categoria ou termo antes de abrir documentos completos.
4. Criar documentos curtos, objetivos e reutilizáveis.
5. Evitar duplicidade: antes de criar um novo documento, pesquisar se já existe algo semelhante.
6. Ao editar documento, criar uma versão anterior automaticamente.
7. Nunca apagar definitivamente por padrão; mover para `trash`.
8. Permitir exclusão definitiva apenas por endpoint específico.
9. Registrar toda alteração no audit log.
10. Manter summaries atualizados.
11. Todo documento deve ter `title`, `type`, `tags`, `summary`, `status` e `version`.
12. Para conteúdo grande, criar documentos separados por tema, em vez de um arquivo gigante.
13. Para uso em conversa, gerar um `context_pack` com apenas os documentos relevantes.

---

## 6. Versionamento

Implementar versionamento simples em arquivos.

Sempre que um documento for editado:

- Copiar a versão anterior para `data/versions/{document_id}/v{n}.md`.
- Incrementar o campo `version`.
- Atualizar `updated_at`.
- Registrar alteração em `data/audit/audit-log.jsonl`.

Exemplo de log:

```json
{"timestamp":"2026-06-09T14:00:00-03:00","action":"update","document_id":"doc_20260609_abc123","old_version":1,"new_version":2,"summary":"Atualizado critério de nota máxima."}
```

Criar funções para:

- Listar versões.
- Ler versão específica.
- Restaurar versão.
- Comparar versão atual com versão anterior, se possível.

---

## 7. Ferramentas MCP

Criar ferramentas MCP bem separadas, com uma ação por ferramenta.

Ferramentas mínimas:

### `memory_index_list`

Use quando o GPT precisar ver quais documentos existem sem abrir o conteúdo completo.

Entrada:

```json
{
  "type": "string opcional",
  "category": "string opcional",
  "tag": "string opcional",
  "status": "active | archived | deleted opcional",
  "limit": "number opcional"
}
```

Saída:

```json
{
  "documents": [
    {
      "id": "string",
      "title": "string",
      "type": "string",
      "tags": ["string"],
      "summary": "string",
      "updated_at": "string",
      "version": 1
    }
  ]
}
```

### `memory_search`

Use quando o GPT precisar encontrar documentos por termo, tema ou intenção.

Entrada:

```json
{
  "query": "string",
  "types": ["string"],
  "tags": ["string"],
  "limit": 10
}
```

### `memory_doc_read`

Use quando o GPT já souber qual documento precisa ler.

Entrada:

```json
{
  "id": "string"
}
```

### `memory_doc_create`

Use quando o GPT precisar registrar uma nova memória, skill, prompt, processo ou template.

Entrada:

```json
{
  "title": "string",
  "type": "context | skill | prompt | process | template | project | decision | reference | workflow | correction_criteria | class_plan",
  "category": "string",
  "tags": ["string"],
  "summary": "string",
  "content": "string markdown",
  "priority": "low | medium | high"
}
```

### `memory_doc_update`

Use quando o GPT precisar editar um documento existente.

Entrada:

```json
{
  "id": "string",
  "content": "string markdown",
  "summary": "string opcional",
  "tags": ["string"] opcional,
  "expected_version": 1,
  "change_summary": "string"
}
```

A ferramenta deve recusar a edição se `expected_version` for diferente da versão atual.

### `memory_doc_delete`

Mover para lixeira, não apagar definitivamente.

Entrada:

```json
{
  "id": "string",
  "reason": "string"
}
```

### `memory_doc_restore`

Restaurar documento da lixeira.

### `memory_versions_list`

Listar versões de um documento.

### `memory_version_read`

Ler versão antiga.

### `memory_version_restore`

Restaurar versão antiga como versão atual.

### `memory_context_pack`

Gerar um pacote de contexto compacto para uma conversa.

Entrada:

```json
{
  "goal": "string",
  "query": "string",
  "max_documents": 5,
  "max_chars": 12000
}
```

Saída:

```json
{
  "goal": "string",
  "selected_documents": [],
  "context_markdown": "string"
}
```

### `memory_health`

Retornar status do servidor, caminho de armazenamento, quantidade de documentos e última atualização do índice.

---

## 8. API REST para GPT Actions

Além do servidor MCP, criar API REST com endpoints equivalentes.

Endpoints mínimos:

```txt
GET    /health
GET    /api/index
GET    /api/docs
POST   /api/docs
GET    /api/docs/{id}
PUT    /api/docs/{id}
DELETE /api/docs/{id}
POST   /api/docs/{id}/restore
GET    /api/docs/{id}/versions
GET    /api/docs/{id}/versions/{version}
POST   /api/docs/{id}/versions/{version}/restore
POST   /api/search
POST   /api/context-pack
GET    /openapi.yaml
```

Também servir o YAML em:

```txt
/openapi.yaml
```

---

## 9. Arquivo YAML para GPT Actions

Gerar o arquivo:

```txt
openapi/gpt-actions.yaml
```

Requisitos:

- OpenAPI 3.1.
- Sem autenticação.
- `servers` apontando para variável de domínio configurável.
- Descrições claras para o GPT saber quando usar cada endpoint.
- Schemas completos.
- Operation IDs claros, como:
  - `listMemoryIndex`
  - `searchMemory`
  - `createMemoryDocument`
  - `readMemoryDocument`
  - `updateMemoryDocument`
  - `deleteMemoryDocument`
  - `createContextPack`
  - `listDocumentVersions`
  - `restoreDocumentVersion`

Incluir no README instruções de como importar esse YAML em um GPT personalizado como Action.

---

## 10. Instruções para o GPT personalizado

Criar o arquivo:

```txt
docs/GPT_INSTRUCTIONS.md
```

Ele deve conter instruções para o GPT usar a memória.

Instruções obrigatórias:

```md
# Instruções de uso da memória persistente

Você tem acesso a uma memória persistente externa.

Antes de responder tarefas que dependam de histórico, padrões, processos, templates, skills, projetos ou preferências operacionais, consulte a memória.

Fluxo recomendado:

1. Use `listMemoryIndex` ou `memory_index_list` para verificar os documentos disponíveis.
2. Use `searchMemory` ou `memory_search` para localizar documentos relevantes.
3. Leia apenas os documentos necessários.
4. Use `createContextPack` quando precisar reunir contexto de vários documentos.
5. Ao finalizar um processo novo e reutilizável, salve um documento.
6. Ao alterar um processo existente, edite o documento em vez de criar duplicata.
7. Nunca leia todos os documentos sem necessidade.
8. Nunca apague definitivamente sem pedido explícito.
9. Sempre preserve versões.
10. Prefira documentos curtos e bem categorizados.
```

---

## 11. Deploy em VPS

Criar deploy seguindo o modelo do workflow `deploy-vps.yml` enviado como referência, mas simplificado.

Não incluir:

- Keycloak.
- JWT.
- OAuth.
- Cadastro de usuários.
- Banco Postgres obrigatório.
- Secrets de autenticação da aplicação.

Incluir:

- Deploy por GitHub Actions.
- Trigger em push na branch `main`.
- `workflow_dispatch`.
- Validação dos secrets mínimos:
  - `VPS_HOST`
  - `VPS_USER`
  - `VPS_SSH_KEY` ou senha SSH
- Variáveis:
  - `VPS_APP_DIR`, padrão `/opt/persistent-gpt-memory-mcp`
  - `VPS_SSH_PORT`, padrão `22`
  - `APP_PORT`, padrão `8787`
  - `APP_DOMAIN`
  - `COMPOSE_PROJECT_NAME`, padrão `persistent-gpt-memory-mcp`
  - `DATA_DIR`, padrão `/app/data`
- Instalação automática de `rsync`, `curl`, Docker e Docker Compose se não existirem.
- Correção de repositório Docker em Debian, se necessário.
- Sincronização com `rsync`.
- Geração de `.env.production`.
- Execução de:
  - `docker compose --env-file .env.production down --remove-orphans`
  - `docker compose --env-file .env.production up -d --build --remove-orphans`
  - `docker compose ps`
  - `docker image prune -f`
- Healthcheck local:
  - `curl http://127.0.0.1:$APP_PORT/health`
- Healthcheck HTTPS:
  - `curl https://$APP_DOMAIN/health`

---

## 12. Docker Compose

Criar `docker-compose.yml` com:

- Serviço `app`.
- Serviço `caddy`.
- Volume persistente para `data`.
- Restart policy.
- Healthcheck.

Exemplo conceitual:

```yaml
services:
  app:
    build: .
    container_name: persistent-gpt-memory-app
    restart: unless-stopped
    env_file:
      - .env.production
    volumes:
      - memory_data:/app/data
    ports:
      - "${APP_PORT}:8787"

  caddy:
    image: caddy:2
    container_name: persistent-gpt-memory-caddy
    restart: unless-stopped
    depends_on:
      - app
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config

volumes:
  memory_data:
  caddy_data:
  caddy_config:
```

---

## 13. Caddyfile

Criar `Caddyfile` para expor:

```txt
{$APP_DOMAIN} {
  reverse_proxy app:8787
}
```

Garantir que `/health`, `/mcp` e `/openapi.yaml` estejam acessíveis.

---

## 14. README

Criar um README completo com:

- O que é o projeto.
- Para que serve.
- Como rodar localmente.
- Como testar a API.
- Como testar o MCP.
- Como configurar o GPT Action com o YAML.
- Como conectar no ChatGPT como MCP Connector, se aplicável.
- Como fazer deploy na VPS.
- Quais secrets configurar no GitHub.
- Como fazer backup da pasta `data`.
- Como restaurar backup.
- Cuidados de segurança por não usar autenticação.

---

## 15. Testes

Criar testes para:

- Criar documento.
- Atualizar documento.
- Gerar versão.
- Ler documento.
- Pesquisar documento.
- Atualizar índice.
- Mover para lixeira.
- Restaurar documento.
- Gerar context pack.
- Validar OpenAPI YAML.
- Validar healthcheck.

---

## 16. Critérios de aceite

O projeto só estará pronto quando:

1. Rodar localmente com `docker compose up -d --build`.
2. Responder `GET /health`.
3. Servir `/openapi.yaml`.
4. Expor endpoint MCP em `/mcp`.
5. Criar documentos.
6. Ler documentos.
7. Editar documentos com versionamento.
8. Mover documentos para lixeira.
9. Restaurar documentos.
10. Atualizar o índice automaticamente.
11. Gerar context packs.
12. Ter deploy automático para VPS via GitHub Actions.
13. Ter documentação clara.
14. Não exigir login, cadastro, JWT, OAuth ou Keycloak.

---

## 17. Entregáveis finais

Entregue:

1. Código-fonte completo.
2. `Dockerfile`.
3. `docker-compose.yml`.
4. `Caddyfile`.
5. `.env.example`.
6. `.github/workflows/deploy-vps.yml`.
7. `openapi/gpt-actions.yaml`.
8. `docs/GPT_INSTRUCTIONS.md`.
9. `docs/MEMORY_RULES.md`.
10. `README.md`.
11. Testes automatizados.
12. Exemplos de chamadas HTTP.
13. Exemplos de uso pelo GPT.
14. Explicação de como conectar no ChatGPT.

---

## 18. Observação importante

Como a primeira versão não terá autenticação, não exponha endpoints destrutivos sem cuidado.

Mesmo sem login, implementar pelo menos:

- Lixeira em vez de delete definitivo.
- Versionamento automático.
- Confirmação lógica via campo `reason` em exclusões.
- `expected_version` em edições.
- Audit log.
- Limite de tamanho por documento.
- Sanitização de path para evitar path traversal.
- Slugs seguros.
- Bloqueio para arquivos fora da pasta `data`.

Não implementar recursos desnecessários na primeira versão. Priorizar simplicidade, deploy rápido e confiabilidade.
