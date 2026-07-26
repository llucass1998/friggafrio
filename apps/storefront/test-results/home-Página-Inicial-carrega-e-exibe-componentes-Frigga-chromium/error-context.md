# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home.spec.ts >> Página Inicial carrega e exibe componentes Frigga
- Location: tests\home.spec.ts:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Serviços Especializados Friggafrio')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Serviços Especializados Friggafrio')

```

```yaml
- link "Ir para o conteúdo principal":
  - /url: "#main-content"
- link "Ir para o menu principal":
  - /url: "#main-navigation"
- link "Ir para o rodapé":
  - /url: "#site-footer"
- status
- switch "Ativar painel de acessibilidade"
- text: Ativar acessibilidade
- 'link "Vendas: (11) 4580-1227"':
  - /url: https://wa.me/551145801227
- link "Central de Ajuda":
  - /url: /br/store
- banner:
  - link "Ir para a página inicial da FriggaFrio":
    - /url: /br
    - img "FriggaFrio — Refrigeração e Ar Condicionado"
  - textbox "Busque por produto, gás, marca ou código"
  - button "Buscar"
  - link "Minha conta":
    - /url: /br/account/login
    - text: Entrar
  - button "Abrir carrinho com 0 itens": Carrinho
  - navigation:
    - button "Produtos"
    - button "Aplicações"
    - link "Nossa Loja":
      - /url: /nossa-loja
- link "Ir para a página inicial da FriggaFrio":
  - /url: /br
  - img "FriggaFrio Símbolo"
  - text: FriggaFrio
- navigation:
  - button "Produtos"
  - button "Aplicações"
  - link "Nossa Loja":
    - /url: /nossa-loja
- textbox "Busque por produto, gás, marca ou código"
- button "Buscar"
- link "Minha conta":
  - /url: /br/account/login
- button "Abrir carrinho com 0 itens"
- main:
  - group "Tubos de Cobre":
    - img "Tubos de Cobre"
    - heading "Tubos de Cobre" [level=3]
    - paragraph: Materiais para instalações e manutenção de sistemas frigoríficos.
    - link "Ver categoria":
      - /url: /br/store?category=instalacao-isolamento
      - text: Ver categoria
      - img
  - group "Ferramentas para Refrigeração":
    - img "Ferramentas para Refrigeração"
    - heading "Ferramentas para Refrigeração" [level=3]
    - paragraph: Bombas de vácuo, manifolds e ferramentas para instalação e manutenção.
    - link "Ver categoria":
      - /url: /br/store?category=ferramentas-equipamentos
      - text: Ver categoria
      - img
  - group "Tubos e Isolamentos":
    - img "Tubos e Isolamentos"
    - heading "Tubos e Isolamentos" [level=3]
    - paragraph: Materiais para proteção térmica e instalação de sistemas de refrigeração.
    - link "Ver categoria":
      - /url: /br/store?category=instalacao-isolamento
      - text: Ver categoria
      - img
  - group "Cilindros para Recolhimento":
    - img "Cilindros para Recolhimento"
    - heading "Cilindros para Recolhimento" [level=3]
    - paragraph: Equipamentos para recolhimento e armazenamento técnico de fluidos refrigerantes.
    - link "Ver categoria":
      - /url: /br/store?category=cilindros-recolhimento
      - text: Ver categoria
      - img
  - group "Gases Refrigerantes":
    - img "Gases Refrigerantes"
    - heading "Gases Refrigerantes" [level=3]
    - paragraph: Soluções para diferentes aplicações de refrigeração comercial, industrial e doméstica.
    - link "Ver categoria":
      - /url: /br/store?category=gases-refrigerantes
      - text: Ver categoria
      - img
  - button "Ver slide anterior"
  - button "Ver próximo slide"
  - button "Ir para o slide 1"
  - button "Ir para o slide 2"
  - button "Ir para o slide 3"
  - button "Ir para o slide 4"
  - button "Ir para o slide 5"
  - heading "Variedade" [level=3]
  - paragraph: Produtos, acessórios e soluções para diferentes sistemas de refrigeração.
  - heading "Agilidade" [level=3]
  - paragraph: Atendimento comercial e técnico para ajudar na escolha correta.
  - heading "Entrega responsável" [level=3]
  - paragraph: Opções de entrega e retirada conforme disponibilidade e região.
  - heading "Compromisso ambiental" [level=3]
  - paragraph: Orientação para recuperação e destinação responsável de fluidos e cilindros.
  - heading "Categorias em Destaque" [level=2]
  - paragraph: Navegue pelas principais linhas de produtos
  - link "Ver todas as categorias":
    - /url: /br
  - text: Nenhuma categoria encontrada no momento.
  - region "Marcas que você encontra na FriggaFrio":
    - heading "Marcas que você encontra na FriggaFrio" [level=2]
    - paragraph: Trabalhamos com produtos de marcas reconhecidas no setor de refrigeração, climatização e controle, conforme a disponibilidade do nosso catálogo.
    - link "Visitar o site oficial da Bitzer":
      - /url: https://www.bitzer.de/br/pt/
      - img "Logo da Bitzer"
    - img "Logo da Siccom"
    - img "Logo da Coel"
    - img "Logo da Mastercool"
    - img "Logo da Testo"
    - img "Logo da Eolo"
    - img "Logo da Springer Midea"
    - img "Logo da Samsung"
    - img "Logo da Fujitsu"
    - img "Logo da Invicta/Vix"
    - img "Logo da Dugold"
    - img "Logo da Metalfrio"
    - img "Logo da Fricon"
    - img "Logo da Gelopar"
    - img "Logo da Elgin"
    - img "Logo da Komeco"
    - img "Logo da Carrier"
    - img "Logo da Philco"
    - img "Logo da LG"
    - img "Logo da Brastemp"
    - img "Logo da Consul"
    - img "Logo da Electrolux"
    - img "Logo da Mueller"
    - img "Logo da Tramontina"
    - button "Marca anterior"
    - button "Próxima marca"
  - heading "Produtos Especializados FriggaFrio" [level=2]
  - paragraph: As soluções mais procuradas para o seu projeto
  - link "Ver todos os produtos":
    - /url: /
  - 'link "Novo Imagem em breve Imagem ainda não disponível para o produto: Gás R134 Freon"':
    - /url: /br/products/gas-r134-freon
    - text: Novo Imagem em breve
    - 'img "Imagem ainda não disponível para o produto: Gás R134 Freon"': Imagem do produto em breve
  - text: Friggafrio
  - link "Gás R134 Freon":
    - /url: /br/products/gas-r134-freon
    - heading "Gás R134 Freon" [level=3]
  - paragraph: "Ref: R134-FREON-BOTIJA"
  - text: R$ 1.800,00
  - button "Escolher opções Gás R134 Freon": Escolher opções
  - 'link "Novo Imagem em breve Imagem ainda não disponível para o produto: Gás R404 Freon"':
    - /url: /br/products/gas-r404-freon
    - text: Novo Imagem em breve
    - 'img "Imagem ainda não disponível para o produto: Gás R404 Freon"': Imagem do produto em breve
  - text: Friggafrio
  - link "Gás R404 Freon":
    - /url: /br/products/gas-r404-freon
    - heading "Gás R404 Freon" [level=3]
  - paragraph: "Ref: R404-FREON-BOTIJA"
  - text: R$ 2.200,00
  - button "Escolher opções Gás R404 Freon": Escolher opções
  - 'link "Novo Imagem em breve Imagem ainda não disponível para o produto: Gás R410 Freon"':
    - /url: /br/products/gas-r410-freon
    - text: Novo Imagem em breve
    - 'img "Imagem ainda não disponível para o produto: Gás R410 Freon"': Imagem do produto em breve
  - text: Friggafrio
  - link "Gás R410 Freon":
    - /url: /br/products/gas-r410-freon
    - heading "Gás R410 Freon" [level=3]
  - paragraph: "Ref: R410-FREON-BOTIJA"
  - text: R$ 2.500,00
  - button "Escolher opções Gás R410 Freon": Escolher opções
  - 'link "Novo Imagem em breve Imagem ainda não disponível para o produto: Gás R22 EOS"':
    - /url: /br/products/gas-r22-eos
    - text: Novo Imagem em breve
    - 'img "Imagem ainda não disponível para o produto: Gás R22 EOS"': Imagem do produto em breve
  - text: Friggafrio
  - link "Gás R22 EOS":
    - /url: /br/products/gas-r22-eos
    - heading "Gás R22 EOS" [level=3]
  - paragraph: "Ref: R22-EOS-BOTIJA"
  - text: R$ 1.400,00
  - button "Escolher opções Gás R22 EOS": Escolher opções
- contentinfo:
  - img
  - heading "Televendas" [level=4]
  - link "(11) 4580-1227":
    - /url: tel:1145801227
  - img
  - heading "Atendimento Rápido" [level=4]
  - link "Via WhatsApp":
    - /url: https://wa.me/5511948777156
  - img
  - heading "Nossa Loja Física" [level=4]
  - link "Venha nos visitar":
    - /url: /nossa-loja
  - img
  - heading "Compra 100% Segura" [level=4]
  - text: Ambiente blindado
  - link "FriggaFrio Logo":
    - /url: /br
    - img "FriggaFrio Logo"
  - paragraph: Especialistas em Refrigeração. Encontre gases refrigerantes, compressores, componentes, ferramentas e soluções técnicas para instalações residenciais, comerciais e industriais.
  - text: Redes Sociais
  - link "Instagram":
    - /url: https://www.instagram.com/frigga.frio/
    - img
  - heading "Produtos" [level=3]
  - list:
    - listitem:
      - link "Catálogo":
        - /url: /store
    - listitem:
      - link "Carrinho":
        - /url: /cart
  - heading "Institucional" [level=3]
  - list:
    - listitem:
      - link "Quem somos":
        - /url: /quem-somos
    - listitem:
      - link "Nossa Loja":
        - /url: /nossa-loja
    - listitem:
      - link "Falar com a FriggaFrio pelo WhatsApp":
        - /url: https://wa.me/5511948777156?text=Ol%C3%A1!%20Estou%20no%20site%20da%20FriggaFrio%20e%20gostaria%20de%20falar%20com%20a%20equipe.
        - text: Fale Conosco
  - heading "Atendimento" [level=3]
  - list:
    - listitem:
      - link "Central de Ajuda":
        - /url: /ajuda
    - listitem:
      - link "Termos de Uso":
        - /url: /termos
    - listitem:
      - link "Política de Privacidade":
        - /url: /privacidade
    - listitem:
      - link "Política de Trocas":
        - /url: /trocas
  - heading "Minha Conta" [level=3]
  - list:
    - listitem:
      - link "Fazer login":
        - /url: /br/account/login
    - listitem:
      - link "Criar conta":
        - /url: /br/account/register
    - listitem:
      - link "Minha conta":
        - /url: /br/account/login?returnTo=%2Fbr%2Faccount
    - listitem:
      - link "Meus pedidos":
        - /url: /br/account/login?returnTo=%2Fbr%2Faccount%2Forders
  - text: Formas de Pagamento VISA MC AMEX PIX BOLETO Segurança
  - img
  - text: SSL Blindado
  - img
  - text: Compra Segura
  - paragraph: © 2026 FriggaFrio. Todos os direitos reservados.
  - paragraph: "FriggaFrio - CNPJ: 00.000.000/0000-00 | Alameda Glete, 663 - Campos Elíseos - São Paulo - SP - CEP: 01215-001"
  - paragraph: Preços e condições de pagamento exclusivos para compras via internet, podendo variar nas lojas físicas. Ofertas válidas até o término dos nossos estoques para internet.
- link "Falar com a loja Friggafrio pelo WhatsApp":
  - /url: https://wa.me/5511948777156?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20Friggafrio%20e%20gostaria%20de%20falar%20com%20a%20loja.
- text: Fale com a Friggafrio no WhatsApp
- button "Voltar ao topo"
- button "Abrir recursos de acessibilidade"
- region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('Página Inicial carrega e exibe componentes Frigga', async ({ page }) => {
  4  |   await page.goto('/');
  5  | 
  6  |   // Categorias em Destaque
  7  |   await expect(page.getByText('Categorias em Destaque')).toBeVisible();
  8  | 
  9  |   // Produtos em Destaque
  10 |   await expect(page.locator('h2', { hasText: 'Produtos Especializados FriggaFrio' })).toBeVisible();
  11 | 
  12 |   // Seção de Serviços
> 13 |   await expect(page.getByText('Serviços Especializados Friggafrio')).toBeVisible();
     |                                                                      ^ Error: expect(locator).toBeVisible() failed
  14 | });
  15 | 
  16 | test('Header contém busca e navegação corretas', async ({ page }) => {
  17 |   await page.goto('/');
  18 | 
  19 |   // Navegação
  20 |   await expect(page.getByRole('link', { name: 'Quem Somos' }).first()).toBeVisible();
  21 | });
  22 | 
```