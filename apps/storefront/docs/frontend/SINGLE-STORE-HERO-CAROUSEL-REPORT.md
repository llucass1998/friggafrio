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
