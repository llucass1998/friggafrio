const fs = require('fs');

let content = fs.readFileSync('apps/storefront/src/components/public-footer.tsx', 'utf8');

const loginRepl = `const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "br"
  const currentYear = new Date().getFullYear()
  const { customer } = useAuth()

  const getAccountHref = (baseHref: string) => {
    if (baseHref.startsWith('/account') && !customer && baseHref !== '/account/login' && baseHref !== '/account/register') {
      return \`/\${countryCode}/account/login?returnTo=\${encodeURIComponent(\`/\${countryCode}\${baseHref}\`)}\`
    }
    
    return baseHref.startsWith('/account') 
      ? \`/\${countryCode}\${baseHref}\`
      : baseHref.startsWith('/') ? \`/\${countryCode}\${baseHref}\` : baseHref
  }`;

content = content.replace(`const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "br"
  const currentYear = new Date().getFullYear()`, loginRepl);


const replaceAccordion = `          <div className="md:col-span-4 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {/* Produtos */}
            <Accordion title="Produtos" defaultOpen={true}>
              <ul className="space-y-3">
                {footerNavigation.products.filter(item => item.active).map(item => (
                  <li key={item.id}>
                    <Link to={item.href as any} className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Accordion>

            {/* Institucional */}
            <Accordion title="Institucional">
              <ul className="space-y-3">
                {footerNavigation.institutional.filter(item => item.active).map(item => (
                  <li key={item.id}>
                    {item.id === "fale-conosco" ? (
                      <a href={\`https://wa.me/\${storeConfig.whatsappNumber}?text=\${encodeURIComponent("Olá! Estou no site da FriggaFrio e gostaria de falar com a equipe.")}\`} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors" aria-label="Falar com a FriggaFrio pelo WhatsApp">
                        {item.label}
                      </a>
                    ) : (
                      <Link to={item.href as any} className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors">
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </Accordion>

            {/* Atendimento */}
            <Accordion title="Atendimento">
              <ul className="space-y-3">
                {footerNavigation.support.filter(item => item.active).map(item => (
                  <li key={item.id}>
                    <Link to={item.href as any} className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
                {footerNavigation.support.filter(item => item.active).length === 0 && (
                   <li className="text-sm text-gray-500 italic">Área em construção</li>
                )}
              </ul>
            </Accordion>

            {/* Minha Conta */}
            <Accordion title="Minha Conta">
              <ul className="space-y-3">
                {footerNavigation.account.filter(item => item.active).map(item => (
                  <li key={item.id}>
                    <Link to={getAccountHref(item.href) as any} className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Accordion>
          </div>`;

content = content.replace(/<div className="md:col-span-4 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, replaceAccordion + '\n        </div>\n      </div>');

const termLinks = `<div className="flex gap-4 text-xs font-medium whitespace-nowrap">
              <Link to={"/$countryCode" as string} params={{ countryCode }} className="text-gray-500 hover:text-white transition-colors">Termos e Condições</Link>
              <span className="text-gray-700">|</span>
              <Link to={"/$countryCode" as string} params={{ countryCode }} className="text-gray-500 hover:text-white transition-colors">Política de Privacidade</Link>
            </div>`;
content = content.replace(termLinks, "");

fs.writeFileSync('apps/storefront/src/components/public-footer.tsx', content);

