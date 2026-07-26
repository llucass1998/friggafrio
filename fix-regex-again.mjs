import fs from 'fs';
const middlewaresFile = 'apps/backend/src/api/middlewares.ts';
let code = fs.readFileSync(middlewaresFile, 'utf8');

// Vamos substituir diretamente pela string hardcoded, sem parse regex perigoso no node.
code = code.replace("matcher: /^\/store(?:\/|$)/", 'matcher: "^/store(?:/|$)"');
code = code.replace("matcher: /^/store(?:/|$)/", 'matcher: "^/store(?:/|$)"');

// Se o problema for na linha do matcher que usamos no protectSessionMutation (linhas 27-29)
code = code.replace("matcher: /^\/store(?:\/|$)/,", 'matcher: "^/store",');

fs.writeFileSync(middlewaresFile, code);
