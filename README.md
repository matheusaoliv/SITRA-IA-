# SITRA IA
## Sistema Inteligente de Trânsito e Recursos Administrativos

Plataforma de apoio à análise de defesas prévias e recursos administrativos de infrações de trânsito, com processamento documental, pesquisa jurídica assistida por IA, rastreabilidade das evidências e revisão humana obrigatória.

> **Regra institucional:** o SITRA IA não julga recursos nem emite decisões administrativas oficiais. A IA produz análises técnicas preliminares e minutas fundamentadas. A decisão cabe exclusivamente à autoridade ou ao colegiado legalmente competente.

## Estado atual

**Fase 3 em desenvolvimento: autenticação e controle de acesso.** A branch `feature/auth-rbac` parte da Fase 2 e acrescenta:
- Login e logout com sessão opaca em cookie HttpOnly.
- Senhas com Argon2id; token de sessão aleatório e armazenado somente como hash.
- Sessão com validade de oito horas e revogação no logout.
- Perfis por órgão e autorização no backend.
- Isolamento dos processos por órgão, sem confiar apenas nos filtros enviados pelo navegador.
- Gestão de membros e perfis por gestores do respectivo órgão.
- Auditoria de operações com identificação do usuário.
- Proteção de origem para operações de escrita e limitação de tentativas de login.
- Tela de login e redirecionamento de páginas sem sessão.
- Criação do primeiro administrador por comando local, sem cadastro público privilegiado.

Esta versão continua sendo um protótipo técnico. Não inserir documentos reais, CPF, dados pessoais ou informações processuais sigilosas. Não disponibilizar a API publicamente.

## Arquitetura
- **Web:** Next.js, React, TypeScript.
- **API:** NestJS, validação de DTOs, autenticação por sessão e Prisma.
- **Identidade:** Argon2id, sessões persistidas no PostgreSQL, autorização por perfil e órgão.
- **Worker documental/IA:** Python e FastAPI (base inicial).
- **Dados:** PostgreSQL e Redis.
- **Documentos:** futuro armazenamento privado compatível com S3.
- **Busca jurídica:** futuro RAG com fontes oficiais, vigência e histórico normativo.

## Executar localmente

Requisitos: Node.js 22+, npm 10+ e Docker Desktop ou Docker Engine.

1. Copie `.env.example` para `.env` na raiz.
2. Instale dependências: `npm install`.
3. Inicie PostgreSQL e Redis: `npm run db:up`.
4. Gere o Prisma Client: `npm run db:generate`.
5. Aplique o modelo ao banco de desenvolvimento: `npm run db:push`.
6. Crie o administrador inicial com as variáveis temporárias `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` (mínimo de 14 caracteres): `npm run admin:create`.
7. Remova a senha do ambiente e inicie a API: `npm run dev:api`.
8. Em outro terminal, inicie a interface: `npm run dev:web`.
9. Abra `http://localhost:3000/sign-in` e entre com a conta de administrador.

A API fica em `http://localhost:3001/api/v1`. O endpoint de saúde é `/health`.

O administrador global pode cadastrar órgãos. Em seguida, deve criar ou vincular gestores em `POST /organizations/:organizationId/members`. Gestores administram usuários apenas do próprio órgão.

## Perfis

- **Administrador global:** gerencia órgãos e possui acesso administrativo global.
- **Gestor:** administra os usuários e acompanha os processos do órgão ao qual está vinculado.
- **Protocolo:** registra processos no órgão autorizado.
- **Analista:** consulta e atualiza processos do órgão autorizado.
- **Autoridade de Trânsito, Membro da JARI e Presidente da JARI:** perfis reservados para módulos de competência e decisão, que ainda serão implementados.
- **Auditor:** perfil de consulta, sujeito às regras de escopo do órgão.

## Endpoints principais

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/organizations`
- `POST /api/v1/organizations` (administrador global)
- `GET/POST /api/v1/organizations/:organizationId/members` (gestor do órgão)
- `PATCH /api/v1/organizations/:organizationId/members/:userId` (gestor do órgão)
- `GET/POST /api/v1/processes`
- `GET/PATCH /api/v1/processes/:id`

## Segurança: limitações conhecidas

- MFA ainda não foi ativado.
- Recuperação de senha e verificação de e-mail dependem de integração de e-mail.
- O limitador de requisições atual usa memória local; produção com múltiplas réplicas exige armazenamento compartilhado, como Redis.
- A tela Next.js usa a presença do cookie apenas para redirecionamento; a API valida a sessão e as permissões em cada requisição.
- Testes automatizados, compilação, execução com banco e revisão independente ainda estão pendentes.
- Não usar dados reais nem expor o serviço publicamente antes de MFA, testes, revisão de segurança e avaliação LGPD.
- Prazos, competências e regras determinísticas deverão ser calculados por código testável, nunca exclusivamente por IA.

## Documentação
- [Visão de arquitetura](docs/architecture/OVERVIEW.md)
- [Política de decisão humana](docs/governance/HUMAN_DECISION_POLICY.md)
- [Linha de base de segurança](docs/security/BASELINE.md)
- [Fase 2: gestão de processos](docs/roadmap/PHASE-2.md)
- [Fase 3: autenticação e RBAC](docs/roadmap/PHASE-3-AUTH-RBAC.md)
