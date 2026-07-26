# Fase 1: Auditoria da Tela de Cadastro
Iniciando auditoria...

## Rota e Componentes
- Rota encontrada: `/src/routes/$countryCode/account/register.tsx` apontando para `RegisterPage` em `/src/pages/register.tsx`
- A página utiliza os passos: `company`, `admin`, `review`.

## Configuração do País e Erros
- O idioma estava inglês (First name, Last name, City, State, etc).
- As opções do select country eram "United States", "Canada", etc., sem "Brasil".
- Havia referência hardcoded ao e-mail "support@proliftequipment.com" que sobrou do boilerplate.
- Fluxo de requisição passava apenas para B2B com `registerCompany` com campos custom.

## Risco de CustomerProvider / Flow
- A rota só prevê "company" -> "admin".
- A instrução é permitir PF e PJ no modelo de uma loja e-commerce (B2C/B2B híbrido) para a FriggaFrio.
- Será necessário reformular esse formulário B2B complexo em abas para um único formulário que alterne condicionalmente e chame a `sdk.auth.register` oficial ou lógica B2C normal que é mantida no framework Medusa V2.


## Persistência B2B vs B2C
- Não existe `customer_profile` implementado visivelmente no frontend local ou data fetching.
- Há o `getMe()` mas retorna B2B `CustomerWithEmployee`.
- O registro é todo voltado para `registerCompany()` que chama `POST /store/company` na Medusa (endpoint custom B2B provável).
- Para permitir Pessoa Física (B2C nativo do Medusa V2), será necessário fazer a chamada direta ao AuthModule de criação de customer (`sdk.auth.register("customer", "emailpass", { ... })`). Para pessoa jurídica vamos analisar como está estruturado o POST.
- Será criado uma única página `/account/register` brasileira híbrida que alterna de PF e PJ em TABS, coletando `metadata` para o que ainda não houver endpoint específico (ou faremos override).

## Teste de Baseline
O sistema foi auditado. Passos de Lints e Builds foram executados no comando anterior.
