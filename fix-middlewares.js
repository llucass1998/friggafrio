const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'apps', 'backend', 'src', 'api', 'middlewares.ts');
let content = fs.readFileSync(filePath, 'utf8');

const rateLimitRule = `    {
      matcher: "^/store(?:/|$)",
      middlewares: [globalApiRateLimit],
    },
    {
      matcher: "/store/contact-requests",
      method: "POST",
      middlewares: [globalApiRateLimit],
    },`;

content = content.replace(`    {
      matcher: "^/store(?:/|$)",
      middlewares: [globalApiRateLimit],
    },`, rateLimitRule);

fs.writeFileSync(filePath, content);
