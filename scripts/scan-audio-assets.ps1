# Scan assets/audio for .mp3, .wav, .m4a, .ogg and update data/audio-assets.json.
# Run from repo root. Add files to assets/audio/ (or subfolders like assets/audio/playlist-1/), then run this script.

$ErrorActionPreference = "Stop"
$repoRoot = $PSScriptRoot + "\.."
$audioDir = Join-Path $repoRoot "assets\audio"
$dataFile = Join-Path $repoRoot "data\audio-assets.json"

if (-not (Test-Path $audioDir)) {
    Write-Host "Creating $audioDir"
    New-Item -ItemType Directory -Path $audioDir -Force | Out-Null
}

$extensions = @("*.mp3", "*.wav", "*.m4a", "*.ogg")
$existing = @{}
if (Test-Path $dataFile) {
    $data = Get-Content $dataFile -Raw | ConvertFrom-Json
    foreach ($t in $data.tracks) {
        $existing[$t.file] = $t
    }
} else {
    $data = @{ purpose = $null; tracks = @() } | ConvertTo-Json -Depth 3 | ConvertFrom-Json
    $data.purpose = "Local audio files for soundtracks. Mix and match in Episode 1, full movie, and anywhere else."
}

$tracks = @()
foreach ($ext in $extensions) {
    Get-ChildItem -Path $audioDir -Recurse -Filter $ext -File | ForEach-Object {
        $rel = $_.FullName.Substring($repoRoot.Length).TrimStart("\", "/").Replace("\", "/")
        $id = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
        $id = $id -replace '[^a-zA-Z0-9_-]', '-'
        if ($existing[$rel]) {
            $tracks += $existing[$rel]
        } else {
            $folder = $_.DirectoryName
            $parentName = [System.IO.Path]::GetFileName($folder)
            $sourcePlaylist = if ($parentName -match '^playlist-\d+$') { $parentName } else { "" }
            $tracks += @{
                id              = $id
                file            = $rel
                title           = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
                duration_sec    = $null
                source_playlist = $sourcePlaylist
                placement      = ""
                notes          = ""
            }
        }
    }
}

# Dedupe by file (keep first)
$byFile = @{}
foreach ($t in $tracks) {
    $f = if ($t.file) { $t.file } else { $t.File }
    if ($null -eq $f) { continue }
    if (-not $byFile[$f]) { $byFile[$f] = $t }
}
$tracks = @($byFile.Values)

$out = @{
    purpose = $data.purpose
    tracks  = @($tracks)
}
$json = $out | ConvertTo-Json -Depth 5
Set-Content -Path $dataFile -Value $json -Encoding UTF8
Write-Host "Updated $dataFile with $($tracks.Count) track(s)."
