const fs = require('fs');
const glob = require('glob');
const path = require('path');

const files = glob.sync('src/components/**/*.{ts,tsx}');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  if (file.includes('accessibility')) {
    content = content.replace(/from "(\.\.?\/[^"]+)"/g, (match, p1) => {
      if (p1.startsWith('.')) {
        const absolutePath = path.resolve(path.dirname(file), p1);
        const relativeToSrc = path.relative(path.resolve('src'), absolutePath).split(path.sep).join('/');
        return `from "@/${relativeToSrc}"`;
      }
      return match;
    });
    
    content = content.replace(/from '(\.\.?\/[^']+)'/g, (match, p1) => {
      if (p1.startsWith('.')) {
        const absolutePath = path.resolve(path.dirname(file), p1);
        const relativeToSrc = path.relative(path.resolve('src'), absolutePath).split(path.sep).join('/');
        return `from "@/${relativeToSrc}"`;
      }
      return match;
    });
    
    if (content !== original) fs.writeFileSync(file, content);
  }
});

let layoutContent = fs.readFileSync('src/components/layout.tsx', 'utf8');
layoutContent = layoutContent.replace(/from "\.\/public-layout"/g, 'from "@/components/public-layout"');
layoutContent = layoutContent.replace(/const { isAuthenticated, isLoading } = useAuth\(\)/g, '');
fs.writeFileSync('src/components/layout.tsx', layoutContent);

console.log("Imports fixed");
