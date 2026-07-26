# CHECK-IN DA FASE 6: MINHA CONTA B2C

## Overview das Páginas B2B a serem convertidas:
- `orders.tsx`: Fica disponível. Ele tem uma checagem local `if (!isAuthenticated)`. O layout já está configurado na wrapper genérica (`<div className="max-w-7xl...">`) e sem Sidebar, rodando dentro de `PublicLayout`. 
- `settings.tsx`: Utiliza recursos avançados de B2B, como status da companhia (`company.status`). Isso precisará ser desativado ou ocultado, mas em termos de roteamento, a UI agora carrega de forma idêntica a qualquer página pública. 
- `employees.tsx`, `quotes.tsx`: Rotas puras de B2B. A menos que precisem ser deletadas totalmente agora (mas isso exigiria limpeza massiva nas APIs e contextos), elas estão isoladas. O plano é limpar qualquer refração de Sidebar (já feito).

## Redirecionamento e Segurança
As páginas não quebram ao carregar em formato B2C. O estado do Redirecionamento `/account` não entra em loops porque o `layout.tsx` aceita o contexto B2C de forma universal.

O E2E teste para `test-auth-protection-e2e.spec.ts` passará na medida que o login e redirecionamentos forem mantidos conforme verificado na FASE 2.

A rota Minha Conta é a Home do painel (`account` redirect para base). Como removemos o link "Painel", "Minha conta" direciona para `/$countryCode/account`.
