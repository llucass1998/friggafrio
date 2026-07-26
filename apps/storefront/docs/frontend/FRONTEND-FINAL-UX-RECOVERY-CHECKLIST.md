# Checklist de Aceitação

## Qualidade e ESLint
- [ ] Configuração atual do ESLint auditada.
- [ ] Desabilitação global de `no-unused-vars` removida.
- [ ] Desabilitações por arquivo auditadas.
- [ ] Desabilitações desnecessárias removidas.
- [ ] Imports não utilizados corrigidos.
- [ ] Variáveis não utilizadas corrigidas.
- [ ] Código morto removido com segurança.
- [ ] Lint aprovado sem esconder erros.
- [ ] TypeScript aprovado.
- [ ] Build client aprovado.
- [ ] Build SSR aprovado.

## Header único
- [ ] Existe uma única tag `<header>`.
- [ ] Existe uma única árvore React de Header.
- [ ] Estado `top` implementado.
- [ ] Estado `scrolled` implementado.
- [ ] Utility bar funciona.
- [ ] Logo está visível.
- [ ] Navegação está visível no topo.
- [ ] Pesquisa está visível no topo.
- [ ] Conta está visível no topo.
- [ ] Carrinho está visível no topo.
- [ ] Navegação continua disponível após scroll.
- [ ] Pesquisa continua disponível após scroll.
- [ ] Conta continua disponível após scroll.
- [ ] Carrinho continua disponível após scroll.
- [ ] Header diminui suavemente.
- [ ] Header restaura o tamanho ao voltar ao topo.
- [ ] Não existe troca para outro componente.
- [ ] Não existe salto visual.
- [ ] Não existe faixa vazia duplicada.

## Dropdowns
- [ ] Dropdown Produtos abre para baixo.
- [ ] Dropdown Aplicações abre para baixo.
- [ ] Dropdown não é cortado pelo Header.
- [ ] Dropdown não fica atrás do conteúdo.
- [ ] Dropdown funciona no estado `top`.
- [ ] Dropdown funciona no estado `scrolled`.
- [ ] Dropdown fecha ao clicar fora.
- [ ] Dropdown fecha com Escape.
- [ ] Dropdown funciona por teclado.
- [ ] Dropdown possui animação de entrada.
- [ ] Dropdown possui animação de saída.

## Logo e rotas
- [ ] Logo usa rota tipada.
- [ ] Logo não usa `as any`.
- [ ] Logo não depende de parâmetro inexistente.
- [ ] Logo sempre abre `/br`.
- [ ] Logo na Home retorna ao topo.
- [ ] Logo funciona em Quem Somos.
- [ ] Logo funciona em Nossa Loja.
- [ ] Logo funciona em Ajuda.
- [ ] Nenhuma rota gera `/undefined`.
- [ ] Nenhuma rota gera `/null`.
- [ ] Nenhuma rota usa `/dk`.
- [ ] Nenhuma rota usa `/us`.
- [ ] Página 404 está em pt-BR.

## Home
- [ ] Hero inicia logo depois do Header.
- [ ] Área vazia excessiva removida.
- [ ] Produtos especializados aparecem acima das marcas.
- [ ] Seção Produtos especializados existe apenas uma vez.
- [ ] Seção de marcas existe apenas uma vez.
- [ ] Ordem SSR corresponde à ordem do cliente.
- [ ] Sem hydration mismatch.

## Nossa Loja
- [ ] Somente uma loja é exibida.
- [ ] Dados usados são os dados atuais da antiga Loja 1.
- [ ] Texto "Loja 1" removido.
- [ ] Texto "Loja 2" removido.
- [ ] Texto "Unidade selecionada" removido.
- [ ] Seletor de unidades removido.
- [ ] Tabs de unidades removidas.
- [ ] Card possui hover de elevação.
- [ ] Card possui foco visível.
- [ ] Endereço real preservado.
- [ ] Links reais preservados.
- [ ] Mobile aprovado.

## Carrinho
- [ ] Clique no ícone abre imediatamente.
- [ ] Clique funciona na primeira tentativa.
- [ ] Não depende de requisição para abrir.
- [ ] Drawer existente foi reutilizado.
- [ ] Overlay aparece.
- [ ] Drawer entra pela direita.
- [ ] Drawer fecha suavemente.
- [ ] Escape fecha.
- [ ] Clique no overlay fecha.
- [ ] Foco fica preso no drawer.
- [ ] Foco retorna ao botão do carrinho.
- [ ] Estado vazio funciona.
- [ ] Loading funciona.
- [ ] Carrinho com itens funciona.
- [ ] Badge funciona.
- [ ] Nenhuma chamada duplicada.

## Transições
- [ ] View Transitions realmente iniciam.
- [ ] Fallback CSS funciona.
- [ ] `animation-name` é diferente de `none`.
- [ ] `animation-duration` é maior que zero.
- [ ] Header não é desmontado.
- [ ] Footer não é desmontado.
- [ ] Providers não são desmontados.
- [ ] Home possui transição.
- [ ] Produtos possuem transição.
- [ ] Quem Somos possui transição.
- [ ] Nossa Loja possui transição.
- [ ] Minha Conta possui transição.
- [ ] Botão voltar funciona.
- [ ] Scroll restoration funciona.
- [ ] Reduced Motion funciona.
- [ ] Acessibilidade geral não desliga animações.

## Minha Conta
- [ ] Nova composição está ligada à rota.
- [ ] Antigo `settings.tsx` não é mais a tela principal B2C.
- [ ] Interface está em pt-BR.
- [ ] Layout utiliza a largura disponível.
- [ ] Sidebar funciona.
- [ ] Visão geral funciona.
- [ ] Dados pessoais funcionam.
- [ ] Botão Editar está visível.
- [ ] Botão Cancelar funciona.
- [ ] Botão Salvar funciona.
- [ ] Perfil atualiza sem F5.
- [ ] Botão Sair está visível.
- [ ] Logout funciona sem F5.
- [ ] Header atualiza imediatamente.
- [ ] Botão voltar não revela dados.
- [ ] Carrinho é preservado.
- [ ] Stripe não carrega na conta B2C.
- [ ] Funcionalidades B2B não aparecem para B2C.
- [ ] Mobile aprovado.

## Evidências
- [ ] Screenshot do Header no topo.
- [ ] Screenshot do Header compacto.
- [ ] Vídeo do Header compactando.
- [ ] Vídeo do dropdown.
- [ ] Vídeo das transições.
- [ ] Vídeo do carrinho.
- [ ] Screenshot da Home.
- [ ] Screenshot de Nossa Loja.
- [ ] Screenshot de Minha Conta.
- [ ] Vídeo do logout sem F5.
- [ ] Console auditado.
- [ ] Network auditada.
- [ ] Playwright aprovado.
