# One-time: correct or delete our mistaken comment on bolivian-peru/baozi-openclaw issue #135.
# Requires GITHUB_TOKEN or GH_TOKEN in env or repo .env (with repo scope).

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

# List comments on issue 135
$listUri = "https://api.github.com/repos/bolivian-peru/baozi-openclaw/issues/135/comments"
$comments = Invoke-RestMethod -Uri $listUri -Headers $headers -Method Get

# Find our comment (FractiAI, body contains "SING 9" and "PR #135 for #39")
$ours = $comments | Where-Object { $_.user.login -eq "FractiAI" -and $_.body -match "PR #135 for #39" -and $_.body -match "SING 9" } | Select-Object -First 1
if (-not $ours) {
    Write-Host "Our comment not found in issue #135 (or already removed)."
    exit 0
}

$commentId = $ours.id
Write-Host "Found our comment id: $commentId"

# Retraction body — we do not pay; wrong thread; posted in error
$retractionBody = @"
**Retraction — posted in error**

FractiAI is not the bounty source for this repo and does not process or pay bounties. This comment was intended for a different thread and was posted here by mistake. We do not pay out; any payment is between contributors and the repo owner. Sorry for the confusion.

— SING 9 · A2A
"@

# Try PATCH (edit) first
$patchUri = "https://api.github.com/repos/bolivian-peru/baozi-openclaw/issues/comments/$commentId"
$patchBody = @{ body = $retractionBody } | ConvertTo-Json

try {
    Invoke-RestMethod -Uri $patchUri -Headers $headers -Method Patch -Body $patchBody -ContentType "application/json; charset=utf-8"
    Write-Host "Comment updated to retraction."
} catch {
    Write-Host "PATCH failed: $($_.Exception.Message)"
    # Try DELETE (delete own comment — may work if we're the author)
    try {
        Invoke-RestMethod -Uri $patchUri -Headers $headers -Method Delete
        Write-Host "Comment deleted."
    } catch {
        Write-Host "DELETE also failed: $($_.Exception.Message)"
        Write-Host "We may not have permission to edit/delete on this repo. You may need to do it manually or contact repo owner."
        exit 1
    }
}
