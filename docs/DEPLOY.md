# Deploy em VPS

## Pré-requisitos

- VPS Debian ou Ubuntu.
- Porta 80 e 443 liberadas para o Caddy.
- Porta interna `APP_PORT` liberada apenas se você quiser testar diretamente.
- Domínio apontando para o IP da VPS.
- Repositório no GitHub com GitHub Actions habilitado.

## Variáveis e secrets no GitHub

Secrets obrigatórios:

- `VPS_HOST`: IP ou hostname da VPS.
- `VPS_USER`: usuário SSH.
- `VPS_SSH_KEY`: chave privada SSH.

Variables recomendadas:

- `APP_DOMAIN`: domínio público, por exemplo `memory.example.com`.
- `APP_PORT`: porta local da API na VPS, padrão `8787`.
- `VPS_APP_DIR`: pasta na VPS, padrão `/opt/persistent-gpt-memory-mcp`.
- `VPS_SSH_PORT`: porta SSH, padrão `22`.
- `COMPOSE_PROJECT_NAME`: padrão `persistent-gpt-memory-mcp`.
- `DATA_DIR`: padrão `/app/data`.

## Deploy automático

O workflow `.github/workflows/deploy-vps.yml` roda em push na branch `main` e também por `workflow_dispatch`.

Ele executa:

```bash
docker compose --env-file .env.production down --remove-orphans
docker compose --env-file .env.production up -d --build --remove-orphans
docker compose --env-file .env.production ps
docker image prune -f
```

Depois valida:

```bash
curl http://127.0.0.1:$APP_PORT/health
curl https://$APP_DOMAIN/health
```

## Backup

Todo dado persistente fica no volume Docker `memory_data`, montado em `/app/data` no container.

Backup simples na VPS:

```bash
docker run --rm \
  -v persistent-gpt-memory-mcp_memory_data:/data:ro \
  -v "$PWD:/backup" \
  alpine tar czf /backup/memory-data-backup.tgz -C /data .
```

## Restore

Pare a stack, restaure o volume e suba novamente:

```bash
docker compose --env-file .env.production down
docker run --rm \
  -v persistent-gpt-memory-mcp_memory_data:/data \
  -v "$PWD:/backup" \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/memory-data-backup.tgz -C /data"
docker compose --env-file .env.production up -d
```

## Segurança

Esta versão não tem login, JWT, OAuth ou cadastro. Use pelo menos uma destas proteções:

- Firewall permitindo acesso só do seu IP.
- VPN ou rede privada.
- Domínio não divulgado.
- Secure MCP Tunnel, Cloudflare Tunnel ou proxy com controle de acesso.
- Backup recorrente da pasta `data`.

