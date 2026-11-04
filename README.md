# SITRA IA
## Sistema Inteligente de Trânsito e Recursos Administrativos

Plataforma de apoio à análise de defesas prévias e recursos administrativos de infrações de trânsito, com processamento documental, pesquisa jurídica assistida por IA, rastreabilidade das evidências e revisão humana obrigatória.

> **Regra institucional:** o SITRA IA não julga recursos nem emite decisões administrativas oficiais. A IA produz análises técnicas preliminares e minutas fundamentadas. A decisão cabe exclusivamente à autoridade ou ao colegiado legalmente competente.

## Estado atual

**Fase 2 em desenvolvimento: gestão de processos.** A branch `feature/process-management` contém:
- Cadastro e consulta de órgãos.
- Cadastro, listagem, pesquisa e visualização detalhada de processos.
- Atualização controlada de andamento, com transições permitidas no backend.
- Registro de eventos de criação e alteração na tabela de auditoria.
- Modelo Prisma para organizações, processos, documentos, pareceres, revisões humanas, decisões e logs.
- Interface inicial conectada à API.

Esta versão ainda é um protótipo técnico. Não inserir documentos reais, CPF, dados pessoais ou informações processuais sigilosas. Não disponibilizar a API publicamente.

## Arquitetura
- **Web:** Next.js, React, TypeScript.
- **API:** NestJS, validação de DTOs e Prisma.
- **Worker documental/IA:** Python e FastAPI (base inicial).
- **Dados:** PostgreSQL e Redis.
- **Documentos:** futuro armazenamento privado compatível com S3.
- **Busca jurídica:** futuro RAG com fontes oficiais, vigência e histórico normativo.

## Estrutura
```
apps/
  web/       # Interface institucional
  api/       # API e regras de negócio
  worker/    # OCR, documentos e orquestração de IA
database/
  prisma/    # Modelo de dados
docs/
  architecture/
  governance/
  security/
  roadmap/
infra/
  docker/
```

## Executar localmente

Requisitos: Node.js 22+, npm 10+ e Docker Desktop ou Docker Engine.

1. Copie `.env.example` para `.env` na raiz.
2. Inicie PostgreSQL e Redis: `npm run db:up`.
3. Instale dependências: `npm install`.
4. Gere o Prisma Client: `npm run db:generate`.
5. Aplique o modelo ao banco de desenvolvimento: `npm run db:push`.
6. Inicie a API em um terminal: `npm run dev:api`.
7. Inicie a interface em outro terminal: `npm run dev:web`.
8. Abra `http://localhost:3000`.

A API fica em `http://localhost:3001/api/v1`. O endpoint de saúde é `/health`.

### Primeiros passos na interface
Cadastre um órgão no formulário de novo processo. Depois, selecione o órgão e cadastre um processo de teste com dados fictícios. A lista permite pesquisar e abrir a ficha do processo.

## Endpoints implementados
- `GET /api/v1/health`
- `GET /api/v1/organizations`
- `POST /api/v1/organizations`
- `GET /api/v1/processes` (filtros: `organizationId`, `status`, `search`, `page`, `limit`)
- `POST /api/v1/processes`
- `GET /api/v1/processes/:id`
- `PATCH /api/v1/processes/:id`

## Limitações e segurança
- Autenticação, MFA, autorização por perfil/órgão, gestão de sessão e isolamento multi-tenant ainda não estão implementados.
- O upload seguro de PDFs, OCR, RAG e agentes de IA ainda não estão implementados.
- A trilha de auditoria registra eventos básicos; proteção contra adulteração, identidade do autor e controles de retenção ainda precisam ser implementados.
- Não expor a API à internet nem usar dados reais antes de implementar e validar controles de segurança, privacidade e governança.
- Prazos, competências e regras determinísticas deverão ser calculados por código testável, nunca exclusivamente por IA.

## Documentação
- [Visão de arquitetura](docs/architecture/OVERVIEW.md)
- [Política de decisão humana](docs/governance/HUMAN_DECISION_POLICY.md)
- [Linha de base de segurança](docs/security/BASELINE.md)
- [Plano de implementação](docs/roadmap/PHASE-1.md)
- [Fase 2: gestão de processos](docs/roadmap/PHASE-2.md)
