import React from 'react';
import { useAccessibility } from './AccessibilityProvider';
import * as Switch from '@radix-ui/react-switch';
import { storeConfig } from '@/config/store';

export function AccessibilityTopBar() {
  const { preferences, togglePanel } = useAccessibility();
  const phoneFormatted = storeConfig.phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');

  return (
    <div className="a11y-top-bar bg-[#f8fafc] border-b border-[#e2e8f0] py-2 px-4 sm:px-6 lg:px-8 text-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Left Side: Accessibility Toggle */}
        <div className="flex items-center gap-3">
          <Switch.Root 
            className="w-11 h-6 bg-gray-300 rounded-full relative shadow-[0_2px_10px] shadow-black/5 focus:shadow-[0_0_0_2px] focus:shadow-[var(--color-primary)] data-[state=checked]:bg-[var(--color-primary)] outline-none cursor-pointer transition-colors"
            id="a11y-toggle-top"
            checked={preferences.panelEnabled}
            onCheckedChange={togglePanel}
            aria-label="Ativar painel de acessibilidade"
            aria-expanded={preferences.panelEnabled}
            aria-controls="a11y-panel-drawer"
          >
            <Switch.Thumb className="block w-5 h-5 bg-white rounded-full shadow-[0_2px_2px] shadow-black/20 transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]" />
          </Switch.Root>
          <label 
            htmlFor="a11y-toggle-top" 
            className="text-[var(--color-navy)] font-medium cursor-pointer select-none"
          >
            {preferences.panelEnabled ? 'Acessibilidade ativada' : 'Ativar acessibilidade'}
          </label>
        </div>

        {/* Right Side: Contact / Help */}
        <div className="hidden md:flex items-center gap-6 text-[var(--color-navy)] font-medium">
          <a 
            href={`https://wa.me/55${storeConfig.phone.replace(/\D/g, '')}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-[var(--color-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm"
          >
            Vendas: {phoneFormatted}
          </a>
          <a 
            href="/br/store"
            className="hover:text-[var(--color-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm"
          >
            Central de Ajuda
          </a>
        </div>

      </div>
    </div>
  );
}
