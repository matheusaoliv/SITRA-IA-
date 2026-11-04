# Visão de arquitetura

## Componentes
- Web institucional em Next.js/TypeScript.
- API NestJS para autenticação, processos, permissões e auditoria.
- Worker Python para OCR, extração documental e orquestração de agentes.
- PostgreSQL como fonte transacional; Redis para filas.
- Armazenamento privado de documentos, com URLs temporárias e criptografia.
- RAG jurídico com fontes oficiais, vigência e histórico normativo.

## Fluxo documental
Upload seguro -> hash e validação -> OCR -> extração estruturada com página/trecho -> validação -> análise especializada -> revisão independente -> parecer preliminar -> conferência humana.

Prazos, competências e regras determinísticas devem ser calculados por código testável, nunca exclusivamente por geração de IA.
