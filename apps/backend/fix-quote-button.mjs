import fs from 'fs';
const file = 'apps/storefront/src/components/product-actions.tsx';
let code = fs.readFileSync(file, 'utf8');

// Adiciona o import do WhatsApp se nao existir
if (!code.includes('import { createWhatsAppUrl }')) {
  code = code.replace(
    'import { getCountryCodeFromPath } from "@/lib/utils/region"',
    'import { getCountryCodeFromPath } from "@/lib/utils/region"\nimport { createWhatsAppUrl } from "@/lib/whatsapp"'
  );
}

// Injetar lógida de redirect para o WhatsApp na renderização do botão
if (!code.includes('const isQuoteOnly')) {
  const purchaseStateLogic = `
  const isQuoteOnly = purchaseState.status === "unavailable" || purchaseState.status === "price_pending"
  
  const handleQuoteRedirect = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = window.location.href;
    const sku = selectedVariant?.sku || product.variants?.[0]?.sku || "N/A";
    const priceText = displayPrice ? formatCurrencyAmount({ amount: displayPrice, currencyCode: countryCode === "br" ? "BRL" : "BRL" }) : "A combinar";
    
    const message = \`Olá! Gostaria de solicitar um orçamento pelo site:
Produto: \${product.title}
SKU: \${sku}
Preço Base: \${priceText}
Link: \${url}\`;

    const waUrl = createWhatsAppUrl();
    if (waUrl) {
      window.open(waUrl.replace(/text=[^&]*/, \`text=\${encodeURIComponent(message)}\`), '_blank');
    }
  }
`;

  code = code.replace('let buttonText = "Comprar";', purchaseStateLogic + '\n  let buttonText = "Comprar";');
  
  code = code.replace('if (purchaseState.status === "unavailable") {\n    buttonText = "Indisponível";\n  } else if (purchaseState.status === "price_pending") {\n    buttonText = "Preço em confirmação";',
    'if (purchaseState.status === "unavailable") {\n    buttonText = "Solicitar Cotação";\n  } else if (purchaseState.status === "price_pending") {\n    buttonText = "Solicitar Orçamento";');

  // Adicionar o botão secundário caso seja Quote
  const buttonCode = `
      {isQuoteOnly ? (
        <button
          onClick={handleQuoteRedirect}
          className="mt-4 flex items-center justify-center w-full min-h-[56px] px-6 py-4 text-base font-bold rounded-[var(--radius-button)] transition-all duration-[160ms] bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-900/20 motion-interactive"
        >
          <span className="flex items-center gap-2">
            {buttonText} via WhatsApp
          </span>
        </button>
      ) : (
      <button`;

  code = code.replace('<button\n        onClick={handleAddToCart}', buttonCode + '\n        onClick={handleAddToCart}');
  
  // fechar a condicional JSX no final do retorno
  code = code.replace('buttonText\n        )}\n      </button>\n    </div>', 'buttonText\n        )}\n      </button>\n      )}\n    </div>');

  fs.writeFileSync(file, code);
  console.log("Component product-actions updated for Quotes");
}
