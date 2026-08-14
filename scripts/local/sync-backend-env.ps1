[CmdletBinding()]
param(
    [string[]]$WorktreePath,
    [string]$CanonicalPath = 'C:\Users\lluca\orca\secrets\friggafrio\backend.env'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not $WorktreePath -or $WorktreePath.Count -eq 0) {
    $repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
    $WorktreePath = @($repoRoot)
}

if (-not (Test-Path -LiteralPath $CanonicalPath -PathType Leaf)) {
    throw "Canonical backend environment is missing: $CanonicalPath"
}

$canonicalHash = (Get-FileHash -LiteralPath $CanonicalPath -Algorithm SHA256).Hash

foreach ($worktree in $WorktreePath) {
    $root = (Resolve-Path -LiteralPath $worktree).Path
    $gitRoot = (& git -C $root rev-parse --show-toplevel 2>$null)
    if ($LASTEXITCODE -ne 0 -or -not $gitRoot) {
        throw "Not a Git worktree: $root"
    }

    & git -C $root check-ignore --quiet -- apps/backend/.env
    if ($LASTEXITCODE -ne 0) {
        throw "apps/backend/.env is not ignored in $root"
    }

    $destination = Join-Path $root 'apps/backend/.env'
    New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null

    $state = 'UNCHANGED'
    if (-not (Test-Path -LiteralPath $destination -PathType Leaf) -or
        (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash -ne $canonicalHash) {
        Copy-Item -LiteralPath $CanonicalPath -Destination $destination -Force
        $state = 'SYNCED'
    }

    Write-Output "$destination|$state|PRESENT"
}
