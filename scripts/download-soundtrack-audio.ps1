# Download audio FROM YOUTUBE playlists in data/soundtrack-playlists.json into assets/audio/.
# Requires: yt-dlp (e.g. winget install yt-dlp).

$ErrorActionPreference = "Stop"
$repoRoot = $PSScriptRoot + "\.."
$audioDir = Join-Path $repoRoot "assets\audio"
$playlistsFile = Join-Path $repoRoot "data\soundtrack-playlists.json"

if (-not (Test-Path $playlistsFile)) {
    Write-Error "Missing $playlistsFile"
    exit 1
}

# Find yt-dlp (PATH may not include winget install until shell restart)
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
$ytdlpExe = $null
$ytdlp = Get-Command yt-dlp -ErrorAction SilentlyContinue
if ($ytdlp) { $ytdlpExe = $ytdlp.Source }
if (-not $ytdlpExe) {
    $searchPaths = @(
        (Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages"),
        (Join-Path $env:LOCALAPPDATA "Programs\yt-dlp"),
        (Join-Path $env:ProgramFiles "WindowsApps"),
        "C:\Program Files\yt-dlp",
        (Join-Path $env:ProgramFiles "yt-dlp")
    )
    foreach ($dir in $searchPaths) {
        if (Test-Path $dir) {
            $found = Get-ChildItem -Path $dir -Recurse -Filter "yt-dlp.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($found) { $ytdlpExe = $found.FullName; break }
        }
    }
}
if (-not $ytdlpExe) {
    Write-Host "yt-dlp not found. Install with: winget install yt-dlp"
    Write-Host "Then close and reopen your terminal (PATH update) and run this script again."
    exit 1
}

$playlists = Get-Content $playlistsFile -Raw | ConvertFrom-Json
$index = 1
foreach ($p in $playlists.playlists) {
    $folderName = "playlist-$index"
    $outDir = Join-Path $audioDir $folderName
    if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }
    $outTemplate = Join-Path $outDir "%(playlist_index)s - %(title)s.%(ext)s"
    Write-Host "Downloading playlist $index to $outDir ..."
    & $ytdlpExe -x --audio-format mp3 --no-overwrites -o $outTemplate $p.url 2>&1
    $index++
}

Write-Host "Done. Run scripts\scan-audio-assets.ps1 to register tracks in data/audio-assets.json."
