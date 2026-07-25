# FriggaFrio: Customer Registration Verification Checklist

Este checklist cobre todos os requisitos e validações aplicados na página de cadastro `apps/storefront/src/pages/register.tsx`, garantindo que B2C e B2B estejam totalmente suportados de forma segura e responsiva na mesma rota híbrida, em conformidade com as exigências LGPD da FriggaFrio.

## 1. Arquitetura e Roteamento
- [x] O frontend foi consolidado na rota `/account/register` (pt-BR).
- [x] Abas (Tabs) implementadas para separar o fluxo Pessoa Física (B2C) e Pessoa Jurídica (B2B).
- [x] `useHydrated` integrado para garantir estabilidade no SSR e prevenir hydration mismatch durante carregamento.

## 2. Formulário e Validação (Zod + React Hook Form)
- [x] Definição estrita no arquivo `schemas/register.ts`.
- [x] **Pessoa Física (B2C)**: Nome, Sobrenome, E-mail, CPF, Telefone, Senha.
- [x] **Pessoa Jurídica (B2B)**: Razão Social, CNPJ, E-mail, Telefone, Senha (nome comercial é separado por lógica específica no backend/Medusa).
- [x] Sanitização e stripping de caracteres especiais nos documentos (CPF/CNPJ) durante o envio.
- [x] LGPD: Checkbox obrigatório "Aceito os Termos de Privacidade e Condições de Uso" em ambos os fluxos.

## 3. Segurança e Compliance (Regras Críticas)
- [x] NENHUM documento (CPF/CNPJ) é armazenado em `localStorage`.
- [x] A senha NUNCA é adicionada a logs de console, estados globais desprotegidos ou sistemas de analytics.
- [x] Checkbox de visualização de senha ("mostrar/ocultar") não persiste a senha e respeita os padrões de segurança em UI.
- [x] Chamada RESTful isolada, os tokens sensíveis da SDK não são expostos na interface visual ou HTML renderizado.
- [x] O `VITE_MEDUSA_BACKEND_URL` foi devidamente configurado e sem falhas de SSR fallback para ambientes não autorizados, mitigando chamadas espúrias de desenvolvimento para a infra de produção.

## 4. Testes e Qualidade
- [x] Lint sem warnings (`pnpm --filter storefront run lint`).
- [x] Build limpo sem erros do Rollup (`pnpm --filter storefront run build`).
- [x] E2E Tests baseline carregando sem quebras de hidratação.
- [ ] Backend Persistence: Verificar persistência de CPF/CNPJ e termo de LGPD na interface de Admin e chamadas de integração da API do Medusa V2 no módulo Customer Profile.
- [ ] Teste de ponta a ponta (E2E) simulando falhas da API para checar o Toast de erro.

> *Última revisão após refatoração maciça na branch main.*