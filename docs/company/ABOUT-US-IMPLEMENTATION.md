# About Us (Quem Somos) Page Implementation

## Overview
Added the `/quem-somos` page based on the institutional structure provided from the official site (https://frigga.com.br/index.html).

## Features
- **Story Source**: Replicated the core story surrounding Paulo Neulaender ("Paulinho") and the company's 35+ years of HVAC-R experience without artificially inflating or inventing numbers.
- **Team Configuration**: Implemented a strongly typed setup via `src/config/company-team.ts` holding verified team members ("Diretoria", "Quem faz a Frigga").
- **Privacy & Safety**: Removed personal emails, phone numbers, and direct extensions from the UI, directing users entirely through the main WhatsApp line setup via `storeConfig`.
- **Card Design**: Added `TeamMemberCard.tsx` with a standard layout including the member's photo, role, and internal area tag. Falls back to a clean placeholder "Foto pendente" if no image is available.

## How to Update
- Go to `apps/storefront/src/config/company-team.ts`.
- Add a new `CompanyTeamMember` object.
- To deactivate an employee without breaking layouts, switch their `active: true` flag to `active: false`.
