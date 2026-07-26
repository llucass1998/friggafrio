import fs from 'fs';

const footerFile = 'apps/storefront/src/components/footer.tsx';

try {
  let code = fs.readFileSync(footerFile, 'utf8');

  // Substituir temporariamente `href="#"` por rotas sensatas
  // Caso a rota ainda não exista, mapear para a home canônica '/' ou para as rotas corretas que criaremos em conteúdo.
  code = code.replace(/href="#"/g, 'href="/"');

  fs.writeFileSync(footerFile, code);
  console.log("Footer links fixed.");
} catch (e) {
  console.log("Footer file not found or could not be read.");
}
