const fs = require('fs');
const path = require('path');

const page = path.join(__dirname, 'apps/backend/src/admin/routes/quotes/[quoteId]/page.tsx');
if (fs.existsSync(page)) {
  let content = fs.readFileSync(page, 'utf8');
  content = content.replace(/const customer = quote\.draft_order\?\.customer as any;/g, 'const customer = quote.draft_order?.customer as unknown as Record<string, unknown>;');
  
  // also fix where we access customer
  content = content.replace(/customer\?\.employee\?\.company\?\.logo_url/g, '(customer?.employee as Record<string, unknown>)?.company?.logo_url');
  content = content.replace(/customer\?\.employee\?\.company\?\.name/g, '(customer?.employee as Record<string, unknown>)?.company?.name');
  content = content.replace(/customer\?\.employee\?\.company\?\.id/g, '(customer?.employee as Record<string, unknown>)?.company?.id');
  content = content.replace(/customer\?\.employee\?\.spending_limit/g, '(customer?.employee as Record<string, unknown>)?.spending_limit');
  content = content.replace(/customer\.employee\.spending_limit/g, '(customer?.employee as Record<string, unknown>)?.spending_limit as number');
  content = content.replace(/customer\.employee\.company\?\.currency_code/g, '(customer?.employee as Record<string, unknown>)?.company?.currency_code');
  fs.writeFileSync(page, content);
}

const table = path.join(__dirname, 'apps/backend/src/admin/routes/quotes/components/quotes-table.tsx');
if (fs.existsSync(table)) {
  let content = fs.readFileSync(table, 'utf8');
  content = content.replace(/\(quote\.draft_order\?\.customer as any\)/g, '(quote.draft_order?.customer as unknown as Record<string, unknown>)');
  fs.writeFileSync(table, content);
}
