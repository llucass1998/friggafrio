import fs from 'fs';
import path from 'path';

const middlewaresFile = 'apps/backend/src/api/middlewares.ts';
let code = fs.readFileSync(middlewaresFile, 'utf8');

// Adicionar importações de segurança se não existirem
if (!code.includes('authRateLimit')) {
  const importStatement = `import {
  authRateLimit,
  registerRateLimit,
  globalApiRateLimit,
  secureHeaders,
} from "./middlewares/rate-limiting";\n`;

  // Colocar após a última importação do Medusa (ou similar)
  code = importStatement + code;
  
  // Atualizar as rotas para incluir os novos middlewares.
  
  // Global (qualquer rota na api do backend, usando um array com regex vazio - matcher: /.*/ ou similar)
  // Medusa permite global hook
  const globalMiddleware = `
    {
      matcher: /.*/,
      middlewares: [secureHeaders],
    },
    {
      matcher: /^\/store(?:\/|$)/,
      middlewares: [globalApiRateLimit],
    },`;
    
  code = code.replace(/routes:\s*\[/, 'routes: [' + globalMiddleware);

  // Rate limit para auth: `/auth/session`, etc. 
  // Procurando o bloco de auth session existente para adicionar o `authRateLimit`
  code = code.replace(
    /middlewares:\s*\[requireTrustedAuthOrigin\]/g, 
    'middlewares: [requireTrustedAuthOrigin, authRateLimit]'
  );
  
  // Rate limit para customers/register
  code = code.replace(
    /matcher:\s*"\/store\/customers\/register",?\s*middlewares:\s*\[/g, 
    'matcher: "/store/customers/register",\n      middlewares: [registerRateLimit, '
  );
  
  fs.writeFileSync(middlewaresFile, code);
  console.log("Middlewares file updated successfully.");
} else {
  console.log("Already updated.");
}
