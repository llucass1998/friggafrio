const fs = require('fs');
const execSync = require('child_process').execSync;
const glob = require('glob');
const path = require('path');

// Fix restricted imports in components
const files = glob.sync('src/components/**/*.{ts,tsx}');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  if (file.includes('accessibility')) {
    content = content.replace(/from "(\.\.?\/[^"]+)"/g, (match, p1) => {
      if (p1.startsWith('.')) {
        const absolutePath = path.resolve(path.dirname(file), p1);
        const relativeToSrc = path.relative(path.resolve('src'), absolutePath).replace(/\/g, '/');
        return `from "@/${relativeToSrc}"`;
      }
      return match;
    });
    
    content = content.replace(/from '(\.\.?\/[^']+)'/g, (match, p1) => {
      if (p1.startsWith('.')) {
        const absolutePath = path.resolve(path.dirname(file), p1);
        const relativeToSrc = path.relative(path.resolve('src'), absolutePath).replace(/\/g, '/');
        return `from "@/${relativeToSrc}"`;
      }
      return match;
    });
    fs.writeFileSync(file, content);
  }
});

// Also fix layout.tsx
let layoutContent = fs.readFileSync('src/components/layout.tsx', 'utf8');
layoutContent = layoutContent.replace(/from "\.\/public-layout"/g, 'from "@/components/public-layout"');
layoutContent = layoutContent.replace(/const { isAuthenticated, isLoading } = useAuth\(\)/g, '');
fs.writeFileSync('src/components/layout.tsx', layoutContent);

// Fix ProductActions
let paContent = fs.readFileSync('src/components/product-actions.tsx', 'utf8');
paContent = paContent.replace(/import { useCart } from "\.\.\/lib\/context\/cart"/g, 'import { useCart } from "@/lib/context/cart"');
paContent = paContent.replace(/import { formatCurrencyAmount } from "\.\.\/lib\/utils\/currency"/g, 'import { formatCurrencyAmount } from "@/lib/utils/currency"');
fs.writeFileSync('src/components/product-actions.tsx', paContent);

// Fix navbar
let navContent = fs.readFileSync('src/components/navbar.tsx', 'utf8');
navContent = navContent.replace(/import { useCart } from "\.\.\/lib\/context\/cart"/g, 'import { useCart } from "@/lib/context/cart"');
fs.writeFileSync('src/components/navbar.tsx', navContent);

console.log("Imports fixed");
