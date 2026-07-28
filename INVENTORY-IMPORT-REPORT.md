# Relatório de Importação de Estoque FriggaFrio — DRY-RUN

> **ATENÇÃO:** Este relatório é público e versionado. Não contém valores de custo individuais.
> Gerado em: 2026-07-28
> Fase: INVENTÁRIO 0-A — DRY-RUN COMPLETO

---

## 1. Identidade

| Campo                   | Valor                                      |
|-------------------------|--------------------------------------------|
| Modelo                  | claude-sonnet-5                            |
| Fase                    | INVENTÁRIO 0-A                             |
| Repositório             | https://github.com/llucass1998/friggafrio  |
| Diretório Principal     | `C:\Users\lluca\Documents\Codex\projeto friggagafrio` |

---

## 2. Commit Base

| Campo                           | Valor                                          |
|---------------------------------|------------------------------------------------|
| Commit Base Anterior (Bloqueado)| `48c785288ff139b08e2cc367e6c6bb8fe8e8dc03`    |
| Commit Base Autorizado          | `9e1fadf8157a455cd9d9569c9c73598bf0b1ebdf`    |
| Commit Base Real                | `9e1fadf8157a455cd9d9569c9c73598bf0b1ebdf`    |
| Base Anterior é Ancestral       | Sim — commit `48c7852` é pai direto de `9e1fadf` |

---

## 3. Branch e Worktree

| Campo            | Valor                                                       |
|------------------|-------------------------------------------------------------|
| Worktree Criado  | `C:\Users\lluca\Documents\Codex\friggafrio-inventory`      |
| Branch Criada    | `feat/medusa-inventory-import`                              |
| HEAD do Worktree | `9e1fadf8157a455cd9d9569c9c73598bf0b1ebdf`                 |
| Working Tree     | Limpa (apenas arquivos novos não commitados)               |

Arquivos B.2-B preservados e intactos:
- `apps/backend/src/workflows/update-company/index.ts` — NÃO MODIFICADO
- `apps/backend/src/workflows/update-company/__tests__/create-account-holder-contracts.unit.spec.ts` — NÃO MODIFICADO
- `docs/recovery/PHASE-2.1-C-CREATE-ACCOUNT-HOLDER-AUDIT.md` — NÃO MODIFICADO

---

## 4. Fonte da Planilha

| Campo              | Valor                                                              |
|--------------------|--------------------------------------------------------------------|
| URL                | https://docs.google.com/spreadsheets/d/1gHTqPeQG8wV_YbkNTS-_dGAqtCXbse3O1VSTQS4VDiI/edit |
| Exportação XLSX    | https://docs.google.com/spreadsheets/d/1gHTqPeQG8wV_YbkNTS-_dGAqtCXbse3O1VSTQS4VDiI/export?format=xlsx |
| Armazenamento local| `C:\Users\lluca\Documents\Codex\friggafrio-inventory-data\ESTOQUE.xlsx` |
| Dentro do Git      | **NÃO**                                                           |

---

## 5. SHA-256 da Planilha

```
690A5647C1818C17CD0C0BA725C1FD2CF3093EB9B4FEB7A6C76B01242FF84226
```

---

## 6. Abas Encontradas

| Aba       | Status           | Produtos |
|-----------|------------------|----------|
| GAS       | Encontrada ✓     | 43       |
| EMBRACO   | Encontrada ✓     | 77       |
| ELGIN     | Encontrada ✓     | 326      |
| TECUMSEH  | Encontrada ✓     | 87       |
| COBRE     | Encontrada ✓     | 54       |

Todas as 5 abas esperadas foram encontradas.

---

## 7. Colunas Encontradas

| Coluna    | Status          | Observação                                 |
|-----------|-----------------|--------------------------------------------|
| CODIGO    | Encontrada ✓    | Usado como SKU                             |
| DESCRIÇAO | Encontrada ✓    | Usado como title                           |
| UNIDADE   | Encontrada ✓    | Mapeado para unit_type                     |
| QUANTIDADE| Encontrada ✓    | Quantidade em estoque                      |
| VALOR     | Encontrada ✓    | Custo interno (não exposto publicamente)   |

Nenhuma coluna desconhecida encontrada.

---

## 8. Quantidade de Linhas

| Descrição                        | Quantidade |
|----------------------------------|------------|
| Total de linhas válidas          | 587        |
| Total de SKUs únicos             | 587        |
| SKUs duplicados na planilha      | 0          |

---

## 9. SKUs Únicos e Duplicados

- **SKUs únicos:** 587
- **SKUs duplicados na planilha:** 0 (nenhum conflito de SKU na origem)
- **SKUs duplicados no Medusa:** 0

---

## 10. Produtos por Aba

| Aba      | Quantidade |
|----------|------------|
| GAS      | 43         |
| EMBRACO  | 77         |
| ELGIN    | 326        |
| TECUMSEH | 87         |
| COBRE    | 54         |
| **Total**| **587**    |

---

## 11. Unidades Encontradas

| Unidade Original | unit_type mapeado | Observação                          |
|------------------|-------------------|-------------------------------------|
| KG               | kg                | Estratégia pendente de validação    |
| UN, PC, PEÇA, PÇ | unit              | Mapeamento padrão                   |
| LATA             | can               | Mapeamento padrão                   |
| (outros)         | unknown           | Reportado sem bloquear              |

---

## 12. Quantidades Positivas, Zeradas e Negativas

| Classificação          | Quantidade |
|------------------------|------------|
| Quantidade > 0         | 184        |
| Quantidade = 0         | 397        |
| Quantidade < 0         | 6          |
| Quantidade fracionada KG | 79       |

**NEGATIVE_STOCK:** 6 produtos com quantidade negativa classificados como `INACTIVE_NEGATIVE_STOCK`.
Estoque operacional permanece como 0 nesta fase — não será enviado valor negativo para a API.

---

## 13. Custos Válidos

- **396** itens com custo de compra válido (VALID)

> Valores individuais não listados neste relatório público.

---

## 14. Custos Ausentes, Zerados e Suspeitos

| Classificação           | Quantidade | Critério                           |
|-------------------------|------------|------------------------------------|
| VALID (custo válido)    | 396        | Valor > 0, diferente de R$ 1,00   |
| SUSPICIOUS              | 95         | Valor = R$ 1,00 (possível placeholder) |
| ZERO                    | 19         | Valor = R$ 0,00                    |
| MISSING (ausente/nulo)  | 77         | Célula vazia, null ou não numérico |

> **Nota de segurança:** Valores individuais de custo NÃO constam neste relatório.
> Consulte o manifesto privado em `C:\Users\lluca\Documents\Codex\friggafrio-inventory-data\reports\`.

---

## 15. Regra de Markup de 30%

```
preço_de_venda = custo_de_compra × 1.30
arredondamento = Math.round(preco * 100) / 100  (2 casas decimais, BRL)
```

Exemplos sem revelar custo real:

| Custo Hipotético | Preço Sugerido |
|------------------|----------------|
| R$ 100,00        | R$ 130,00      |
| R$ 50,00         | R$ 65,00       |
| R$ 33,33         | R$ 43,33       |

**Função:** `calculateSuggestedSalePrice(cost: number | null): number | null`

Regras implementadas:
- Custo ausente ou nulo → retorna `null` (sem preço de venda público)
- Custo negativo → retorna `null`
- Custo zero → preço = 0 (não publicado automaticamente)
- Custo SUSPICIOUS (R$ 1,00) → preço calculado mas produto fica inativo

---

## 16. Convenção Monetária do Medusa (v2.18)

**Verificação realizada via análise do projeto e documentação do módulo de pricing.**

- O Medusa v2 recebe `amount` como número floating-point (ex.: `1299.90`)
- NÃO usa multiplicação de centavos (diferente do v1 onde $12,99 = `1299`)
- Moeda: `BRL` (Real Brasileiro)
- `amount` = valor decimal diretamente

---

## 17. Estratégia de Produtos KG

**Status: PENDENTE DE VALIDAÇÃO TÉCNICA — 79 produtos bloqueados**

A unidade `KG` representa quantidade física em quilogramas.
O campo `stocked_quantity` no Medusa v2 pode não suportar decimais seguros.

**Estratégia proposta (aguardando aprovação):**

```
Escala: 1 kg = 1.000 unidades internas (gramas)
Exemplo: 11,35 kg → 11.350 unidades internas
Apresentação no Storefront: calcular exibição em kg a partir do valor interno
```

**NÃO IMPLEMENTADA nesta fase.** Requer:
1. Confirmação do tipo de `stocked_quantity` no schema instalado
2. Aprovação explícita
3. Ajuste no Storefront para exibição correta
4. Validação de carrinho

Todos os 79 produtos KG permanecem no plano como `INACTIVE/DRAFT`.

---

## 18. Auditoria do Catálogo Atual (Medusa)

| Entidade           | Quantidade |
|--------------------|------------|
| Produtos           | 97         |
| Variantes          | 119        |
| Inventory Items    | 50         |
| Inventory Levels   | 46         |

> Todos os produtos atuais são **dados de demonstração** (seed do Medusa).
> Nenhum SKU da planilha FriggaFrio existe no catálogo atual.

---

## 19–24. Classificação do Catálogo Atual

| Ação               | Quantidade | Descrição                                                   |
|--------------------|------------|-------------------------------------------------------------|
| KEEP_AND_UPDATE    | 0          | Nenhum SKU em comum entre planilha e Medusa                 |
| DEACTIVATE         | 0          | Nenhum existente a desativar                                |
| REMOVE_CANDIDATE   | 0          | Conservado como UNKNOWN_REFERENCE                           |
| ARCHIVE_REQUIRED   | 0          | A determinar na Fase 0-B                                    |
| CONFLICT           | 0          | Nenhum SKU duplicado                                        |
| UNKNOWN_REFERENCE  | 119        | Variantes existentes (demo), ausentes na planilha           |

---

## 25. Stock Locations

| Campo              | Valor                    |
|--------------------|--------------------------|
| Total encontradas  | 1                        |
| Nome               | Main Warehouse           |
| Recomendada        | Main Warehouse (única)   |

---

## 26. Sales Channels

| Nome                  | Desabilitado |
|-----------------------|--------------|
| Default Sales Channel | Não          |

---

## 27. Coleções e Organização

| Aba de Origem | Coleção Proposta    | Existe no Medusa   |
|---------------|---------------------|--------------------|
| GAS           | Gás Refrigerante    | Não — criar        |
| COBRE         | Cobre               | Não — criar        |
| EMBRACO       | Embraco             | Não — criar        |
| ELGIN         | Elgin               | Não — criar        |
| TECUMSEH      | Tecumseh            | Não — criar        |

> **Nenhuma coleção criada nesta fase.**

---

## 28. Plano CREATE

- **587 novos produtos** a serem criados na Fase 0-B
- SKU = CODIGO da planilha (preservado exatamente)
- Title = DESCRIÇAO normalizada
- manage_inventory = true
- Moeda: BRL
- Metadata pública permitida: `source_sheet`, `source_sku`, `original_unit`, `unit_type`, `import_source`, `import_file_sha256`
- **Custo de compra NÃO salvo em metadata pública**

Status planejado por produto:

| Status               | Quantidade |
|----------------------|------------|
| Candidato a ATIVO    | ~105       |
| INACTIVE_ZERO_STOCK  | 397        |
| INACTIVE_NEGATIVE    | 6          |
| INACTIVE_MISSING_COST| 77         |
| INACTIVE_ZERO_COST   | 19         |
| INACTIVE_SUSPICIOUS  | 95         |
| KG_STRATEGY_PENDING  | 79         |

---

## 29–32. Plano UPDATE / INACTIVE / ARCHIVE / REMOVE

- **UPDATE:** 0
- **INACTIVE:** Todos os 587 CREATE que não atendem critério de ativação
- **ARCHIVE:** 0 nesta fase
- **REMOVE:** 0 — nenhuma remoção sem aprovação

---

## 33–37. Ações Futuras para Medusa Demo (119 UNKNOWN_REFERENCE)

Ação futura proposta (após aprovação):

- Produtos sem referência histórica → REMOVE_CANDIDATE
- Produtos com referência histórica → ARCHIVE_REQUIRED
- Não determinar sem auditoria de pedidos/carrinho

---

## 38. Erros Bloqueantes

**De responsabilidade desta fase:** Nenhum.

**Erros pré-existentes na base `9e1fadf` (não introduzidos por este agente):**
- `create-account-holder-contracts.unit.spec.ts` linhas 151, 174, 204: `StepResponse`, `CreateAccountHolderStepResult`, `CreateAccountHolderCompensationData` não encontrados
- `src/api/store/customer-profile/route.ts` linhas 53, 97, 147, 153: `'unknown'` type
- `src/api/store/employees/[id]/route.ts` linha 84: `'unknown'` type

> É proibido modificar esses arquivos nesta fase.

---

## 39. Backup Criado

| Campo          | Valor                                                              |
|----------------|--------------------------------------------------------------------|
| Criado         | Sim                                                               |
| Caminho        | `C:\Users\lluca\Documents\Codex\friggafrio-inventory-data\backups\medusa-inventory-before-import-2026-07-28-001741.json` |
| SHA-256        | `51FD3EFEB409F269B18C3608FC11E354289E1026CE27A69702224CCEBE99801F` |
| Tamanho        | ~373 KB                                                           |
| Commitado      | **NÃO**                                                           |
| Dentro do Git  | **NÃO**                                                           |

---

## 40. Prova de Zero Gravações

```
DRY_RUN:                  true
WRITE OPERATIONS:         0
PRODUCTS CREATED:         0
PRODUCTS UPDATED:         0
PRODUCTS DELETED:         0
PRODUCTS ARCHIVED:        0
INVENTORY LEVELS UPDATED: 0
PRICES UPDATED:           0
COLLECTIONS CREATED:      0
BANCO ALTERADO:           NÃO
NEON ALTERADO:            NÃO
```

**Prova de idempotência:** Dry-run executado **duas vezes** com mesma planilha e mesmo estado do Medusa.
Resultado: idêntico em ações, contagens e ordenação. Diferença apenas em timestamp e caminho do backup.

---

## 41. Testes

| Arquivo de Teste                              | Resultado |
|-----------------------------------------------|-----------|
| `normalizer.unit.spec.ts`                     | PASSOU ✓  |
| `price.unit.spec.ts`                          | PASSOU ✓  |
| `plan.unit.spec.ts`                           | PASSOU ✓  |
| `index.unit.spec.ts`                          | PASSOU ✓  |

| Suítes | Coletados | Executados | Aprovados | Falhos | Ignorados |
|--------|-----------|------------|-----------|--------|-----------|
| 19     | 188       | 188        | 188       | 0      | 0         |

---

## 42. Gates

| Gate      | Comando                           | Exit Code | Resultado                              |
|-----------|-----------------------------------|-----------|----------------------------------------|
| TypeCheck | `pnpm --filter backend typecheck` | 2         | ⚠️ FALHOU (erros pré-existentes B.2-B) |
| Lint      | `pnpm --filter backend lint`      | 0         | ✅ PASSOU                              |
| Testes    | `pnpm --filter backend test:unit` | 0         | ✅ PASSOU — 188/188                    |
| Build     | `pnpm --filter backend build`     | 1         | ⚠️ FALHOU (erros pré-existentes B.2-B) |

> TypeCheck e Build falharam exclusivamente por erros pré-existentes
> em `create-account-holder-contracts.unit.spec.ts` (base herdada da B.2-B).
> Este agente NÃO introduziu nenhum desses erros.
> É proibido modificar esses arquivos nesta fase.

---

## 43. Limitações

1. **TypeCheck vermelho** — erros pré-existentes na base (B.2-B), fora do escopo deste agente
2. **Produtos KG** — 79 produtos bloqueados; estratégia de escala pendente de aprovação
3. **Custo SUSPICIOUS** — 95 produtos com R$ 1,00; requerem confirmação manual antes de publicação
4. **UNKNOWN_REFERENCE** — 119 variantes demo; nenhuma removida sem aprovação
5. **Decimais em Inventory Level** — verificação de suporte pendente no ambiente real
6. **`.env`** copiado localmente para o worktree — não versionado

---

## 44. Próxima Fase

**FASE INVENTÁRIO 0-B (requer aprovação explícita do dry-run)**

1. Criar as 5 coleções no Medusa
2. Criar os 587 produtos com status DRAFT/INACTIVE
3. Vincular Inventory Items e Inventory Levels (Main Warehouse)
4. Aplicar preços BRL para produtos com custo VALID
5. Aguardar aprovação da estratégia KG antes de ativar esses produtos
6. Confirmar custos SUSPICIOUS manualmente antes de publicar
7. Auditar referências históricas dos 119 UNKNOWN_REFERENCE

---

## 45. Conclusão

A **FASE INVENTÁRIO 0-A** foi concluída com **zero gravações no banco de dados**.

- Planilha oficial da FriggaFrio: acessada, baixada e validada ✓
- SHA-256 da planilha registrado ✓
- Estado atual do Medusa: 97 produtos, 119 variantes — todos demo
- Backup lógico criado e protegido fora do Git ✓
- Plano determinístico: 587 CREATE + 119 UNKNOWN_REFERENCE ✓
- Dry-run: executado duas vezes — resultado idempotente ✓
- Testes unitários: 188/188 aprovados ✓
- Dados sensíveis: NÃO versionados, NÃO expostos ✓

**O catálogo NÃO foi substituído. Importação NÃO foi executada.**
**Aguardando aprovação do dry-run para iniciar a Fase Inventário 0-B.**
