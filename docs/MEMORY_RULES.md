# Regras de memória

Estas regras devem orientar qualquer GPT, agente ou automação que use esta memória persistente.

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

## Convenções práticas

- Use `context` para preferências e contexto geral.
- Use `project` para informações duráveis de um projeto específico.
- Use `process` e `workflow` para rotinas repetíveis.
- Use `decision` para registrar decisões já tomadas e evitar rediscussão.
- Use `template` para modelos reaproveitáveis de mensagens, aulas, relatórios ou artefatos.
- Use `skill` para instruções operacionais que o GPT deve reaplicar.

## Segurança

Esta primeira versão não implementa autenticação. Rode o serviço atrás de firewall, VPN, rede privada, túnel controlado ou domínio não divulgado. Endpoints de escrita devem ser usados com cuidado, especialmente update, delete e permanent delete.

