# Route Authorization Matrix

Esta matriz documenta o mapeamento rigoroso de permissões e autorizações das rotas da API e Storefront da FriggaFrio, atendendo ao requisito de Hardening e Autorização (Fase 9).

## Regras Gerais
1. **Visitantes** (Unauthenticated) não podem acessar rotas de `customer` (/me, /orders, /quotes), nem a área Admin.
2. **Clientes** (Customer) podem acessar e mutar SOMENTE recursos pertencentes ao seu ID (`customer_id`). Um Customer B não pode interagir com o Order do Customer A. O backend deve validar essa propriedade através de policy ou validação explícita no endpoint.
3. **Funcionários** (Employee - Admin B2B) possuem acesso as configurações da sua própria Empresa/Filial.
4. **Webhook** deve estar protegido via assinatura criptográfica/secret e não depender de Sessão padrão (Origin).
5. Rotas públicas não podem exportar dados sensíveis nem expor enumeração de IDs do banco de dados (exemplo: `GET /store/orders/1` precisa retornar 404 seguro ao invés de Forbidden para não dar fuzzing de IDs).

## Matriz de Rotas (Storefront - Autenticada / B2C e B2B)

| Rota / Endpoint | Método | Visibilidade | Role Necessária | Recurso / Escopo | Sensibilidade | Rate Limit | Testes / Regras de Bloqueio |
|-----------------|--------|--------------|-----------------|------------------|---------------|------------|-----------------------------|
| `/store/customers/me` | GET | Protegido | Cliente | Perfil próprio | Média (PII) | Padrão | Deve retornar 401 p/ Visitante |
| `/store/customers/register` | POST | Público | Nenhuma | N/A | Alta | Restrito | Não deve criar identidade parcial |
| `/store/auth/session` | POST | Público | Nenhuma | Sessão | Crítico | Restrito | Evitar Brute-force/Credential Stuffing |
| `/store/orders` | GET | Protegido | Cliente | Pedidos próprios | Alta | Padrão | Não expor orders de outro `customer_id` |
| `/store/orders/[id]` | GET | Protegido | Cliente | Pedido específico | Alta | Padrão | Validar se order pertence à request session |
| `/store/quotes` | GET/POST | Protegido | Cliente | Orçamentos | Média | Restrito | Validar propriedade do quote |
| `/store/company/*` | GET/POST | Protegido | Funcionário/Admin | Empresa da sessão| Alta (B2B)| Padrão | Checar `company_id` |
| `/admin/*` | ANY | Privado | SuperAdmin | Tudo | Crítico | Restrito | Acesso bloqueado pra Cliente comum |
| `/store/checkout` | POST | Protegido | Cliente | Carrinho da sessão | Financeira | Restrito | Validar ownership do cart vs customer |
| `/hooks/payment` | POST | Webhook | Serviço | Gateway | Crítica | Restrito | Assinatura validada e Origin ignorado |

## Critérios de Teste de Autorização a Implementar

- [ ] **Acesso Cruzado**: Tentar ler `GET /store/orders/:id_do_cliente_B` usando o cookie do Cliente A (deve retornar 404).
- [ ] **Admin por Cliente**: Cliente comum tenta chamar endpoint de Admin API (deve retornar 401/403).
- [ ] **Alteração de Propriedades Restritas**: Cliente envia JSON no PUT tentando alterar `status` do pedido ou `price` (deve ser rejeitado/ignorado).
- [ ] **Fuzzing de IDs (Enumerabilidade)**: Solicitações de IDs inexistentes devem ter a mesma resposta (404) de solicitações não autorizadas para IDs existentes, evitando que um invasor saiba que um pedido existe.
- [ ] **Webhook Falso**: Enviar POST simulando pagamento do Mercado Pago sem a assinatura `x-signature` (deve retornar 400 ou 401 genérico).
- [ ] **Rate Limiting**: Disparar scripts contra `/store/auth/session` para garantir throttling de IPs após N tentativas.

---
*Matriz gerada durante a Fase 9 da reconstrução de Segurança.*
