# NOSSA-LOJA-BASELINE.md

- **Estrutura encontrada:** A loja já possui uma rota public-stores mas em `br/nossa-loja`. A página original usa Tabs. Não possui galeria ou fallback nativo ou seo avançado. O arquivo store.ts está com um shape legado com "street" junto do número em vez de quebrado, e tem depósito listado.
- **Rotas existentes:** Existe `/nossa-loja` redirecionando para `/br/nossa-loja`, porém com conflitos ts e não está utilizando `useSearch` corretamente para abas.
- **Componentes reutilizáveis:** StoreLocationCard e StoreMap existem, porém sem os novos botões ou links isolados corretamente para API de MAPS externa.
- **Imagens encontradas:** Em `imgs` só existem `favicon-friggafrio.png` e `logo-friggafrio.png`. Não existe fachada da loja.
- **Dados de contato encontrados:** WhatsApp `5511948777156`, phone `(11) 4580-1227`, instagram e email do `storeConfig`.
- **Dependências disponíveis:** Tailwind, TanStack Router, Embla (para galeria mobile se precisar).
- **Resultado do lint e typecheck:** 14 erros de typecheck no branch atual de issues antigas de react e routes.
- **Resultado do build:** O build passa após ajustes em rotas antigas mas avisa chunks grandes.
- **Resultado dos testes:** Tem responsividade ok.
- **Riscos encontrados:** O componente StoreMap não prevê fallback corretamente se a API key estiver ausente, ele apenas não renderiza e não avisa. A estrutra do config `store.ts` precisa de um refactor sem quebrar outras páginas que podem estar importando ele (`public-footer`, `public-home`?).
