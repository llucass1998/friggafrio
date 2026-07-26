# Identificação do Servidor Sendo Exibido

## Processos e Portas
- **9000**: PID `10840` - Backend Medusa (`@medusajs/cli start --types`)
- **5173**: PID `20092` - Frontend Vite Dev Server (`vite dev`)
- **5174**: PID `34012` - Frontend Vite Dev Server Duplicado (`vite dev`)

## Conclusões
Existem **DOIS** processos simultâneos do frontend abertos via `vite dev` no mesmo diretório base (`apps/storefront`).
- O PID `20092` inicializou primeiro (porta 5173).
- O PID `34012` inicializou posteriormente (pegando a porta 5174 porque a 5173 estava em uso).
Isso explica as regressões e a falta de atualizações de arquivo. A porta que tentávamos abrir possuía uma versão estagnada e que não correspondia com os artefatos visuais mais recentes, e as atualizações de HMR estavam se confundindo ou não refletindo entre os processos concorrentes.

## Resolução (Pendente na Fase 5)
A solução é matar os dois processos do Frontend e subí-los em porta fixa `5173` usando a flag `--strictPort` após a limpeza total do cache (`.vite`, `.tanstack`, `.turbo`, `dist`).
