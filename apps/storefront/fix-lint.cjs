const fs = require('fs');
const execSync = require('child_process').execSync;
execSync('pnpm --filter storefront exec eslint --fix src', { stdio: 'inherit' });
