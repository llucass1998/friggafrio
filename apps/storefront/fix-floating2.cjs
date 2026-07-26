const fs = require('fs');

const path = 'src/components/FloatingActions.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/'/g, '"');

fs.writeFileSync(path, content);
console.log('Fixed floating actions quotes');
