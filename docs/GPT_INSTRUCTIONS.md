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

## Regras adicionais

- Antes de criar uma memória nova, use busca para verificar se já existe documento parecido.
- Ao editar, informe `expected_version` igual à versão atual para evitar sobrescrever alterações.
- Ao apagar, use apenas lixeira por padrão e registre um `reason`.
- Para documentos longos, divida por tema e relacione por tags.
- Atualize o `summary` sempre que a mudança alterar o significado do documento.

