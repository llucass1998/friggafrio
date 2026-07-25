# Store Selection Fix

## Issue Summary
Previously, users could not click to switch the active location on the "Nossa Loja" page. The active state logic was not correctly integrated into the DOM via fully accessible methods and the events were not propagating or reacting correctly on the map components. 

## Changes Implemented
- **React State Correction**: Verified `selectedLocationId` from TanStack Query/React state to react automatically when `onSelect` triggers from a card.
- **Card Selection Click Handling**: Removed default propagation leaks (`e.stopPropagation()`) from independent buttons like "Como Chegar" and "WhatsApp" so clicking them does not trigger the map logic.
- **CSS Hover & Elevation**: Added `hover:-translate-y-2 hover:shadow-xl` to the active location cards using standard CSS transforms instead of `float`. Wrapped inside `transition-all duration-300` and respecting `motion-reduce:transition-none` for users who have prefers-reduced-motion configured.
- **Keyboard Navigation**: Added `onKeyDown` allowing selection of store items using `Enter` or `Space` on focus.
- **Accessible State Mapping**: Used `aria-pressed={isSelected}` and added an `aria-live="polite"` zone that announces the selected store directly to screen readers (e.g., "FriggaFrio — Loja 2 selecionada.").
