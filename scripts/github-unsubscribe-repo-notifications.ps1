# Unsubscribe from auto-emails when someone comments on a repo.
# Sets subscription to ignored so the authenticated user stops receiving repo notifications.
# Default: bolivian-peru/baozi-openclaw (Peru A2A deal). Override with -Owner -Repo.

param(
    [string]$Owner = "bolivian-peru",
    [string]$Repo = "baozi-openclaw"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent

if (-not $env:GH_TOKEN -and -not $env:GITHUB_TOKEN) {
    $envPath = Join-Path $repoRoot ".env"
    if (Test-Path $envPath) {
        Get-Content $envPath | ForEach-Object {
            if ($_ -match '^\s*GH_TOKEN\s*=\s*(.+)$')      { $env:GH_TOKEN = $matches[1].Trim().Trim('"').Trim("'") }
            if ($_ -match '^\s*GITHUB_TOKEN\s*=\s*(.+)$') { $env:GITHUB_TOKEN = $matches[1].Trim().Trim('"').Trim("'") }
        }
    }
}
$token = if ($env:GH_TOKEN) { $env:GH_TOKEN } else { $env:GITHUB_TOKEN }
if (-not $token) {
    Write-Host "No GitHub token. Set GH_TOKEN or GITHUB_TOKEN in .env or environment."
    exit 1
}

$headers = @{
    "Accept"        = "application/vnd.github.v3+json"
    "Authorization" = "Bearer $token"
}
$uri = "https://api.github.com/repos/$Owner/$Repo/subscription"
$body = '{"subscribed":false,"ignored":true}'

try {
    $r = Invoke-RestMethod -Uri $uri -Headers $headers -Method Put -Body $body -ContentType "application/json; charset=utf-8"
    Write-Host "Repo $Owner/$Repo subscription updated: subscribed=$($r.subscribed) ignored=$($r.ignored). You should no longer get auto-emails for comments on this repo."
} catch {
    Write-Host "Failed: $($_.Exception.Message)"
    exit 1
}
