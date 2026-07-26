# BASELINE AUDIT - HEADER, NAVIGATION & ANIMATIONS

## Arquivos Envolvidos a serem trabalhados:
- `apps/storefront/src/components/navbar.tsx` (Header atual)
- `apps/storefront/src/components/public-footer.tsx` (Footer atual)
- `apps/storefront/src/pages/home.tsx` (Layout da Home)
- `apps/storefront/src/pages/settings.tsx` (Minha conta & botão Sair)
- `apps/storefront/src/routes/__root.tsx` (Root router layout, Outlet page transitions)
- `apps/storefront/src/lib/hooks/use-auth.ts` (Logout real e cache)

## Medidas Iniciais do Header (Navbar.tsx):
- O componente `navbar.tsx` contém o header. Atualmente, usa `<div className="flex items-center justify-between h-14">`. Ele é bastante cru, com "FriggaFrio" em texto como Logo.
- Vamos transformar esse texto em uma tag `<img>` maior apontando para o logo SVG, reestruturando o header em TopBar e Área Principal com os paddings corretos para desktop, tablet e mobile.

## Erros Iniciais Encontrados:
- URL `/undefined`: Quando se clica no Footer ou Logo e o parâmetro `countryCode` (do Route Tree ou props) está mal resolvido ou falho no hook useParams do TanStack Router.
- Sair em "Minha Conta": Atualmente adicionamos um na Navbar, mas dentro do Painel (Settings) não há opção nativa evidente nas abas.
- Animações globais: Ausentes de CSS variables sistemáticas no index.css/tailwind.
