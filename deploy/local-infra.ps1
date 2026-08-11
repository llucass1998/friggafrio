param(
  [ValidateSet("config", "up", "start", "stop", "status", "verify-reset-targets", "reset")]
  [string]$Action = "status",
  [switch]$ConfirmReset
)

$ErrorActionPreference = "Stop"

$composeFile = Join-Path $PSScriptRoot "docker-compose.local.yml"
$projectName = "frigga-maestro-local"
$disposableContainers = @(
  "frigga-maestro-postgres",
  "frigga-maestro-redis"
)
$disposableVolumes = @(
  "frigga-maestro-local-postgres-data",
  "frigga-maestro-local-redis-data"
)

function Invoke-Compose {
  param([string[]]$Arguments)

  & docker compose --project-name $projectName --file $composeFile @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "docker compose failed with exit code $LASTEXITCODE"
  }
}

function Assert-DisposableResource {
  param(
    [ValidateSet("container", "volume")]
    [string]$ResourceType,
    [string]$ResourceName
  )

  & docker $ResourceType inspect $ResourceName *> $null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Skipping absent ${ResourceType}: $ResourceName"
    return
  }

  $inspection = & docker $ResourceType inspect $ResourceName | ConvertFrom-Json
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to inspect ${ResourceType} $ResourceName."
  }

  if ($ResourceType -eq "container") {
    $scopeLabel = $inspection.Config.Labels.'com.friggafrio.scope'
    $stackLabel = $inspection.Config.Labels.'com.friggafrio.stack'
  } else {
    $scopeLabel = $inspection.Labels.'com.friggafrio.scope'
    $stackLabel = $inspection.Labels.'com.friggafrio.stack'
  }

  if ($scopeLabel -ne "local-disposable" -or $stackLabel -ne $projectName) {
    throw "Refusing to operate on ${ResourceType} $ResourceName because its local-disposable labels do not match."
  }

  Write-Host "Verified ${ResourceType}: $ResourceName"
}

function Assert-DisposableTargets {
  foreach ($containerName in $disposableContainers) {
    Assert-DisposableResource -ResourceType "container" -ResourceName $containerName
  }

  foreach ($volumeName in $disposableVolumes) {
    Assert-DisposableResource -ResourceType "volume" -ResourceName $volumeName
  }
}

function Remove-VerifiedDisposableVolumes {
  foreach ($volumeName in $disposableVolumes) {
    & docker volume inspect $volumeName *> $null
    if ($LASTEXITCODE -ne 0) {
      Write-Host "Skipping absent volume: $volumeName"
      continue
    }

    Assert-DisposableResource -ResourceType "volume" -ResourceName $volumeName

    & docker volume rm $volumeName
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to remove verified volume $volumeName"
    }
  }
}

switch ($Action) {
  "config" {
    Invoke-Compose @("config")
  }
  "up" {
    Invoke-Compose @("up", "--detach", "--wait")
  }
  "start" {
    Invoke-Compose @("start")
  }
  "stop" {
    Invoke-Compose @("stop")
  }
  "status" {
    Invoke-Compose @("ps", "--all")
  }
  "verify-reset-targets" {
    Assert-DisposableTargets
  }
  "reset" {
    if (-not $ConfirmReset) {
      throw "Reset is destructive. Re-run with -ConfirmReset after verifying the exact local targets."
    }

    Assert-DisposableTargets
    Invoke-Compose @("down", "--remove-orphans")
    Remove-VerifiedDisposableVolumes
  }
}
