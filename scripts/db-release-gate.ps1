param(
  [string]$BackupDir = "supabase/backups"
)

$ErrorActionPreference = "Stop"

function Step($Name, [scriptblock]$Block) {
  Write-Host ""
  Write-Host "== $Name ==" -ForegroundColor Cyan
  & $Block
}

function Run($FilePath, [string[]]$Arguments) {
  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$FilePath $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
  }
}

function RunCapture($FilePath, [string[]]$Arguments) {
  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $output = & $FilePath @Arguments 2>&1
    $code = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousPreference
  }
  $output | ForEach-Object { Write-Host $_ }
  if ($code -ne 0) {
    throw "$FilePath $($Arguments -join ' ') failed with exit code $code."
  }
  return ($output -join "`n")
}

Step "Docker engine" {
  Run "docker" @("version")
}

Step "Supabase migration alignment" {
  Run "npx" @("supabase", "migration", "list")
}

Step "Supabase public schema diff" {
  $publicDiff = RunCapture "npx" @("supabase", "db", "diff", "--linked", "--schema", "public")
  if ($publicDiff -notmatch "No schema changes found") {
    throw "Passage-owned public schema drift detected. Review the diff and create a migration before deploy."
  }
}

Step "Managed integration schema drift classification" {
  $managedDiff = RunCapture "npx" @("supabase", "db", "diff", "--linked")
  if ($managedDiff -match '(?m)^\s*(create|alter|drop)\s+(table|view|function|trigger|policy|index|type)\s+"public"\.' -or $managedDiff -match '(?m)^\s*(create|alter|drop)\s+schema\s+"public"') {
    throw "Broad diff includes public schema changes. Run a public-schema migration review before deploy."
  }
  if ($managedDiff -match '"stripe"\.' -or $managedDiff -match 'create schema if not exists "stripe"') {
    Write-Host "Managed Stripe/Supabase schema drift detected and classified as informational. Do not copy this into Passage migrations." -ForegroundColor Yellow
  } elseif ($managedDiff -match "No schema changes found") {
    Write-Host "No managed integration schema drift detected." -ForegroundColor Green
  } else {
    Write-Host "Non-public managed schema drift detected. Review before touching non-public schemas." -ForegroundColor Yellow
  }
}

Step "Supabase production schema backup" {
  if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
  }
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $backupPath = Join-Path $BackupDir "prod-schema-$stamp.sql"
  Run "npx" @("supabase", "db", "dump", "--linked", "-f", $backupPath)
  $file = Get-Item $backupPath -ErrorAction Stop
  if ($file.Length -le 0) {
    Remove-Item -LiteralPath $backupPath -ErrorAction SilentlyContinue
    throw "Supabase backup was empty. Removed $backupPath."
  }
  Write-Host "Backup written: $backupPath ($($file.Length) bytes)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Database release gate passed." -ForegroundColor Green
