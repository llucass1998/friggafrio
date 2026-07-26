import fs from 'fs';
const testFile = 'apps/backend/src/__tests__/authorization.unit.spec.ts';
let code = fs.readFileSync(testFile, 'utf8');

// Remover a primeira linha que importa do @jest/globals, já que o framework os injeta no contexto.
code = code.replace(/import { describe, it, expect } from "@jest\/globals";\n/, '');

fs.writeFileSync(testFile, code);
