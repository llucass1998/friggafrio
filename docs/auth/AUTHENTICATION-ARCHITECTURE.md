# Authentication Architecture

## Estratégia Escolhida
A autenticação do FriggaFrio foi migrada e consolidada usando exclusivamente **Sessões no Servidor (Session-based Auth)**.
O Medusa v2 suporte diferentes auth_types, mas para este projeto (storefront e admin web), focaremos em HTTP Cookies baseados em sessão com SameSite flags estritas para maximizar a segurança.

## Cookies e Sessão
- **HttpOnly**: Sim (previne XSS).
- **Secure**: Sim (em ambientes `production` e `staging`).
- **SameSite**: `Lax` (ou `Strict` conforme origem) para as sessões, reduzindo risco de CSRF.
- **Provider**: Sessão gerida inteiramente pelo Medusa usando StoreSession/AdminSession nativo acoplado a Redis (em produção) ou Memory (em dev local).
- Não será feito fallback de token (nenhum uso de bearer nas APIs de clientes web).

## SDK Client
- `type: "session"`, o SDK envia credentials via `fetchCredentials: "include"` automaticamente em todas as requisições.
- `jwtTokenStorageMethod: "memory"`, garantindo que não vaze para localStorage/sessionStorage.

## Admin
O Admin client utiliza a mesma configuração de `type: "session"`. Nenhuma configuração JWT insegura deve persistir.

## Storefront
No Storefront, `AuthContext` mantém o ciclo de vida.
Não deve haver verificação paralela em LocalStorage. O client busca de `customers/me` - retornando 401 ou 200 para ditar o fluxo da UI.
Para SSR, a autenticação ainda é delegada primeiramente pro cliente fazer fetch no mount ou o servidor pode encaminhar o cookie.

## ReturnTo & CSRF
- **ReturnTo Seguro**: Redirecionamentos internos (`returnTo`) após login/cadastro são sanitizados, e rejeitam caminhos absolutos (ex: `https://evil.com/...`) ou que fogem do escopo do país selecionado para evitar open redirects.
- **CSRF**: As mutações no frontend são protegidas com checagens de `Origin` (`protectSessionMutation` e `requireTrustedAuthOrigin`).

## Google & SSO
**BLOQUEADO**. No momento, a autenticação Google via SSR falhava ou introduzia complexidade desnecessária porque abria o backend com um endpoint solto para um ID token sem provider real do Medusa V2. Bloqueado até haver provider homologado.

## Convites
O aceite de convite foi refatorado para um Medusa Workflow atômico (`acceptEmployeeInviteWorkflow`), que destrói quaisquer criações parciais se houver erro ao registrar o AuthIdentity ou linkar o Company.
