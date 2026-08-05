const fs = require('fs');
const file = 'config/brands.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('logoSrc: "/images/brands/siccom.jpg"', 'logoSrc: "/images/brands/siccom.webp"');
content = content.replace('logoSrc: "/images/brands/coel.jpg"', 'logoSrc: "/images/brands/coel.webp"');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed siccom and coel extensions');
