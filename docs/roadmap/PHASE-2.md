# Fase 2: gestão de processos administrativos

## Entregas implementadas nesta branch
- Cadastro e listagem de órgãos.
- Cadastro de processos com protocolo, tipo, requerente, auto de infração, data da infração e assunto.
- Pesquisa por protocolo, nome do requerente e auto de infração.
- Filtros por situação e paginação na API.
- Ficha detalhada do processo.
- Transições de andamento controladas no backend.
- Eventos básicos de auditoria na criação e atualização.
- Modelos de banco para documentos, pareceres, revisões e decisões futuras.

## Regras de fluxo
- Processo novo inicia em RECEBIDO.
- RECEBIDO -> EM_TRIAGEM.
- EM_TRIAGEM -> EM_ANALISE.
- EM_ANALISE -> AGUARDANDO_REVISAO.
- O endpoint genérico de atualização não pode definir DECIDIDO. Essa situação será consequência de um registro próprio de decisão humana, implementado em etapa posterior.
- O sistema não oferece exclusão física de processos nesta fase.

## Pendências antes de uso institucional
1. Autenticação, MFA e autorização RBAC.
2. Isolamento de dados por órgão e escopo do usuário no backend.
3. Identificação do autor em cada evento de auditoria.
4. Política de retenção, exportação e descarte.
5. Testes unitários, integração, carga e segurança.
6. Revisão jurídica e de proteção de dados.
7. Migrações versionadas e rotina de backup/restore.

## Critério de aceite
- Criar órgão e processo de teste.
- Consultar lista, pesquisar e filtrar.
- Abrir a ficha completa.
- Atualizar apenas para a próxima situação permitida.
- Confirmar evento de auditoria para criação e atualização.
- Confirmar que tentativa de definir DECIDIDO pelo endpoint genérico é rejeitada.
