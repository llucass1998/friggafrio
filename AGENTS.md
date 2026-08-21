# FriggaFrio Agent Policy

## Canonical source

Windows:
`C:/Users/lluca/orca/workspaces/projeto friggagafrio/Maestro`

WSL:
`/home/srv/friggafrio/Maestro`

Branch: `Maestro`

Remote: `origin/Maestro`

## Production checkout

`/home/srv/friggafrio/Maestro-deploy`

## Source synchronization

Código-fonte é sincronizado exclusivamente por Git:

Windows Maestro
-> origin/Maestro
-> WSL Maestro.

É proibido copiar source manualmente entre ambientes.

## Deployment ownership

PRODUCTION DEPLOYMENT = WSL ONLY.

Never deploy from Windows.

Never deploy from Nautilus.

## Production runtime

WSL + systemd.

Services:

- `friggafrio-backend.service` - backend `9000`
- `friggafrio-storefront.service` - storefront `5173`

## Runtime ownership

Somente systemd pode manter os processos permanentes de produção.

Never start a second production Medusa process.

## Forbidden actions

- Never edit `Maestro-deploy` as development source.
- Never disable production systemd services to solve a development problem.
- Never create automatic worktrees.
- Never use Nautilus as source of truth.
- Never guess ports.
- Never guess an Admin URL.
- Never manually copy source to WSL.
- Never overwrite production `.env`.
- Never use force push.
- Never run destructive Git automatically.

## Git policy

One cohesive commit por wave.

No AI co-author trailer.

Do not commit `.env`, secrets, runtime logs or temporary screenshots.

## Deployment pipeline

Windows Maestro
-> validation
-> commit
-> push origin/Maestro
-> WSL Maestro sync
-> `deploy/wsl-deploy.sh`
-> Maestro-deploy
-> build
-> systemd
-> healthcheck
-> Caddy
-> public smoke QA.

## Deployment SHA rule

`SOURCE_SHA`, `REMOTE_SHA`, `WSL_SOURCE_SHA` and `DEPLOY_SHA` precisam representar a mesma release.

## Environment policy

Secrets permanecem machine-specific.

`.env` nunca é transferido via Git.

## Safety

DB, Redis, uploads, `.env`, Caddy e DNS devem ser preservados salvo task explícita que exija alteração.
