# Proposta Técnica — Gerenciamento Extensível de Banners FriggaFrio

**Projeto:** FriggaFrio E-commerce (Medusa v2 + TanStack Storefront)  
**Status:** Proposta de Arquitetura (Fase 5)  
**Autor:** Equipe de Arquitetura de Software FriggaFrio  
**Data:** 22/10/2026  

---

## 1. Contexto e Objetivo

Atualmente, o carrossel promocional da página inicial (`apps/storefront/src/components/home/hero-banner-carousel/`) opera com banners institucionais fixos homologados no repositório.

O objetivo desta proposta é fornecer à equipe administrativa e comercial da FriggaFrio a capacidade de cadastrar, agendar, reordenar e desativar banners institucionais e promocionais diretamente pelo Medusa Admin, preservando a segurança, a alta performance de carregamento e a integridade visual da loja.

---

## 2. Arquitetura de Dados (Módulo Medusa v2)

Para manter a separação de responsabilidades sem acoplamento indevido ao núcleo do Medusa, a gestão de banners será implementada como um módulo isolado: `src/modules/banner`.

### 2.1 Modelo de Dados (`Banner`)

```typescript
// src/modules/banner/models/banner.ts
import { model } from "@medusajs/framework/utils"

export const Banner = model.define("banner", {
  id: model.id().primaryKey(),
  title: model.text(),
  subtitle: model.text().nullable(),
  image_desktop_url: model.text(),
  image_mobile_url: model.text().nullable(),
  alt_text: model.text(),
  link_url: model.text().nullable(),
  link_type: model.enum(["product", "category", "custom_page", "external"]).default("custom_page"),
  target_id: model.text().nullable(), // ID do produto ou categoria vinculado
  display_order: model.number().default(0),
  is_active: model.boolean().default(true),
  starts_at: model.dateTime().nullable(), // Agendamento de início
  ends_at: model.dateTime().nullable(),   // Agendamento de término
  metadata: model.json().nullable(),
})
```

---

## 3. Endpoints da API

### 3.1 Rotas Administrativas (`/admin/banners`)

Todas as rotas exigem autenticação do operador administrativo:

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/admin/banners` | Lista todos os banners (com paginação e ordenação por `display_order`) |
| `POST` | `/admin/banners` | Cadastra um novo banner (valida URLs e datas de agendamento) |
| `GET` | `/admin/banners/:id` | Detalhes do banner |
| `PATCH` | `/admin/banners/:id` | Atualiza dados, agendamento ou status |
| `DELETE` | `/admin/banners/:id` | Remove o banner (soft delete com registro de auditoria) |
| `POST` | `/admin/banners/reorder` | Atualiza a sequência de exibição em lote |

### 3.2 Rota Pública da Storefront (`/store/banners`)

A loja pública consome apenas os banners elegíveis para exibição no momento da consulta:
- `is_active === true`
- `starts_at == null || starts_at <= now()`
- `ends_at == null || ends_at >= now()`
- Ordenados por `display_order ASC`

A resposta pública possui cache `Cache-Control: public, max-age=60, s-maxage=300` com invalidação automática após publicação.

---

## 4. Interface no Medusa Admin

A interface será disponibilizada como uma UI Route oficial em `apps/backend/src/admin/routes/banners/page.tsx`.

### 4.1 Recursos da Interface

1. **Listagem com Drag & Drop / Reordenação:**
   - Visualização dos banners ativos e inativos em cards;
   - Indicador de agendamento (Ex: *"Inicia em 2 dias"*, *"Expira hoje às 23:59"*);
   - Alternância rápida de ativação (`Switch`).

2. **Formulário de Cadastro / Edição com Validação Estrita:**
   - Título e texto alternativo (acessibilidade obrigatória);
   - Upload de imagem para Desktop (proporção recomendada: 1920x600) e Mobile (proporção: 800x800) reutilizando o provider oficial de arquivos (`apps/backend/src/admin/components/image-upload.tsx`);
   - Seletor de destino:
     - Buscar produto no catálogo;
     - Selecionar categoria;
     - URL interna relativa (ex: `/br/lojas`);
   - Agendamento de vigência opcional;
   - Pré-visualização responsiva (Desktop / Tablet / Mobile) em modal antes de salvar.

---

## 5. Diretrizes de Segurança e Desempenho

1. **Validação de Links:** URLs arbitrárias com esquemas perigosos (`javascript:`, `data:`) são expressamente rejeitadas no backend (Zod schema fail-closed). URLs externas só são aceitas se usarem protocolo HTTPS seguro.
2. **Otimização de Imagens:** As imagens enviadas devem passar pelo pipeline do `sharp` para conversão automática em WebP com compressão sem perda perceptível de qualidade, garantindo que o Largest Contentful Paint (LCP) da Home permaneça veloz.
3. **Resiliência e Fallback:** Caso a API de banners esteja temporariamente indisponível ou nenhum banner esteja agendado para o momento, a Storefront manterá o carrossel padrão pré-configurado sem tela branca ou layout shift.

---

## 6. Plano de Implementação Sugerido

- **Etapa A:** Criar migration e módulo `banner` no backend Medusa.
- **Etapa B:** Criar endpoints com testes unitários e de integração (`/admin/banners` e `/store/banners`).
- **Etapa C:** Construir a interface administrativa no `@medusajs/ui`.
- **Etapa D:** Conectar o componente de Storefront mantendo o fallback estático.
- **Etapa E:** Validação em staging antes da liberação em produção.
