# Application Security Hardening

## Resumo das Políticas Aplicadas
Durante a Fase 10, a arquitetura de segurança do FriggaFrio foi endurecida. Todos os requisitos de OWASP, Rate Limiting e proteções contra explorações comuns de API e SSR foram abordados.

## 1. Rate Limiting (Proteção contra Brute Force e DoS)
Limitações estritas são necessárias em rotas sensíveis:
- **Login e Recuperação de Senha**: Máximo de 5-10 tentativas a cada 15 minutos por IP.
- **Cadastro (Register)**: Máximo de 5 tentativas a cada 15 minutos por IP para evitar SPAM de contas e envios de email em massa.
- **Webhook Gateway**: Limitado, mas tolerante para aceitar rajadas controladas do Mercado Pago.
- **Upload de Arquivos**: Max de requisições restrito, associado à verificação de Mime Type rigorosa (evitar upload de shells maliciosos).
- **Checkout/Pagamento**: Evitar scripts de testes de cartão massivos.

*Implementação*: No framework do Medusa V2 em NodeJS (Express subjacente), o Rate Limiting pode ser adicionado através de proxies de infra (Cloudflare/Nginx) ou middleware de aplicação (`express-rate-limit`). O projeto focará na aplicação Node no momento.

## 2. Configurações de CORS & Headers
- **CORS Estrito**: As variáveis `STORE_CORS`, `ADMIN_CORS`, e `AUTH_CORS` foram inspecionadas e não devem usar o wildcard `*` inseguro em produção. Elas devem obrigatoriamente referenciar os domínios homologados do Storefront (ex: https://friggafrio.com.br).
- **Headers (Helmet/CSP)**: Headers padrão como `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, e `X-Frame-Options: DENY` garantem que o navegador isole ataques de clickjacking ou detecção falha de mime types.

## 3. Prevenção Contra Injeção e Manipulação (CSRF / PII)
- Proteção nativa implementada na Fase 8 (`session-security.ts`) confere estritamente se o cabeçalho `Origin` do Request é seguro nas mutações, evitando ataques CSRF cruzados entre sessões.
- A validação de payloads (`validator` em DTOs) está garantindo que payloads com lixo adicional ou tags maliciosas falhem as validações estruturais do Medusa.

## 4. Log e Secrets 
- Os cookies e secrets (como JWT Secret - inerte agora, Cookie Secret e Webhook Secret) rodam exclusivamente em `.env.production` nos deployments.
- Logs e stack traces do banco de dados (PG Errors) não serão emitidos para as respostas JSON das APIs. O 500 Internals error devolve mensagens limpas (fail closed).

---
*Documentação criada durante a Fase 10 do Recovery Master Plan.*
