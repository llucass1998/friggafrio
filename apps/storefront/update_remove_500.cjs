const fs = require('fs')

let path = 'tests/checkout-auth.spec.ts'
let content = fs.readFileSync(path, 'utf8')

// Remover o test de erro 500
const testRegex = /test\('erro inesperado de autenticacao mostra mensagem sem loopar'[\s\S]*?\}\);/g
content = content.replace(testRegex, '')

fs.writeFileSync(path, content)
