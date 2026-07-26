import React from 'react';

export function SkipLinks() {
  return (
    <div id="a11y-skip-links">
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-[var(--color-primary)] focus:text-white focus:px-6 focus:py-3 focus:rounded-md focus:font-bold focus:shadow-lg focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-white"
      >
        Ir para o conteúdo principal
      </a>
      <a 
        href="#main-navigation" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-[var(--color-primary)] focus:text-white focus:px-6 focus:py-3 focus:rounded-md focus:font-bold focus:shadow-lg focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-white"
      >
        Ir para o menu principal
      </a>
      <a 
        href="#site-footer" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-[var(--color-primary)] focus:text-white focus:px-6 focus:py-3 focus:rounded-md focus:font-bold focus:shadow-lg focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-white"
      >
        Ir para o rodapé
      </a>
    </div>
  );
}
