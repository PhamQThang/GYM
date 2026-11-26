# Start a separate, unlinked Supabase stack for auth development. Requires Docker.
param([switch]$SmokeTest, [ValidateRange(1024, 65535)][int]$Port = 3000)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$cli = Join-Path $repoRoot 'node_modules/.bin/supabase.cmd'
$devRoot = Join-Path ([System.IO.Path]::GetTempPath()) 'gym-p0-auth-dev-20261126'
$env:SUPABASE_PROJECT_ID = 'gym-p0-auth-dev-20261126'
function RunLocalCli([string[]]$Arguments) {
    & $cli @Arguments --workdir $devRoot
    if ($LASTEXITCODE -ne 0) { throw 'Supabase local command failed.' }
}
New-Item -ItemType Directory -Force -Path $devRoot | Out-Null
if (!(Test-Path (Join-Path $devRoot 'supabase/config.toml'))) {
    RunLocalCli @('init')
}
if (Test-Path (Join-Path $devRoot 'supabase/.temp/project-ref')) {
    throw 'Expected an unlinked local workspace.'
}
$configPath = Join-Path $devRoot 'supabase/config.toml'
$config = [IO.File]::ReadAllText($configPath)
$config = $config -replace '(?ms)(^\[auth\.email\][^\[]*?^enable_confirmations = )false', '${1}true'
$config = $config -replace '(?m)^site_url = .*$', "site_url = `"http://127.0.0.1:${Port}`""
$config = $config -replace '(?m)^additional_redirect_urls = .*$', "additional_redirect_urls = [`"http://127.0.0.1:${Port}/auth/callback`", `"http://127.0.0.1:${Port}/reset-password`"]"
[IO.File]::WriteAllText($configPath, $config)
$migrations = Join-Path $devRoot 'supabase/migrations'
New-Item -ItemType Directory -Force -Path $migrations | Out-Null
foreach ($file in Get-ChildItem -LiteralPath (Join-Path $repoRoot 'supabase') -Filter '*.sql' -File) {
    if ($file.Name -notmatch '^([0-9]{3})_(.+\.sql)$') { continue }
    $dest = Join-Path $migrations ('20261126000' + $Matches[1] + '_' + $Matches[2])
    if ((Test-Path $dest) -and ((Get-FileHash $dest).Hash -ne (Get-FileHash $file.FullName).Hash)) {
        throw "Existing local migration differs: $($file.Name)"
    }
    Copy-Item -LiteralPath $file.FullName -Destination $dest
}
RunLocalCli @('start', '-x', 'studio,analytics,vector,realtime,imgproxy,edge-runtime,supavisor')
RunLocalCli @('migration','up','--local')
# Scope Vite's environment to this process. Never inherit a hosted anon key.
$settings = & $cli status -o env --workdir $devRoot
if ($LASTEXITCODE -ne 0) { throw 'Cannot read local Supabase configuration.' }
$localValues = @{}
foreach ($line in $settings) {
    if ($line -match '^([A-Z_]+)="([^"]*)"$') { $localValues[$Matches[1]] = $Matches[2] }
}
if (!$localValues.API_URL -or !$localValues.ANON_KEY -or !([Uri]$localValues.API_URL).IsLoopback) {
    throw 'Expected a loopback Supabase API and a local anon key.'
}
$env:VITE_ENABLE_CLOUD_AUTH = 'true'
$env:VITE_SUPABASE_URL = $localValues.API_URL
$env:VITE_SUPABASE_ANON_KEY = $localValues.ANON_KEY
$env:VITE_SUPABASE_PUBLISHABLE_KEY = $localValues.ANON_KEY
Push-Location $repoRoot
try {
    if ($SmokeTest) {
        $env:GYM_LOCAL_URL = $localValues.API_URL
        $env:GYM_LOCAL_ANON_KEY = $localValues.ANON_KEY
        $env:GYM_LOCAL_SERVICE_KEY = $localValues.SERVICE_ROLE_KEY
        & node scripts/local-auth-smoke.mjs
    } else {
        & node node_modules/vite/bin/vite.js --host 127.0.0.1 --port $Port --strictPort
    }
    if ($LASTEXITCODE -ne 0) { throw 'Local auth command failed.' }
}
finally { Pop-Location }
