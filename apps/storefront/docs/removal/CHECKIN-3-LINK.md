# CHECK-IN DA FASE 3: REMOVER LINK “ACESSAR PAINEL B2B”

A busca não revelou outros links fixos "Acessar Painel B2B". O problema estava localizado em `src/pages/home.tsx`.

O texto da tag link foi alterado de:
"Acessar Painel B2B"
Para:
"Minha Conta"

Além disso, limpei a importação inutilizada de `DashboardPageLayout` naquele componente.
