import fs from 'fs';
import path from 'path';

function findUndefinedLinks(dir) {
  let found = false;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('.turbo')) {
        if (findUndefinedLinks(fullPath)) found = true;
      }
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');

      // Procura por href ou to com risco de undefined
      const regexLink = /(href|to)=\{.*?undefined.*?\}/g;
      const regexToUndefined = /to=\{"\/undefined.*?"\}/g;
      const regexCountryCode = /params=\{\{\s*countryCode:\s*([^}]+)\s*\}\}/g;

      if (regexLink.test(content) || regexToUndefined.test(content)) {
        console.log(`[AVISO] Possível link para undefined encontrado em: ${fullPath}`);
        found = true;
      }

      let match;
      while ((match = regexCountryCode.exec(content)) !== null) {
        if (match[1].trim() === 'undefined' || match[1].includes('countryCode') && content.includes('const countryCode = undefined')) {
           console.log(`[ALERTA] Risco de countryCode undefined em: ${fullPath}`);
           found = true;
        }
      }
    }
  }
  return found;
}

console.log("Iniciando varredura por links quebrados (undefined) no storefront...");
findUndefinedLinks(path.resolve('./apps/storefront/src'));
console.log("Varredura concluída.");
