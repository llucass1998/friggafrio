import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.resolve('apps/storefront/src/config/company-team.ts');
const PUBLIC_DIR = path.resolve('apps/storefront/public');

const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
const matches = content.matchAll(/"imageSrc":\s*"(.*?)"/g);

let missing = 0;
let valid = 0;

for (const match of matches) {
  const imgSrc = match[1];
  if (!imgSrc) continue;

  const absolutePath = path.join(PUBLIC_DIR, imgSrc);
  if (!fs.existsSync(absolutePath)) {
    console.error(`[ERROR] Missing image file: ${imgSrc} (expected at ${absolutePath})`);
    missing++;
  } else {
    valid++;
  }
}

if (missing > 0) {
  console.error(`Validation failed! ${missing} missing images.`);
  process.exit(1);
} else {
  console.log(`Validation passed! All ${valid} images exist.`);
}
