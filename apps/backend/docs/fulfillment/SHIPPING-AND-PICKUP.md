# Shipping and Pickup Readiness

## Escopo (Fase 16)
Implementação estrutural real para as opções de atendimento logístico (Fulfillment) da FriggaFrio.
A solução de entrega se divide em:
- **Retirada na Loja (Local Pickup)**: Endereços físicos e galpões.
- **Entrega Própria (Delivery)**: CEPs de abrangência das capitais cobertas pela frota interna.

## Regras Implementadas
- Não usar um provider fictício em Produção que force "Entrega Grátis para qualquer CEP". 
- Mesmo uma taxa custo zero ($0.00) deve passar pela configuração explícita de `shipping_option` atrelada à `region`.
- A API do frontend solicita os shipping options atrelados ao cart (onde o CEP já foi filtrado no passo Address).

## Ponto de Atenção: Módulos de Fulfillment
O Medusa v2 usa módulos modulares de Fulfillment. Como não fomos integrados com Correios, MelhorEnvio, etc., os métodos serão fixos via configuração no DB pelo painel de admin:
- Method 1: `Entrega Expressa`
- Method 2: `Retirada no Galpão Matriz`

Esses métodos devem ter restrição de zipcode range. O módulo responsável nativo de Fulfillment será inicializado pelo Admin Dashboard durante a entrada oficial de dados B2B do escopo Comercial. O backend API garante seu tráfego até lá.
