const fs = require('fs');

let content = fs.readFileSync('apps/storefront/src/components/store-locations/StoreLocationCard.tsx', 'utf8');

// The card needs to be fully selectable by keyboard and hover effects
const newCardRoot = `
    <div
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (onSelect) onSelect()
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      className={\`w-full flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm transition-all duration-300 border-2 cursor-pointer
        motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-primary)]
        \${isSelected 
          ? "border-[var(--color-primary)] ring-4 ring-[var(--color-primary)]/10 shadow-md" 
          : "border-[#E5EDF4] hover:border-[var(--color-primary)]/50 hover:shadow-xl hover:-translate-y-2"}
      \`}
    >
`;

content = content.replace(/<div\s*className=\{`w-full flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md border-2 \$\{[^}]+\}\s*`\}\s*>/, newCardRoot);

// Ensure the button inside doesn't propagate the click
const oldButton = `onClick={onSelect}`;
const newButton = `onClick={(e) => {
                e.stopPropagation()
                if (onSelect) onSelect()
              }}`;
content = content.replace(oldButton, newButton);

// Ensure directions button doesn't propagate
const oldDirButton = `onClick={handleDirections}`;
const newDirButton = `onClick={(e) => {
                e.stopPropagation()
                handleDirections()
              }}`;
content = content.replace(oldDirButton, newDirButton);

// Ensure whatsapp button doesn't propagate
const oldWppButton = `onClick={handleWhatsapp}`;
const newWppButton = `onClick={(e) => {
                e.stopPropagation()
                handleWhatsapp()
              }}`;
content = content.replace(oldWppButton, newWppButton);

fs.writeFileSync('apps/storefront/src/components/store-locations/StoreLocationCard.tsx', content);

let pageContent = fs.readFileSync('apps/storefront/src/pages/public-stores.tsx', 'utf8');

// Add aria-live for announcement
pageContent = pageContent.replace('<div className="w-full bg-[#FAFAFA] min-h-screen pb-16 font-sans">', `<div className="w-full bg-[#FAFAFA] min-h-screen pb-16 font-sans">
      <div aria-live="polite" className="sr-only">
        {activeLocation ? \`\${activeLocation.name} selecionada.\` : ''}
      </div>`);

fs.writeFileSync('apps/storefront/src/pages/public-stores.tsx', pageContent);
