const fs = require('fs');
const file = 'config/brands.ts';
let content = fs.readFileSync(file, 'utf8');

// Forçar para a imagem que baixamos (siccom que é o parceiro-2 e a coel que não tinha sido baixada corretamente)
// Na verdade, Siccom no nosso script baixou como chemours.jpg e Coel como quimital.jpg.
// Vamos checar e baixar diretamente as de siccom e coel.
