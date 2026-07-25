# Baseline: "Quem Somos" Team Section

## Estado Atual
- O arquivo `apps/storefront/src/config/company-team.ts` contém apenas 3 membros mockados/importados (Paulo Neulaender, Tita Arantes, Ricardo Lopes).
- As imagens não existem na pasta `apps/storefront/public/images/team/`, gerando links quebrados.
- O componente `TeamMemberCard` não lida perfeitamente com ausência de imagem (a prop `imageSrc` é condicional, mas seria ideal garantir uma experiência visual melhor ou avatar padrão).
- Não há seção preenchida para o grupo "team" (Quem faz a Frigga), pois não há membros cadastrados neste grupo na array atual.
- Algumas descrições do Fundador podem estar desalinhadas com o conteúdo oficial.

## Objetivo
Buscar as fotos e nomes da equipe no site oficial (`https://frigga.com.br/index.html`), preencher a array de forma automatizada com IDs, baixar as fotos, convertê-las para `.webp` de forma correta e sem cortes (se possível), e garantir que as rotas e layout sejam perfeitamente responsivos e acessíveis no frontend React.
