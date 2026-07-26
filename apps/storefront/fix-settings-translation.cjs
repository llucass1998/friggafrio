const fs = require('fs');
const path = 'C:/Users/lluca/Documents/Codex/projeto friggagafrio/apps/storefront/src/pages/settings.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/Company Name/g, "Nome da Empresa");
content = content.replace(/Enter company name/g, "Digite o nome da empresa");
content = content.replace(/Upload a logo/g, "Fazer upload de logotipo");
content = content.replace(/JPG, PNG, GIF, WebP, or SVG. Max 5MB./g, "JPG, PNG, GIF, WebP ou SVG. Máximo de 5MB.");
content = content.replace(/Uploading\.\.\./g, "Enviando...");
content = content.replace(/Company Email/g, "E-mail da Empresa");
content = content.replace(/Enter company email/g, "Digite o e-mail da empresa");
content = content.replace(/Company Phone/g, "Telefone da Empresa");
content = content.replace(/Enter company phone/g, "Digite o telefone da empresa");
content = content.replace(/Company Address/g, "Endereço da Empresa");
content = content.replace(/Street Address/g, "Endereço");
content = content.replace(/Enter street address/g, "Digite o endereço");
content = content.replace(/City/g, "Cidade");
content = content.replace(/Enter city/g, "Digite a cidade");
content = content.replace(/State \/ Province/g, "Estado");
content = content.replace(/Enter state/g, "Digite o estado");
content = content.replace(/ZIP \/ Postal Code/g, "CEP");
content = content.replace(/Enter postal code/g, "Digite o CEP");
content = content.replace(/Country/g, "País");
content = content.replace(/Enter 2-letter country code/g, "Digite o código do país (BR)");

content = content.replace(/Spending Limit Settings/g, "Configurações de Limite de Gastos");
content = content.replace(/Reset Frequency/g, "Frequência de Redefinição");
content = content.replace(/When should company spending limits automatically reset/g, "Quando os limites de gastos da empresa devem ser redefinidos automaticamente");
content = content.replace(/Never/g, "Nunca");
content = content.replace(/Daily/g, "Diariamente");
content = content.replace(/Weekly/g, "Semanalmente");
content = content.replace(/Monthly/g, "Mensalmente");
content = content.replace(/Yearly/g, "Anualmente");

content = content.replace(/Saved Payment Methods/g, "Formas de Pagamento Salvas");
content = content.replace(/Manage your saved cards for faster checkout/g, "Gerencie seus cartões salvos para finalizar compras mais rápido");
content = content.replace(/Add New Card/g, "Adicionar Novo Cartão");
content = content.replace(/No payment methods saved yet/g, "Nenhuma forma de pagamento salva ainda");
content = content.replace(/Expires/g, "Expira em");
content = content.replace(/Delete/g, "Excluir");
content = content.replace(/Deleting\.\.\./g, "Excluindo...");
content = content.replace(/Set as Default/g, "Definir como Padrão");
content = content.replace(/Default/g, "Padrão");
content = content.replace(/Cancel/g, "Cancelar");
content = content.replace(/Save Changes/g, "Salvar Alterações");

fs.writeFileSync(path, content);
console.log("Translation done");
