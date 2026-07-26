# Runtime Source of Truth

- **PID 36644 (Port 9000):** Node.js running backend Medusa (Windows).
- **PID 6472 (Port 5432):** PostgreSQL.
- **PID 31244 / 36072 (Port 6379):** Redis (Docker / WSL bridge).
- **PID 20092 (Port 5173) / 34012 (Port 5174):** Two distinct Vite instances for the Storefront (Windows).

- Both the Windows processes run from `C:\Users\lluca\Documents\Codex\projeto friggagafrio\...`
- No WSL duplicate background running the codebase found, just WSL bridge/Docker for DBs.
