# Route & Link Audit

## Objetivos (Fase 11)
- Identificar e eliminar passivos de migração em hiperlinks do frontend (ex: `href="#"`, `href="/undefined"`).
- Garantir que todos os Providers (ex: AuthProvider e CartProvider) mantenham as queries saudáveis sem falhas de SSR/Dehydrated State.
- Remover rotas de dashboard antigo e lixo B2B (ex: `/b2b`, `/dashboard`) se eles estouraram fora do fluxo isolado do Admin.
- Testar Hidratação da aplicação Next/Vite.

## Verificador
Os componentes serão rastreados contra as bad-practices abaixo:
- Links mortos para a Home: Devem usar rota canônica (ex: `<LocalizedClientLink href="/">`).
