import fs from 'fs';
const middlewaresFile = 'apps/backend/src/api/middlewares.ts';
let code = fs.readFileSync(middlewaresFile, 'utf8');
// Corrige o regex mal formatado no arquivo
code = code.replace(/matcher:\s*\/\^\/store\(\?:\/\|\$\)\//g, 'matcher: /^\/store(?:\/|$)/');
fs.writeFileSync(middlewaresFile, code);
