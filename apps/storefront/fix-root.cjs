const fs = require('fs');
const content = fs.readFileSync('src/routes/__root.tsx', 'utf8');

const importStatement = "import { DevBuildBadge } from '@/components/DevBuildBadge';";
let newContent = importStatement + '\n' + content;

newContent = newContent.replace(
  '{import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}',
  '{import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}\n        <DevBuildBadge />'
);

fs.writeFileSync('src/routes/__root.tsx', newContent);
