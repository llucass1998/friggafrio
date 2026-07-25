# Footer Link Audit

## Overview
A comprehensive audit and restructuring of the website footer to fix invalid paths and remove unverified pages.

## Removals
- **Blog / Notícias**: Temporarily removed as paths and resources are not ready.
- **Responsabilidade Ambiental**: Temporarily removed.
- **Serviços Técnicos**: Temporarily removed.
- **Empty Links**: Any instances of `href="#"` or dead internal references have been fully cleaned.

## Routing and Auth Improvements
- **Fazer Login / Minha Conta**: Re-routed explicitly using TanStack parameters to direct non-authenticated users seamlessly via `/account/login` and preserving `returnTo`. If a user is logged in, they are pointed directly to their specific `/account` view.
- **WhatsApp Links**: Now use standard parameterized E.164 formats parsed straight out of `storeConfig.whatsappNumber` to centralize phone changes in the future, dropping duplicate logic strings.
- **Config Strategy**: Added `src/config/footer-navigation.ts` to type-safety verify every destination link present in the Footer tree using `FooterNavigationItem` object representations.
