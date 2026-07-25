# Skill Responsividade Frigga — Web

## Objetivo

Garantir que todo componente, página e fluxo do frontend da Frigga funcione de forma consistente, acessível e sem quebra visual em celulares, tablets, notebooks e monitores grandes.

## Viewports obrigatórios

- 320x568
- 360x800
- 390x844
- 412x915
- 768x1024
- 1024x768
- 1280x720
- 1366x768
- 1440x900
- 1920x1080

## Regras

1. Não permitir rolagem horizontal.
2. Não usar larguras fixas sem limite responsivo.
3. Usar `min-width: 0` em filhos de grid e flex quando necessário.
4. Textos longos devem quebrar corretamente.
5. Imagens devem ter dimensões reservadas para evitar layout shift.
6. Usar `object-fit` corretamente.
7. Botões e links interativos devem ter área mínima de 44x44px.
8. Inputs não podem ficar menores que 16px de fonte no mobile.
9. Header e menus devem ser utilizáveis por toque e teclado.
10. Tabelas técnicas devem virar cards, scroll controlado ou layout empilhado no mobile.
11. Filtros devem abrir em drawer no mobile.
12. Modais não podem ultrapassar a viewport.
13. Usar `max-height` e rolagem interna quando necessário.
14. Elementos fixos devem considerar `safe-area-inset`.
15. Não esconder funcionalidades essenciais apenas para fazer o layout caber.
16. Não depender de hover para acessar uma funcionalidade.
17. Respeitar zoom de navegador em 200%.
18. Respeitar `prefers-reduced-motion`.
19. Testar orientação retrato e paisagem.
20. Testar com textos 30% maiores.

## Grid de produtos

- 1 coluna em telas muito estreitas quando necessário.
- 2 colunas no mobile comum.
- 3 colunas no tablet.
- 4 colunas no desktop.
- 5 colunas somente quando a largura e o conteúdo permitirem.

## Critério de conclusão

Uma página só está concluída quando:

- Não há overflow horizontal.
- Todos os CTAs estão acessíveis.
- Menus abrem e fecham corretamente.
- Cards mantêm alinhamento.
- Imagens não deformam.
- Textos não são cortados.
- Floating actions não cobrem conteúdo.
- Formulários são utilizáveis.
- Build e testes passam.
