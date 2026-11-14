# Requires PostgreSQL client tools and an owner-provided database connection string.
$ErrorActionPreference = 'Stop'
if (-not $env:INTERNMATCH_DATABASE_URL) { throw 'Set INTERNMATCH_DATABASE_URL privately. Never commit it.' }
Get-Command pg_dump -ErrorAction Stop | Out-Null
$backupDirectory = Join-Path $PSScriptRoot '..\backups'
New-Item -ItemType Directory -Force -Path $backupDirectory | Out-Null
$backupFile = Join-Path $backupDirectory ('internmatch-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.dump')
& pg_dump --dbname=$env:INTERNMATCH_DATABASE_URL --format=custom --no-owner --file=$backupFile
if ($LASTEXITCODE -ne 0) { throw 'Backup failed; do not treat the output as a verified backup.' }
Write-Output "Backup written to $backupFile. Verify restoration in an isolated environment."
