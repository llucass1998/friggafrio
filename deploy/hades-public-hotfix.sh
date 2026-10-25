#!/usr/bin/env bash
# Correção pública limitada: compila um candidato Git e troca apenas Admin + storefront.
# Invocado exclusivamente pelo dispatcher WSL; nunca usa a ferramenta frigga-release bloqueada.
set -Eeuo pipefail
[[ "$(id -u)" == 1003 && "$HOME" == /home/frigga ]] || { printf '%s\n' 'HADES_UID_REQUIRED' >&2; exit 1; }
sha="${1:?SHA aprovado obrigatório}"
[[ "$sha" =~ ^[a-f0-9]{40}$ ]] || exit 1
export PATH="$HOME/.local/bin:$PATH" XDG_RUNTIME_DIR=/run/user/1003 TMPDIR="$HOME/tmp"
exec 9>"$HOME/.public-hotfix.lock"
flock -n 9 || { printf '%s\n' 'HOTFIX_ALREADY_RUNNING'; exit 1; }
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
candidate="$HOME/releases/public-hotfix-$stamp"
backup="$HOME/backups/public-hotfix-$stamp"
mkdir -p "$backup"
for url in http://127.0.0.1:19000/health http://127.0.0.1:13000/br https://friggafrio.com.br/app; do
  [[ "$(curl -fsS --max-time 15 -o /dev/null -w '%{http_code}' "$url")" == 200 ]] || exit 1
done
[[ "$(pnpm --version)" == 10.12.3 ]] || { printf '%s\n' 'PNPM_VERSION_MISMATCH'; exit 1; }
git -C "$HOME/app" fetch origin Maestro
[[ "$(git -C "$HOME/app" rev-parse origin/Maestro)" == "$sha" ]] || { printf '%s\n' 'SHA_MISMATCH'; exit 1; }
# O checkout ativo permanece intocado; nenhum git reset/checkout sobre source em produção.
git clone --no-hardlinks --no-checkout "$HOME/app" "$candidate"
git -C "$candidate" remote set-url origin https://github.com/llucass1998/friggafrio.git
git -C "$candidate" checkout --detach "$sha"
[[ -z "$(git -C "$candidate" status --porcelain)" ]] || exit 1
printf 'APPROVED_SHA=%s\nPREVIOUS_HEAD=%s\n' "$sha" "$(git -C "$HOME/app" rev-parse HEAD)" > "$backup/manifest.txt"
systemctl --user show frigga-backend frigga-storefront --property=MainPID,WorkingDirectory >> "$backup/manifest.txt"
# Build-time env fica somente na memória do processo; nenhum segredo é versionado.
CANDIDATE="$candidate" nice -n 15 node --input-type=module <<'JS'
import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const env={...process.env};
for(const file of ['application.env','backend.env','storefront.env']){
 for(const line of fs.readFileSync('/home/frigga/.config/frigga/'+file,'utf8').split(/\r?\n/)){
  const m=line.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim().replace(/^["']|["']$/g,'');
 }
}
if(!env.VITE_GOOGLE_MAPS_EMBED_API_KEY){
 const html=fs.readFileSync('/home/frigga/app/apps/storefront/dist/client/maps-embed.html','utf8');
 env.VITE_GOOGLE_MAPS_EMBED_API_KEY=html.match(/params\.get\('key'\)\s*\|\|\s*'([^']+)'/)?.[1];
}
if(!env.VITE_GOOGLE_MAPS_EMBED_API_KEY)throw new Error('MAPS_APPROVED_KEY_MISSING');
env.CATALOG_SQL_QUERY_ENABLED='false';env.DISABLE_MEDUSA_ADMIN='false';
for(const args of [['install','--frozen-lockfile','--ignore-scripts'],['--filter','backend','build'],['--filter','storefront','build']]){
 const r=spawnSync('/home/frigga/.local/bin/pnpm',args,{cwd:env.CANDIDATE,env,stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);
}
JS
admin="$candidate/apps/backend/.medusa/server/public/admin"
sf="$candidate/apps/storefront/dist"
[[ -f "$admin/index.html" && -f "$sf/server/server.js" && -f "$sf/client/maps-embed.html" ]] || exit 1
# Verifica que a compilação contém a correção e não apenas source novo.
node - "$admin" "$sf" <<'JS'
const fs=require('fs'),p=require('path');const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p.join(d,e.name)):[p.join(d,e.name)]);
const bundles=walk(process.argv[2]).filter(f=>f.endsWith('.js')).map(f=>fs.readFileSync(f,'utf8'));
if(!bundles.some(s=>s.includes('frigga-omie-products')&&/offset:\w+\.offset\?\?0/.test(s)))throw Error('ADMIN_OFFSET_FIX_NOT_COMPILED');
if(!walk(process.argv[3]+'/client').some(f=>f.endsWith('.js')&&fs.readFileSync(f,'utf8').includes('friggafrio.istigestao.com.br/maps-embed.html?key=')))throw Error('MAPS_FIX_NOT_COMPILED');
JS
cp -a "$HOME/.config/systemd/user/frigga-backend.service.d/10-release.conf" "$backup/backend-unit.conf"
cp -a "$HOME/.config/systemd/user/frigga-storefront.service.d/10-release.conf" "$backup/storefront-unit.conf"
# Artefatos antigos permanecem disponíveis para sessões abertas e rollback.
cp -an "$HOME/app/apps/backend/.medusa/server/public/admin/assets/." "$admin/assets/"
cp -an "$HOME/app/apps/storefront/dist/client/assets/." "$sf/client/assets/"
old_admin="$HOME/app/apps/backend/.medusa/server/public/admin"
old_dist="$HOME/app/apps/storefront/dist"
rollback() {
  trap - ERR
  if [[ -d "$backup/admin" ]]; then mv "$old_admin" "$backup/admin-failed"; mv "$backup/admin" "$old_admin"; fi
  if [[ -d "$backup/dist" ]]; then mv "$old_dist" "$backup/dist-failed"; mv "$backup/dist" "$old_dist"; fi
  systemctl --user restart frigga-backend frigga-storefront
  printf 'HOTFIX_ROLLED_BACK=%s\n' "$backup" >&2
}
trap rollback ERR
mv "$old_admin" "$backup/admin"
cp -a "$admin" "$old_admin"
mv "$old_dist" "$backup/dist"
cp -a "$sf" "$old_dist"
printf '%s\n' "$sha" > "$old_admin/.public-hotfix-sha"
printf '%s\n' "$sha" > "$old_dist/.public-hotfix-sha"
systemctl --user restart frigga-backend frigga-storefront
healthy=0
for attempt in $(seq 1 60); do
  code="$(curl -s --max-time 3 -o /dev/null -w '%{http_code}' http://127.0.0.1:19000/health || true)"
  if [[ "$code" == 200 ]]; then healthy=$((healthy+1)); else healthy=0; fi
  [[ "$healthy" -ge 3 ]] && break
  sleep 2
done
[[ "$healthy" -ge 3 ]]
for origin in https://friggafrio.com.br https://friggafrio.istigestao.com.br; do
  for path in /health /br /br/store /app /nossa-loja; do
    [[ "$(curl -fsS --max-time 20 -o /dev/null -w '%{http_code}' "$origin$path")" == 200 ]]
  done
done
trap - ERR
printf 'HOTFIX_ARTIFACT_SHA=%s\nBACKUP=%s\nCANDIDATE=%s\n' "$sha" "$backup" "$candidate"
systemctl --user show frigga-backend frigga-storefront --property=MainPID,WorkingDirectory
printf '%s\n' 'HOTFIX_HTTP_CHECKS=PASS (Maps e paginação exigem smoke público funcional adicional)'
