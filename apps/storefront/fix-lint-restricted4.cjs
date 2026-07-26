const fs = require('fs');
const glob = require('glob');
const path = require('path');

const files = glob.sync('src/**/*.{ts,tsx}');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
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
});

console.log("All restricted imports fixed");
