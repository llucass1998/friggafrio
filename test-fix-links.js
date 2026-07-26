const fs = require('fs');

function fixLinks(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/input: \{\s*links: (.*),\s*\/\/ @ts-ignore\s*\}/g, 'input: { links: $1 } as any');
  content = content.replace(/input: \{\s*links_ignore: (.*),\s*\}/g, 'input: { links: $1 } as any');
  fs.writeFileSync(filePath, content);
}

fixLinks('apps/backend/src/migration-scripts/force-products-seed.ts');
fixLinks('apps/backend/src/scripts/seed-frigga-real-products.ts');
