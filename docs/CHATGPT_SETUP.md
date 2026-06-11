# Configurar no ChatGPT

Este projeto pode ser conectado ao ChatGPT de duas formas:

- **GPT personalizado com Actions**: caminho recomendado hoje. Usa `https://SEU_DOMINIO/openapi.yaml` e os endpoints REST do servidor.
- **ChatGPT App / MCP remoto**: caminho avancado para testar o endpoint `https://SEU_DOMINIO/mcp` como app/conector em modo desenvolvedor.

Use o caminho de Actions primeiro. Ele ja esta descrito pelo schema OpenAPI deste repositorio e funciona sem adicionar codigo de autenticacao.

## Pre-requisitos

1. O deploy precisa estar ativo em HTTPS.
2. O dominio precisa responder:

```bash
curl -fsS https://SEU_DOMINIO/health
curl -fsS https://SEU_DOMINIO/openapi.yaml
```

3. No schema `openapi.yaml`, confirme que o servidor aponta para o dominio correto. O schema deste projeto ja aponta para:

```yaml
servers:
  - url: https://memory.novascript.com.br
```

Se voce trocar o dominio do deploy, edite o bloco `servers` no editor da Action para usar:

```yaml
servers:
  - url: https://SEU_DOMINIO
```

## Caminho recomendado: GPT personalizado com Actions

1. Abra o ChatGPT e crie ou edite um GPT personalizado.
2. Na tela de configuracao do GPT, preencha nome e descricao.
3. Cole o conteudo de `docs/GPT_INSTRUCTIONS.md` no campo de instrucoes do GPT.
4. Abra a secao **Actions**.
5. Crie uma nova Action.
6. Em **Authentication**, escolha **None**.
7. No campo de politica de privacidade, use:

```txt
https://SEU_DOMINIO/privacy
```

8. Importe ou cole o schema OpenAPI:

```txt
https://SEU_DOMINIO/openapi.yaml
```

Se a interface nao importar por URL, abra essa URL no navegador, copie o YAML completo e cole no editor de schema da Action.

9. Salve a Action e teste pelo menos estas operacoes:

- `getMemoryHealth`
- `listMemoryIndex`
- `searchMemory`
- `createMemoryDocument`
- `readMemoryDocument`
- `createContextPack`

10. Publique o GPT como privado ou restrito ao workspace.

## Prompts de teste

Use estes prompts depois de salvar a Action:

```txt
Verifique se a memoria persistente esta disponivel.
```

Resultado esperado: o GPT chama `getMemoryHealth` e informa status `ok`.

```txt
Liste o indice da memoria e me diga quais documentos existem, sem ler o conteudo completo.
```

Resultado esperado: o GPT chama `listMemoryIndex`.

```txt
Procure memorias relacionadas a deploy, VPS, Caddy ou ChatGPT Actions.
```

Resultado esperado: o GPT chama `searchMemory`.

```txt
Crie uma memoria curta do tipo process, categoria chatgpt, com o titulo "Teste de configuracao ChatGPT", resumo "Documento temporario para validar a Action", tags ["teste", "chatgpt"], prioridade low e conteudo Markdown dizendo que a integracao foi validada.
```

Resultado esperado: o GPT chama `createMemoryDocument`. Depois do teste, remova o documento para a lixeira se nao quiser manter essa memoria.

## Comportamento esperado do GPT

O GPT deve seguir estas regras:

- Consultar `listMemoryIndex` ou `searchMemory` antes de ler documentos completos.
- Ler apenas os documentos relevantes.
- Usar `createContextPack` quando precisar reunir contexto de varios documentos.
- Criar memoria nova somente depois de buscar duplicatas.
- Atualizar documento existente quando o assunto ja existir.
- Usar `expected_version` ao editar documentos.
- Mover para lixeira por padrao; exclusao permanente so com pedido explicito.

Essas regras ja estao resumidas em `docs/GPT_INSTRUCTIONS.md`.

## Problemas comuns em Actions

### O GPT nao chama a Action

Verifique:

- As instrucoes mencionam quando consultar a memoria.
- O schema foi salvo sem erro.
- O bloco `servers` aponta para `https://SEU_DOMINIO`.
- Os nomes e descricoes das operacoes continuam claros no OpenAPI.

### A Action falha com erro de rede

Teste fora do ChatGPT:

```bash
curl -fsS https://SEU_DOMINIO/health
curl -fsS https://SEU_DOMINIO/openapi.yaml
```

Se esses comandos falharem, resolva DNS, Caddy, certificado TLS ou deploy antes de mexer no GPT.

### A Action falha com autenticacao

Este projeto atualmente declara `security: []` no OpenAPI e nao implementa login, OAuth, JWT ou API key. Portanto, no ChatGPT Actions use **Authentication: None**.

Antes de compartilhar o GPT com outras pessoas, proteja o servidor por firewall, VPN, proxy autenticado, Cloudflare Access, OAuth/API key no proprio app ou outro controle equivalente.

## Alternativa: ChatGPT App / MCP remoto

O endpoint MCP deste servidor fica em:

```txt
https://SEU_DOMINIO/mcp
```

Use este caminho se voce quiser testar o servidor como app/conector em modo desenvolvedor.

Fluxo geral:

1. No ChatGPT, abra **Settings -> Apps & Connectors -> Advanced settings**.
2. Ative **Developer mode**, se sua organizacao permitir.
3. Volte para **Settings -> Apps & Connectors** e clique em **Create**.
4. Preencha:
   - **Name**: `Persistent GPT Memory`
   - **Description**: `Busca, le e atualiza memorias persistentes em Markdown para apoiar conversas futuras.`
   - **Connector URL**: `https://SEU_DOMINIO/mcp`
5. Salve e confira se o ChatGPT lista ferramentas como:
   - `memory_index_list`
   - `memory_search`
   - `memory_doc_read`
   - `memory_doc_create`
   - `memory_doc_update`
   - `memory_context_pack`
   - `memory_health`

Depois, em uma nova conversa, adicione o app pelo botao **+** perto da caixa de mensagem e teste:

```txt
Use o app Persistent GPT Memory para procurar memorias sobre deploy.
```

### Limitacao atual do MCP

O MCP deste repositorio expoe ferramentas `memory_*`, que sao boas para uso como ferramentas de app. Para uso como **Company Knowledge** ou **Deep Research**, a documentacao oficial recomenda ferramentas read-only chamadas `search` e `fetch`, com schemas de resposta especificos. Este repositorio ainda nao implementa essa camada de compatibilidade.

### Autenticacao no MCP

O servidor MCP atual tambem nao implementa OAuth. Se o ChatGPT exigir politica de autenticacao por ferramenta, sera necessario adicionar `securitySchemes` `noauth` ou implementar OAuth conforme a documentacao do Apps SDK. Para uso imediato, prefira GPT Actions.

## Referencias oficiais

- GPT Actions: https://developers.openai.com/api/docs/actions/getting-started
- Conectar app/MCP no ChatGPT: https://developers.openai.com/apps-sdk/deploy/connect-chatgpt
- MCP para ChatGPT Apps e API: https://developers.openai.com/api/docs/mcp
- Autenticacao em Apps SDK: https://developers.openai.com/apps-sdk/build/auth
