const fs = require('fs');
const path = require('path');

const table = path.join(__dirname, 'apps/backend/src/admin/routes/quotes/components/quotes-table.tsx');
if (fs.existsSync(table)) {
  let content = fs.readFileSync(table, 'utf8');
  content = content.replace(/quote\.draft_order\?\.customer\?\.employee\?\.company\?\.name/g, '(quote.draft_order?.customer as any)?.employee?.company?.name');
  fs.writeFileSync(table, content);
}
