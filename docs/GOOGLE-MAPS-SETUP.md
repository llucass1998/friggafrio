# Configuração da Google Maps Embed API

Para utilizar o mapa interativo na página Nossa Loja de forma nativa e sem marca d'água de erros (embora haja um fallback em vigor), é necessário configurar uma chave do Google Cloud.

Siga os passos abaixo:

1. Acesse o **Google Cloud Console** (https://console.cloud.google.com).
2. Crie um projeto novo ou selecione um existente para a FriggaFrio.
3. No menu lateral, acesse **APIs e Serviços** > **Biblioteca**.
4. Busque por **Maps Embed API** e ative-a.
5. Acesse **APIs e Serviços** > **Credenciais**.
6. Clique em **Criar credenciais** > **Chave de API**.
7. Clique na chave recém-criada para **Restringir** seu uso (Altamente Recomendado):
   - Em restrições de aplicativo, selecione "Referenciadores HTTP (sites)".
   - Adicione `localhost` ou `http://localhost:*` para desenvolvimento.
   - Adicione os domínios de produção, ex: `*friggafrio.com.br/*` e `*friggafrio.netlify.app/*`.
   - Em restrições de API, selecione **Maps Embed API** apenas.
8. Copie a chave e preencha a variável no `.env`:
   ```bash
   VITE_GOOGLE_MAPS_EMBED_API_KEY=sua_chave_aqui
   ```
9. **Não reutilize chaves de backend para o frontend.** A Embed API é grátis, mas se a chave usada for de Places ou Directions, isso consumirá cotas.
10. **Não versione a chave real em prints ou publicamente no GitHub.**
11. Reinicie o servidor do Vite após a alteração do arquivo `.env`.