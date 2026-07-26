const fs = require('fs');
const execSync = require('child_process').execSync;

let commit = 'unknown';
let branch = 'unknown';
try {
  commit = execSync('git rev-parse --short HEAD').toString().trim();
  branch = execSync('git branch --show-current').toString().trim();
} catch(e) {}

const buildTime = new Date().toISOString();

const content = fs.readFileSync('vite.config.ts', 'utf8');

if (!content.includes('__APP_GIT_SHA__')) {
  const injection = `
    define: {
      __APP_GIT_SHA__: JSON.stringify("${commit}"),
      __APP_GIT_BRANCH__: JSON.stringify("${branch}"),
      __APP_BUILD_TIME__: JSON.stringify("${buildTime}")
    },
    plugins: [`;
  
  fs.writeFileSync('vite.config.ts', content.replace('plugins: [', injection));
}
