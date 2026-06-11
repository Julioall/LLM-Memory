# Politica de Privacidade

Ultima atualizacao: 11 de junho de 2026

Esta Politica de Privacidade descreve como o servico Persistent GPT Memory MCP, disponivel em `https://memory.novascript.com.br`, trata dados pessoais quando usado como memoria persistente externa para GPT Actions, ChatGPT Apps/MCP ou chamadas HTTP diretas.

Antes de publicar esta politica para usuarios finais, preencha os dados abaixo:

- Controlador: [preencher nome/razao social]
- CNPJ/CPF, se aplicavel: [preencher]
- Contato para privacidade: [preencher e-mail ou outro canal]
- Encarregado/DPO, se aplicavel: [preencher]

Este documento e um modelo operacional e deve ser revisado conforme o uso real do servico, os controles de acesso adotados e as obrigacoes legais aplicaveis.

## 1. Sobre o servico

O Persistent GPT Memory MCP e uma API privada para guardar memorias em documentos Markdown. O servico permite criar, consultar, atualizar, versionar, mover para lixeira e restaurar documentos usados como contexto por um GPT personalizado ou por um cliente MCP.

O servico nao e uma rede social, nao exibe publicidade e nao vende dados pessoais.

## 2. Dados que podem ser tratados

Dependendo do uso, o servico pode tratar:

- Conteudo inserido nos documentos de memoria, incluindo textos, resumos, processos, preferencias, decisoes, templates e historicos operacionais.
- Metadados dos documentos, como titulo, categoria, tags, prioridade, status, versao, datas de criacao e atualizacao.
- Consultas feitas ao indice ou a busca da memoria.
- Registros tecnicos necessarios para operacao, seguranca e diagnostico, como data/hora de requisicoes, endpoints acessados, erros de aplicacao, logs do servidor, logs do proxy e, conforme a infraestrutura, enderecos IP.

O servico nao deve ser usado para armazenar dados sensiveis, segredos, senhas, tokens, documentos de identidade, dados financeiros, dados de saude ou informacoes de criancas e adolescentes, salvo se houver base legal, controles de seguranca e autorizacao especifica para isso.

## 3. Finalidades do tratamento

Os dados sao tratados para:

- Fornecer memoria persistente ao GPT ou cliente autorizado.
- Localizar e recuperar contexto relevante em conversas futuras.
- Criar e manter documentos de referencia, processos, templates e decisoes.
- Preservar historico de versoes e permitir auditoria operacional.
- Diagnosticar falhas, monitorar disponibilidade e proteger o servico.
- Cumprir obrigacoes legais ou responder a solicitacoes legitimas de titulares, autoridades ou administradores responsaveis.

## 4. Bases legais

As bases legais podem variar conforme o contexto de uso. Em geral, o tratamento pode se apoiar em:

- Execucao de contrato ou procedimentos preliminares relacionados ao uso do servico.
- Legitimo interesse na operacao, seguranca, melhoria e continuidade da memoria persistente.
- Consentimento, quando o controlador optar por coletar autorizacao especifica.
- Cumprimento de obrigacao legal ou regulatoria, quando aplicavel.

O controlador deve avaliar a base legal adequada para cada uso concreto do servico.

## 5. Compartilhamento de dados

O servico pode compartilhar ou disponibilizar dados nas seguintes situacoes:

- Com o ChatGPT/OpenAI, quando o GPT chama Actions ou ferramentas MCP e recebe dados retornados pela API.
- Com provedores de hospedagem, infraestrutura, DNS, proxy, backup, monitoramento ou seguranca usados para operar o servico.
- Com pessoas autorizadas pelo controlador a administrar ou acessar a memoria.
- Com autoridades competentes, quando houver obrigacao legal ou ordem valida.

O conteudo retornado ao ChatGPT pode ser processado pela OpenAI conforme os termos, configuracoes e politicas aplicaveis a conta ou workspace usado no ChatGPT.

## 6. Transferencia internacional

Os dados podem ser acessados ou processados fora do Brasil quando houver uso de provedores internacionais, incluindo OpenAI/ChatGPT, hospedagem, logs, monitoramento ou outros servicos de infraestrutura. Nesses casos, o controlador deve avaliar as garantias aplicaveis conforme a LGPD e demais normas pertinentes.

## 7. Retencao e exclusao

Os documentos sao mantidos enquanto forem necessarios para as finalidades da memoria persistente ou ate que sejam removidos pelo controlador ou por usuario autorizado.

Por padrao, exclusoes movem documentos para a lixeira. Atualizacoes podem gerar versoes arquivadas para preservacao historica. A exclusao definitiva exige acao explicita no endpoint apropriado e pode nao remover imediatamente copias de backup ou logs tecnicos, que seguem prazos operacionais e de seguranca.

## 8. Direitos dos titulares

Nos termos da LGPD, titulares de dados pessoais podem solicitar, conforme aplicavel:

- Confirmacao da existencia de tratamento.
- Acesso aos dados.
- Correcao de dados incompletos, inexatos ou desatualizados.
- Anonimizacao, bloqueio ou eliminacao de dados desnecessarios, excessivos ou tratados em desconformidade.
- Portabilidade, observados os requisitos legais e regulamentares.
- Informacoes sobre compartilhamento de dados.
- Revogacao de consentimento, quando o tratamento se basear em consentimento.
- Revisao e oposicao, nos casos previstos em lei.

Para exercer direitos, use o canal de contato indicado no inicio desta politica.

## 9. Seguranca

O servico deve ser operado com HTTPS, controles de acesso, firewall, VPN, proxy autenticado, segregacao de permissoes, backup protegido e monitoramento adequado ao risco.

A versao atual do projeto nao implementa autenticacao propria por login, JWT, OAuth ou API key. Portanto, nao exponha o servico publicamente sem uma camada externa de protecao.

Nenhum sistema e totalmente imune a incidentes. Em caso de incidente relevante, o controlador deve avaliar medidas de mitigacao, comunicacao aos titulares e notificacao a autoridade competente quando exigido.

## 10. Responsabilidades do usuario e do administrador

Quem usa ou administra o servico deve:

- Evitar inserir dados pessoais desnecessarios.
- Evitar inserir dados sensiveis ou segredos.
- Conferir o conteudo antes de salvar memorias.
- Remover ou corrigir memorias inadequadas.
- Restringir acesso ao dominio, infraestrutura e credenciais.
- Revisar periodicamente documentos armazenados, logs, backups e permissoes.

## 11. Alteracoes nesta politica

Esta politica pode ser atualizada para refletir mudancas no servico, na infraestrutura, nas integracoes com ChatGPT/OpenAI ou nas exigencias legais. A data de ultima atualizacao sera ajustada quando houver alteracoes relevantes.

## 12. Referencias

- Lei Geral de Protecao de Dados Pessoais - LGPD: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- Autoridade Nacional de Protecao de Dados - ANPD: https://www.gov.br/anpd/pt-br
