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

Step "Docker engine" {
  Run "docker" @("version")
}

Step "Supabase migration alignment" {
  Run "npx" @("supabase", "migration", "list")
}

Step "Supabase schema diff" {
  Run "npx" @("supabase", "db", "diff", "--linked")
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
