# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test-auth-protection-e2e.spec.ts >> Should protect account route and preserve returnTo
- Location: tests\test-auth-protection-e2e.spec.ts:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "http://localhost:5173/br" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=f2e1]:
  - generic [ref=f2e2]:
    - generic:
      - link "Ir para o conteúdo principal" [ref=f2e3] [cursor=pointer]:
        - /url: "#main-content"
      - link "Ir para o menu principal" [ref=f2e4] [cursor=pointer]:
        - /url: "#main-navigation"
      - link "Ir para o rodapé" [ref=f2e5] [cursor=pointer]:
        - /url: "#site-footer"
    - status [ref=f2e6]
    - generic [ref=f2e8]:
      - generic [ref=f2e9]:
        - switch "Ativar painel de acessibilidade" [ref=f2e10] [cursor=pointer]
        - generic [ref=f2e12] [cursor=pointer]: Ativar acessibilidade
      - generic [ref=f2e13]:
        - 'link "Vendas: (11) 4580-1227" [ref=f2e14] [cursor=pointer]':
          - /url: https://wa.me/551145801227
        - link "Central de Ajuda" [ref=f2e15] [cursor=pointer]:
          - /url: /br/store
    - banner [ref=f2e17]:
      - generic [ref=f2e19]:
        - link "Ir para a página inicial da FriggaFrio" [ref=f2e22] [cursor=pointer]:
          - /url: /br
          - img "FriggaFrio — Refrigeração e Ar Condicionado" [ref=f2e23]
        - generic [ref=f2e26]:
          - textbox "Busque por produto, gás, marca ou código" [ref=f2e27]
          - button "Buscar" [ref=f2e28] [cursor=pointer]
        - generic [ref=f2e32]:
          - link "Minha conta" [ref=f2e33] [cursor=pointer]:
            - /url: /br/account/login
            - generic [ref=f2e37]: Entrar
          - button "Abrir carrinho com 0 itens" [ref=f2e38] [cursor=pointer]:
            - generic [ref=f2e44]: Carrinho
      - navigation [ref=f2e47]:
        - button "Produtos" [ref=f2e49] [cursor=pointer]
        - button "Aplicações" [ref=f2e53] [cursor=pointer]
        - link "Nossa Loja" [ref=f2e56] [cursor=pointer]:
          - /url: /nossa-loja
    - generic [ref=f2e59]:
      - link "Ir para a página inicial da FriggaFrio" [ref=f2e61] [cursor=pointer]:
        - /url: /br
        - generic [ref=f2e62]:
          - img "FriggaFrio Símbolo" [ref=f2e63]
          - generic [ref=f2e64]: FriggaFrio
      - navigation [ref=f2e66]:
        - button "Produtos" [ref=f2e68] [cursor=pointer]
        - button "Aplicações" [ref=f2e72] [cursor=pointer]
        - link "Nossa Loja" [ref=f2e75] [cursor=pointer]:
          - /url: /nossa-loja
      - generic [ref=f2e78]:
        - textbox "Busque por produto, gás, marca ou código" [ref=f2e79]
        - button "Buscar" [ref=f2e80] [cursor=pointer]
      - generic [ref=f2e84]:
        - link "Minha conta" [ref=f2e85] [cursor=pointer]:
          - /url: /br/account/login
        - button "Abrir carrinho com 0 itens" [ref=f2e89] [cursor=pointer]
    - main [ref=f2e95]:
      - generic [ref=f2e96]:
        - generic [ref=f2e97]:
          - generic [ref=f2e100]:
            - link [ref=f2e101] [cursor=pointer]:
              - /url: /br
              - heading "FriggaFrio" [level=2] [ref=f2e102]
            - heading "Sua conta FriggaFrio" [level=1] [ref=f2e103]
            - paragraph [ref=f2e104]: Tenha acesso ao histórico de pedidos, endereços salvos e uma experiência de compra mais rápida.
            - list [ref=f2e105]:
              - listitem [ref=f2e106]:
                - generic [ref=f2e110]: Acompanhe seus pedidos e orçamentos.
              - listitem [ref=f2e111]:
                - generic [ref=f2e115]: Salve seus endereços para compras rápidas.
              - listitem [ref=f2e116]:
                - generic [ref=f2e120]: Mantenha seu carrinho salvo após entrar.
              - listitem [ref=f2e121]:
                - generic [ref=f2e125]: Solicite atendimento especializado B2B/B2C.
          - generic [ref=f2e126]: © 2026 FriggaFrio. Todos os direitos reservados.
        - generic [ref=f2e129]:
          - generic [ref=f2e130]:
            - heading "Criar minha conta" [level=1] [ref=f2e131]
            - paragraph [ref=f2e132]: Cadastre-se para acompanhar seus pedidos, salvar seus dados e realizar compras com mais facilidade.
          - tablist [ref=f2e133]:
            - tab "Pessoa física" [selected] [ref=f2e134] [cursor=pointer]
            - tab "Pessoa jurídica" [ref=f2e137] [cursor=pointer]
          - tabpanel "Cadastro de Pessoa Física" [ref=f2e142]:
            - generic [ref=f2e143]:
              - generic [ref=f2e144]:
                - generic [ref=f2e145]:
                  - generic [ref=f2e146] [cursor=pointer]: Nome *
                  - textbox "Nome *" [ref=f2e147]
                - generic [ref=f2e148]:
                  - generic [ref=f2e149] [cursor=pointer]: Sobrenome *
                  - textbox "Sobrenome *" [ref=f2e150]
              - generic [ref=f2e151]:
                - generic [ref=f2e152] [cursor=pointer]: E-mail *
                - textbox "E-mail *" [ref=f2e153]
              - generic [ref=f2e154]:
                - generic [ref=f2e155]:
                  - generic [ref=f2e156] [cursor=pointer]: Telefone *
                  - textbox "Telefone *" [ref=f2e157]:
                    - /placeholder: (11) 99999-9999
                - generic [ref=f2e158]:
                  - generic [ref=f2e159] [cursor=pointer]: CPF (Opcional)
                  - textbox "CPF (Opcional)" [ref=f2e160]:
                    - /placeholder: 000.000.000-00
              - generic [ref=f2e161]:
                - generic [ref=f2e162] [cursor=pointer]: Senha *
                - generic [ref=f2e163]:
                  - textbox "Senha *" [ref=f2e164]:
                    - /placeholder: Mínimo de 8 caracteres
                  - button "Mostrar senha" [ref=f2e165] [cursor=pointer]
              - generic [ref=f2e169]:
                - generic [ref=f2e170] [cursor=pointer]: Confirmar senha *
                - generic [ref=f2e171]:
                  - textbox "Confirmar senha *" [ref=f2e172]:
                    - /placeholder: Mínimo de 8 caracteres
                  - button "Mostrar senha" [ref=f2e173] [cursor=pointer]
              - generic [ref=f2e177]:
                - generic [ref=f2e178] [cursor=pointer]:
                  - checkbox "Li e aceito os Termos de Uso e a Política de Privacidade. *" [checked] [ref=f2e180]
                  - generic [ref=f2e181]:
                    - text: Li e aceito os
                    - link "Termos de Uso" [ref=f2e182]:
                      - /url: /
                    - text: e a
                    - link "Política de Privacidade" [ref=f2e183]:
                      - /url: /
                    - text: . *
                - generic [ref=f2e184] [cursor=pointer]:
                  - checkbox "Quero receber novidades, conteúdos e ofertas da FriggaFrio." [ref=f2e186]
                  - generic [ref=f2e187]: Quero receber novidades, conteúdos e ofertas da FriggaFrio.
              - button "Criar conta" [active] [ref=f2e188] [cursor=pointer]
          - generic [ref=f2e189]: ou
          - generic [ref=f2e195]:
            - button "Continuar com o Google. Abre em uma nova guia" [ref=f2e197] [cursor=pointer]:
              - generic [ref=f2e199]: Continuar com o Google
            - iframe
          - paragraph [ref=f2e210]:
            - text: Já possui uma conta?
            - link "Entrar" [ref=f2e211] [cursor=pointer]:
              - /url: /br/account/login
    - contentinfo [ref=f2e212]:
      - generic [ref=f2e215]:
        - generic [ref=f2e220]:
          - heading "Televendas" [level=4] [ref=f2e221]
          - link "(11) 4580-1227" [ref=f2e222] [cursor=pointer]:
            - /url: tel:1145801227
        - generic [ref=f2e227]:
          - heading "Atendimento Rápido" [level=4] [ref=f2e228]
          - link "Via WhatsApp" [ref=f2e229] [cursor=pointer]:
            - /url: https://wa.me/5511948777156
        - generic [ref=f2e235]:
          - heading "Nossa Loja Física" [level=4] [ref=f2e236]
          - link "Venha nos visitar" [ref=f2e237] [cursor=pointer]:
            - /url: /nossa-loja
        - generic [ref=f2e242]:
          - heading "Compra 100% Segura" [level=4] [ref=f2e243]
          - text: Ambiente blindado
      - generic [ref=f2e245]:
        - generic [ref=f2e246]:
          - link [ref=f2e247] [cursor=pointer]:
            - /url: /br
            - img "FriggaFrio Logo" [ref=f2e248]
          - paragraph [ref=f2e249]: Especialistas em Refrigeração. Encontre gases refrigerantes, compressores, componentes, ferramentas e soluções técnicas para instalações residenciais, comerciais e industriais.
          - generic [ref=f2e250]:
            - generic [ref=f2e251]: Redes Sociais
            - link "Instagram" [ref=f2e253] [cursor=pointer]:
              - /url: https://www.instagram.com/frigga.frio/
        - generic [ref=f2e256]:
          - generic [ref=f2e257]:
            - heading "Produtos" [level=3] [ref=f2e258]
            - list [ref=f2e260]:
              - listitem [ref=f2e261]:
                - link "Catálogo" [ref=f2e262] [cursor=pointer]:
                  - /url: /store
              - listitem [ref=f2e263]:
                - link "Carrinho" [ref=f2e264] [cursor=pointer]:
                  - /url: /cart
          - generic [ref=f2e265]:
            - heading "Institucional" [level=3] [ref=f2e266]
            - list [ref=f2e268]:
              - listitem [ref=f2e269]:
                - link "Quem somos" [ref=f2e270] [cursor=pointer]:
                  - /url: /quem-somos
              - listitem [ref=f2e271]:
                - link "Nossa Loja" [ref=f2e272] [cursor=pointer]:
                  - /url: /nossa-loja
              - listitem [ref=f2e273]:
                - link "Falar com a FriggaFrio pelo WhatsApp" [ref=f2e274] [cursor=pointer]:
                  - /url: https://wa.me/5511948777156?text=Ol%C3%A1!%20Estou%20no%20site%20da%20FriggaFrio%20e%20gostaria%20de%20falar%20com%20a%20equipe.
                  - text: Fale Conosco
          - generic [ref=f2e275]:
            - heading "Atendimento" [level=3] [ref=f2e276]
            - list [ref=f2e278]:
              - listitem [ref=f2e279]:
                - link "Central de Ajuda" [ref=f2e280] [cursor=pointer]:
                  - /url: /ajuda
              - listitem [ref=f2e281]:
                - link "Termos de Uso" [ref=f2e282] [cursor=pointer]:
                  - /url: /termos
              - listitem [ref=f2e283]:
                - link "Política de Privacidade" [ref=f2e284] [cursor=pointer]:
                  - /url: /privacidade
              - listitem [ref=f2e285]:
                - link "Política de Trocas" [ref=f2e286] [cursor=pointer]:
                  - /url: /trocas
          - generic [ref=f2e287]:
            - heading "Minha Conta" [level=3] [ref=f2e288]
            - list [ref=f2e290]:
              - listitem [ref=f2e291]:
                - link "Fazer login" [ref=f2e292] [cursor=pointer]:
                  - /url: /br/account/login
              - listitem [ref=f2e293]:
                - link "Criar conta" [ref=f2e294] [cursor=pointer]:
                  - /url: /br/account/register
              - listitem [ref=f2e295]:
                - link "Minha conta" [ref=f2e296] [cursor=pointer]:
                  - /url: /br/account/login?returnTo=%2Fbr%2Faccount
              - listitem [ref=f2e297]:
                - link "Meus pedidos" [ref=f2e298] [cursor=pointer]:
                  - /url: /br/account/login?returnTo=%2Fbr%2Faccount%2Forders
      - generic [ref=f2e301]:
        - generic [ref=f2e302]:
          - generic [ref=f2e303]: Formas de Pagamento
          - generic [ref=f2e304]:
            - generic [ref=f2e305]: VISA
            - generic [ref=f2e306]: MC
            - generic [ref=f2e307]: AMEX
            - generic [ref=f2e308]: PIX
            - generic [ref=f2e309]: BOLETO
        - generic [ref=f2e310]:
          - generic [ref=f2e311]: Segurança
          - generic [ref=f2e312]:
            - generic [ref=f2e313]: SSLBlindado
            - generic [ref=f2e317]: CompraSegura
      - generic [ref=f2e324]:
        - paragraph [ref=f2e325]: © 2026 FriggaFrio. Todos os direitos reservados.
        - paragraph [ref=f2e326]:
          - text: "FriggaFrio - CNPJ: 00.000.000/0000-00 |"
          - generic [ref=f2e327]: "Alameda Glete, 663 - Campos Elíseos - São Paulo - SP - CEP: 01215-001"
        - paragraph [ref=f2e328]: Preços e condições de pagamento exclusivos para compras via internet, podendo variar nas lojas físicas. Ofertas válidas até o término dos nossos estoques para internet.
    - generic [ref=f2e329]:
      - link "Falar com a loja Friggafrio pelo WhatsApp" [ref=f2e330] [cursor=pointer]:
        - /url: https://wa.me/5511948777156?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20Friggafrio%20e%20gostaria%20de%20falar%20com%20a%20loja.
      - generic: Fale com a Friggafrio no WhatsApp
    - button "Voltar ao topo" [ref=f2e334] [cursor=pointer]
    - button "Abrir recursos de acessibilidade" [ref=f2e337] [cursor=pointer]
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('Should protect account route and preserve returnTo', async ({ page }) => {
  4  |   // 1. Visitante acessa página protegida
  5  |   await page.goto('http://localhost:5173/br/account');
  6  |   await page.waitForLoadState('networkidle');
  7  | 
  8  |   // 2. Deve ser redirecionado para o login
  9  |   await expect(page).toHaveURL(/.*login.*/);
  10 | 
  11 |   // 3. Cadastrar e logar
  12 |   const userEmail = `e2e.protect.${Date.now()}@example.com`;
  13 |   const userPassword = 'Password123!';
  14 | 
  15 |   await page.goto('http://localhost:5173/br/account/register');
  16 |   
  17 |   // Create user through UI
  18 |   await page.getByLabel(/Nome/i).first().fill('E2EProtect');
  19 |   await page.getByLabel(/Sobrenome/i).first().fill('User');
  20 |   await page.getByRole('textbox', { name: /E-mail/i }).fill(userEmail);
  21 |   await page.getByLabel(/Telefone/i).first().fill('11999999999');
  22 |   await page.getByLabel(/Senha/i).first().fill(userPassword);
  23 |   await page.getByLabel(/Confirmar senha/i).first().fill(userPassword);
  24 |   await page.getByLabel(/Li e aceito os Termos/i).first().check();
  25 |   
  26 |   await Promise.all([
> 27 |     page.waitForURL('http://localhost:5173/br'),
     |          ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  28 |     page.getByRole('button', { name: 'Criar conta' }).click()
  29 |   ]);
  30 | 
  31 |   // 4. Agora vai para account (protegida) e não deve ser bloqueado
  32 |   await page.goto('http://localhost:5173/br/account');
  33 |   await page.waitForLoadState('networkidle');
  34 |   await expect(page).not.toHaveURL(/.*login.*/);
  35 | 
  36 |   // 5. Logout na UI (agora account renderiza UI e pode ter botão Sair ou Minha conta)
  37 |   await page.context().clearCookies();
  38 | 
  39 |   // 6. Tenta acessar de novo, deve ser redirecionado
  40 |   await page.goto('http://localhost:5173/br/account');
  41 |   await page.waitForLoadState('networkidle');
  42 |   await expect(page).toHaveURL(/.*login.*/);
  43 | });
```