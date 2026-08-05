import React, { useEffect } from 'react';
import { useAccessibility } from './AccessibilityProvider';

export function VLibrasWidget() {
  const { preferences } = useAccessibility();

  useEffect(() => {
    // Only load if enabled
    if (!preferences.vlibrasEnabled) return;

    // Check if already loaded
    if (document.getElementById('vlibras-script')) return;

    const script = document.createElement('script');
    script.id = 'vlibras-script';
    script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    script.async = true;
    script.onload = () => {
      if (typeof window !== 'undefined' && (window as any).VLibras) {
        new (window as any).VLibras.Widget('https://vlibras.gov.br/app');
      }
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup is tricky with VLibras, we generally just leave it if it was enabled once
    };
  }, [preferences.vlibrasEnabled]);

  if (!preferences.vlibrasEnabled) return null;

  return (
    <div {...{ vw: "true" } as any} className="enabled">
      <div {...{ "vw-access-button": "true" } as any} className="active"></div>
      <div {...{ "vw-plugin-wrapper": "true" } as any}>
        <div className="vw-plugin-top-wrapper"></div>
      </div>
    </div>
  );
}
