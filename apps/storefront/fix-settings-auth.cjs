const fs = require('fs');
const path = 'C:/Users/lluca/Documents/Codex/projeto friggagafrio/apps/storefront/src/pages/settings.tsx';
let content = fs.readFileSync(path, 'utf8');

const insertionPoint = "export default function SettingsPage() {\n  const { customer, refetch, isLoading: isCustomerLoading, isAdmin, employee, isAuthenticated } = useAuth()";

content = content.replace("export default function SettingsPage() {\n  const { customer, refetch, isLoading: isCustomerLoading, isAdmin, employee } = useAuth()", insertionPoint);

const unauthBlock = `
  if (!isAuthenticated && !isCustomerLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Minha Conta</h1>
        <p className="text-slate-500">Você precisa estar logado para acessar esta página.</p>
      </div>
    )
  }

  if (isCustomerLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-accent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }
`;

content = content.replace("  const tabs = [\n    {\n      id: \"profile\"", unauthBlock + "\n  const tabs = [\n    {\n      id: \"profile\"");

fs.writeFileSync(path, content);
console.log("Updated settings.tsx");
