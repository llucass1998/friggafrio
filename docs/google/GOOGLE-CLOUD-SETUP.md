# CONFIGURAÇÃO DO GOOGLE CLOUD

Para utilizar os recursos de mapas e login integrados neste projeto, é necessário configurar um projeto no Google Cloud com as seguintes APIs e chaves. Esta etapa deve ser concluída pelo proprietário ou administrador da organização.

## 1. Criação do Projeto e Faturamento
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Crie ou selecione um projeto específico (ex: `friggafrio-web`).
3. Acesse **Faturamento (Billing)** e ative uma conta de faturamento válida (essencial para Places API e Maps Embed API se exceder cota gratuita).

## 2. Ativação das APIs Necessárias
Acesse **APIs e Serviços > Biblioteca** e ative APENAS as seguintes APIs:
- **Maps Embed API** (Para o mapa e street view incorporados)
- **Places API (New)** (Para buscar fotos públicas e metadados com as fotos)
- **Google Identity Services** (Procurar como "Google+ API" ou configurar diretamente no painel "Tela de Consentimento OAuth")

## 3. Configuração do OAuth 2.0 (Google Sign-In)
1. Acesse **APIs e Serviços > Tela de consentimento OAuth**.
2. Escolha o tipo de usuário **Externo**.
3. Preencha:
   - Nome do app: `FriggaFrio`
   - E-mail para suporte: (Seu email / email oficial da Frigga)
   - Adicione o domínio autorizado futuramente: `friggafrio.com.br`
4. Vá para **Credenciais > Criar Credenciais > ID do cliente OAuth**.
5. Selecione o tipo de aplicativo **Aplicativo da Web**.
6. Insira o nome: `FriggaFrio Storefront`.
7. **Origens JavaScript autorizadas:**
   - `http://localhost:5174`
   - `http://127.0.0.1:5174`
   - Futuramente adicionar: `https://friggafrio.com.br` e `https://www.friggafrio.com.br`
8. **URIs de redirecionamento autorizados:**
   - Não usaremos Redirect URI estrita no modo popup, mas configure caso haja fallback: `http://localhost:9000/auth/customer/google/callback` e as URLs equivalentes de produção da API do Medusa.
9. Após criar, copie o **Client ID** e guarde em segurança. **O Client Secret será usado apenas no Backend Medusa, não exponha**.

## 4. Criação e Restrição das Chaves de API

### Chave Frontend (Maps Embed API)
1. Em **Credenciais > Criar Credenciais > Chave de API**.
2. Edite a chave e renomeie para `Frontend Maps Embed Key`.
3. **Restrições do aplicativo:** Selecione "Referenciadores HTTP (sites)".
   - Adicione as URLs: `http://localhost:5174/*`, `http://127.0.0.1:5174/*`. 
   - Na produção adicione `https://friggafrio.com.br/*` e `https://www.friggafrio.com.br/*`.
4. **Restrições de API:** Restrinja o uso APENAS para **Maps Embed API**.

### Chave Backend (Places API)
1. Crie uma segunda Chave de API. Renomeie para `Backend Places API Key`.
2. **Restrições do aplicativo:** Selecione "Endereços IP (servidores web)" ou "Nenhuma" (somente se não tiver IP fixo no momento).
3. **Restrições de API:** Restrinja o uso APENAS para **Places API (New)**.
4. **IMPORTANTE:** Essa chave ficará EXCLUSIVAMENTE nas variáveis do backend e nunca deverá ser enviada ao Front-end.

## 5. Cotas e Alertas
- Configure "Cotas" na Places API para evitar scrapers de terceiros consumirem seu budget acidentalmente (por exemplo, 500 requests por dia).
- Em Faturamento, crie um **Orçamento e Alerta** (ex: R$ 50 mensais) para ser notificado se o uso disparar.
