# Fase 3: autenticação, autorização e isolamento

## Implementado na branch feature/auth-rbac

- Login e logout por sessão opaca armazenada em cookie HttpOnly.
- Token aleatório de 256 bits; somente o hash SHA-256 do token é persistido.
- Sessões com validade de oito horas, revogação no logout e bloqueio de contas desativadas.
- Senhas com Argon2id.
- Limite de cinco tentativas por minuto no endpoint de login e limite geral por rota.
- Verificação de origem nas operações que alteram dados, além de CORS com credenciais e origens explícitas.
- Perfis vinculados por órgão: Gestor, Protocolo, Analista, Autoridade de Trânsito, Membro da JARI, Presidente da JARI e Auditor.
- Administrador global inicial criado somente por comando local.
- Gestão de vínculos e perfis por gestores do respectivo órgão.
- Processos e órgãos filtrados pelas organizações às quais o usuário está vinculado.
- Auditoria de login, logout, criação de usuários, alteração de perfil, criação de órgão e operações de processo.
- Middleware do Next.js que encaminha usuários sem cookie de sessão à tela de login.

## Endpoints

- POST /api/v1/auth/login
- POST /api/v1/auth/logout
- GET /api/v1/auth/me
- GET /api/v1/organizations
- POST /api/v1/organizations (administrador global)
- GET /api/v1/organizations/:organizationId/members (gestor do órgão)
- POST /api/v1/organizations/:organizationId/members (gestor do órgão)
- PATCH /api/v1/organizations/:organizationId/members/:userId (gestor do órgão)
- GET /api/v1/processes
- POST /api/v1/processes
- GET /api/v1/processes/:id
- PATCH /api/v1/processes/:id

## Preparação local

1. Atualize as dependências com npm install.
2. Gere o Prisma Client com npm run db:generate.
3. Aplique o schema ao banco de desenvolvimento com npm run db:push.
4. Crie o administrador inicial definindo ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD (mínimo 14 caracteres) e executando npm run admin:create.
5. Inicie a API e a interface normalmente.

O administrador global pode cadastrar os órgãos. Depois, deve vincular gestores e demais usuários aos respectivos órgãos.

## Limitações e validações pendentes

- MFA ainda não está ativado; deve ser implantado antes de uma operação institucional real.
- Recuperação de senha e verificação de e-mail dependem de integração de e-mail ainda não configurada.
- O limitador de requisições usa armazenamento em memória e não é compartilhado entre réplicas. Produção horizontal exige armazenamento distribuído, preferencialmente Redis.
- O middleware do Next.js verifica a presença do cookie apenas para navegação. A API valida criptograficamente a sessão e continua sendo a autoridade de autorização.
- A sessão e a autorização precisam de testes automatizados, teste de integração e revisão de segurança.
- A aplicação ainda não foi compilada nem executada contra banco nesta entrega.
- Não inserir dados reais nem disponibilizar publicamente até concluir os testes, MFA, recuperação de conta, revisão de segurança e avaliação LGPD.
- Nenhuma IA pode decidir recursos; decisões administrativas continuam humanas.
