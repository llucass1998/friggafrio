# Checklist de Migração da Equipe "Quem Somos"

## Fase 1: Setup e Diagnóstico
- [ ] Criar `docs/company/TEAM-MIGRATION-CHECKLIST.md`
- [ ] Executar auditoria do código atual e criar `docs/company/TEAM-MIGRATION-BASELINE.md`
- [ ] Diagnosticar as 3 fotos que estavam bugadas e documentar

## Fase 2: Extração de Dados
- [ ] Executar auditoria do site oficial (`https://frigga.com.br/index.html`)
- [ ] Criar script `scripts/import-official-team-images.mjs`
- [ ] Executar o script para baixar imagens originais e converter para `.webp`
- [ ] Salvar originais em `imgs/team/originals/` e otimizadas em `apps/storefront/public/images/team/`
- [ ] Criar `docs/company/TEAM-ASSET-MANIFEST.md`

## Fase 3: Configuração e Validação de Assets
- [ ] Criar/corrigir `apps/storefront/src/config/company-team.ts` com tipagem forte e IDs baseados na lista real
- [ ] Criar script `scripts/validate-team-assets.mjs` e testá-lo
- [ ] Revisar privacidade em `docs/company/TEAM-PUBLICATION-REVIEW.md` (sem emails/telefones pessoais)

## Fase 4: Implementação Frontend
- [ ] Corrigir/atualizar o componente `TeamMemberCard` (fallbacks e fotos)
- [ ] Corrigir o layout/componente do Fundador
- [ ] Corrigir a seção Diretoria
- [ ] Corrigir a seção Equipe (Quem faz a Frigga), garantindo que renderiza todos
- [ ] Ajustar o visual geral da página `/quem-somos`
- [ ] Aplicar transições de acessibilidade (prefers-reduced-motion) e hover
- [ ] Garantir acessibilidade (headings, contraste, a11y)
- [ ] Garantir performance (lazy load, layout shift)
- [ ] Validar caminhos de arquivo para case-sensitivity (Linux)

## Fase 5: Testes e Finalização
- [ ] Atualizar testes automatizados (unit/integração)
- [ ] Atualizar/rodar testes E2E (Playwright) para `/quem-somos`
- [ ] Executar validação final (lint, typecheck, build, test, e2e)
- [ ] Criar `docs/company/TEAM-MIGRATION-FINAL.md` com relatório
