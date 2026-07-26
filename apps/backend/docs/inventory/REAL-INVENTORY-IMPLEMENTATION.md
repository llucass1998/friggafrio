# Real Inventory Implementation

## Objetivo (Fase 13)
A plataforma FriggaFrio abandonou o modelo simplório de "estoque infinito". Cada item no carrinho agora possui um espelho direto com a API de Controle de Estoque de Depósitos, permitindo:
- Configuração Real de `Inventory Item`.
- Gerenciamento de Múltiplos `Stock Location`.
- Associação aos `Sales Channel`.
- Reservas de Estoque no fluxo do carrinho.

## Regras de Concorrência e Reserva
O Medusa V2 resolve concorrências no sistema de Reservas de forma assíncrona.
- Não usar `manage_inventory: false` de maneira cega nos produtos de prateleira (Gases Freon). 
- Uma variante não deve possuir falso positivo (vender se quantidade reservada + quantidade pedida exceder quantidade existente).
- **Testes de Concorrência**: Carrinhos com o mesmo item devem respeitar o limite disponível. O último clique perde no momento em que tenta prosseguir pro checkout, onde a Reserva falha por falta de fundos de estoque.

## Integração
No futuro, o estoque será alimentado via webhook por um sistema interno/ERP, o que significa que o endpoint `/store/carts/:id/complete` SEMPRE deve respeitar e checar o inventário em tempo real usando o SDK `inventoryModuleService.confirmInventory(...)` implementado pela arquitetura do framework.
