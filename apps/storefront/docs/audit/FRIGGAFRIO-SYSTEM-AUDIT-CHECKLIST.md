## Ambiente

- [x] Raiz correta do monorepo identificada.
- [x] Node compatível.
- [x] pnpm compatível.
- [x] PostgreSQL ativo.
- [x] Redis ativo.
- [x] Backend responde em localhost:9000.
- [x] Storefront responde em localhost:5174.
- [x] Frontend não utiliza domínio inexistente.
- [x] CORS local configurado.
- [x] Cookies locais configurados.

## Autenticação

- [x] Criar conta funciona.
- [x] Login por e-mail e senha funciona.
- [x] Login com Google funciona ou possui pendência claramente documentada.
- [x] Cliente autenticado é recuperado após refresh.
- [x] Logout funciona.
- [x] Sessão é removida corretamente.
- [x] Estado do header é atualizado.
- [x] Minha Conta é protegida.
- [x] Visitante é redirecionado ao login.
- [x] returnTo é preservado.
- [ ] Carrinho é preservado após login.
- [x] Não existem chamadas duplicadas desnecessárias.
- [x] Não existe loading infinito.

## Navegação

- [ ] Logo leva para a home.
- [ ] Clique na logo posiciona a página no topo.
- [ ] Navegação entre páginas começa no topo.
- [ ] Botões internos utilizam TanStack Router.
- [ ] Nenhum link interno usa window.location.href.
- [ ] Nenhum link utiliza href="#".
- [ ] Não existem rotas inexistentes no header.
- [ ] Não existem rotas inexistentes no footer.
- [ ] Links autenticados funcionam.
- [ ] Links externos usam target e rel corretos.

## Frontend e backend

- [ ] SDK Medusa está centralizado.
- [ ] URL da API está correta.
- [ ] Publishable key está correta.
- [ ] Endpoints utilizados realmente existem.
- [ ] Payloads do frontend correspondem ao backend.
- [ ] Tipos correspondem às respostas reais.
- [ ] Erros HTTP são tratados.
- [ ] 401 e 403 são tratados como sessão ausente quando apropriado.
- [ ] Erros de rede são diferenciados.
- [ ] Não existem mocks substituindo o backend real.

## Qualidade

- [ ] Sem hydration mismatch.
- [ ] Sem erros críticos no console.
- [ ] Sem requisições falhando silenciosamente.
- [ ] Lint aprovado.
- [ ] Typecheck aprovado.
- [ ] Build do backend aprovado.
- [ ] Build do storefront aprovado.
- [ ] Testes aprovados.
- [ ] E2E aprovado.
- [ ] Responsividade validada.
- [ ] Acessibilidade validada.