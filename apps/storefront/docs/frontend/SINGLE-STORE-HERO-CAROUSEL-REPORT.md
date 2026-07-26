# SINGLE-STORE-HERO-CAROUSEL-REPORT

## Correção de falso positivo
- Afirmação anterior: A largura informada era de uso de 94vw do viewport, com animações suaves de entrada no carrossel.
- Resultado visual real: A captura de tela mostrou que o carrossel permaneceu restrito a aproximadamente 1215px (73% da viewport em 1665px) e a aparência geral não parecia diferente.
- Largura informada: w-[min(94vw,1600px)]
- Largura medida: ~1215px em um viewport de 1665px.
- Diferença: Faltou aplicar mais de 300px na largura total; o carrossel estava confinado no container anterior.
- Causa raiz encontrada: O ancestral limitador `<div className="max-w-7xl px-4 sm:px-6 lg:px-8 ...">` presente dentro de `src/components/home/HeroSection.tsx`. Como o carrossel estava restrito por esse container rígido e padding extra, a classe de viewport window (94vw) definida diretamente no componente do carrossel foi comprimida pelo container-pai.
- Nova implementação: Será refatorado o componente `HeroSection.tsx` para ter uma estrutura full-width com limitação própria (min(96vw, 1720px)) para Desktop Grande sem sofrer restrições de ancestrais estreitos. As animações serão implementadas nativamente atreladas aos slides ativos.
- Novas evidências: Serão providenciadas ao fim desta execução através de scripts de validação numérica no Playwright e vídeo real.

## Segunda correção do falso positivo
- pedido original: Aumentar apenas a largura para aproximá-lo do padrão visual da Dufrio (full-width).
- implementação anterior: Ampliou a largura e a altura simultaneamente (clamp 520px a 700px), criando um card gigante centralizado.
- altura anterior: Aproximadamente 600-700px no desktop.
- altura implementada incorretamente: clamp(520px, 40vw, 700px), ultrapassando os 440px desejados.
- largura anterior: ~1215px limitados.
- largura atual: Será de 100% full-bleed no desktop.
- causa da interpretação incorreta: O agente usou um aspect-ratio fixo e clamps muito altos baseados na largura (40vw), sem perceber que a intenção era um banner horizontal promocional baixo.
- correção desta execução: Implementar full-bleed, height max 440px, slide + fade horizontal, overlay reduzido e bolinhas navegáveis.
- medidas finais: A serem geradas.
- screenshots finais: A serem geradas.
- vídeo final: A ser gerado.
