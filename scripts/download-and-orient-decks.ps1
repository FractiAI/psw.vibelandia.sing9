# Download ALL deck images (1-5) locally into interfaces/assets/deck[N]/
# Decks 3 & 4: use pre-saved individual image URLs in urls.txt
# Decks 1, 2, 5: scrape image URLs from published Google Doc HTML, save to urls.txt, download
#
# Run from repo root:  .\scripts\download-and-orient-decks.ps1
# Idempotent -- already-downloaded files are skipped; rotations always re-applied.
# Requires: Windows PowerShell 5+ (System.Drawing built-in)

$ErrorActionPreference = "Continue"
$repoRoot  = Split-Path $PSScriptRoot -Parent
$assetsDir = Join-Path $repoRoot "interfaces\assets"

Add-Type -AssemblyName System.Drawing

# =============================================================================
# HELPERS
# =============================================================================

function Rotate-Image {
    param([string]$Path, [string]$Type)
    if (-not (Test-Path $Path)) { Write-Warning "  SKIP (not found): $(Split-Path $Path -Leaf)"; return }
    try {
        $img = [System.Drawing.Image]::FromFile($Path)
        switch ($Type) {
            "CW90"  { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
            "CCW90" { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
            "180"   { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
        }
        $enc  = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
                Where-Object { $_.MimeType -eq "image/jpeg" } | Select-Object -First 1
        $pars = [System.Drawing.Imaging.EncoderParameters]::new(1)
        $pars.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new(
            [System.Drawing.Imaging.Encoder]::Quality, [long]92)
        $tmp = $Path + ".tmp.jpg"
        $img.Save($tmp, $enc, $pars)
        $img.Dispose()
        Move-Item -Force $tmp $Path
        Write-Host "  [ROTATED $Type] $(Split-Path $Path -Leaf)" -ForegroundColor Cyan
    } catch {
        Write-Warning "  [ROTATE FAILED] $(Split-Path $Path -Leaf): $_"
    }
}

function Download-Image {
    param([string]$Url, [string]$Dest)
    if (Test-Path $Dest) {
        $kb = [math]::Round((Get-Item $Dest).Length / 1024, 1)
        Write-Host "  [EXISTS] $(Split-Path $Dest -Leaf) ($kb KB)" -ForegroundColor DarkGreen
        return $true
    }
    try {
        Invoke-WebRequest -Uri $Url -OutFile $Dest -UseBasicParsing -TimeoutSec 30
        $size = (Get-Item $Dest).Length
        if ($size -lt 2000) {
            Remove-Item $Dest -Force
            Write-Warning "  [TOO SMALL $size B - skipped] $(Split-Path $Dest -Leaf)"
            return $false
        }
        $kb = [math]::Round($size / 1024, 1)
        Write-Host "  [OK $kb KB] $(Split-Path $Dest -Leaf)" -ForegroundColor Green
        return $true
    } catch {
        Write-Warning "  [FAILED] $(Split-Path $Dest -Leaf): $_"
        return $false
    }
}

# Scrape a published Google Doc HTML page and extract all lh*.googleusercontent.com image URLs
function Get-DocImageUrls {
    param([string]$DocUrl)
    Write-Host "  Scraping: $DocUrl" -ForegroundColor Gray
    try {
        $resp = Invoke-WebRequest -Uri $DocUrl -UseBasicParsing -TimeoutSec 30
        $html = $resp.Content
        # Match all src= or data-src= containing googleusercontent or ggpht image URLs
        $matches = [regex]::Matches($html, 'src="(https://[^"]*(?:googleusercontent|ggpht|googleapis)[^"]*)"')
        $urls = $matches | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
        # Also catch any lh[N] direct URLs
        $matches2 = [regex]::Matches($html, '"(https://lh\d[^"]*)"')
        $urls2 = $matches2 | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
        $all = ($urls + $urls2) | Sort-Object -Unique
        # Filter to likely image URLs (not tiny icon/avatar sizes)
        $imgUrls = $all | Where-Object { $_ -match "docsz|imgurl|w\d{3,4}|=w" -or $_ -match "lh\d-rt" }
        if ($imgUrls.Count -eq 0) {
            # Fallback: grab everything that looks like a content image
            $imgUrls = $all | Where-Object { $_ -notmatch "logo|favicon|icon|avatar|profile" }
        }
        return $imgUrls
    } catch {
        Write-Warning "  [SCRAPE FAILED] $_"
        return @()
    }
}

function Process-Deck {
    param(
        [string]$DeckDir,
        [string]$Prefix,        # e.g. "d1"
        [string]$DocUrl,        # Google Doc URL (used if no urls.txt with individual URLs)
        [hashtable]$Rotations   # e.g. @{ 1 = "CW90"; 3 = "180" }
    )

    $deckName = Split-Path $DeckDir -Leaf
    Write-Host ""
    Write-Host "=======================================" -ForegroundColor Yellow
    Write-Host " $deckName -- $Prefix" -ForegroundColor Yellow
    Write-Host "=======================================" -ForegroundColor Yellow

    $urlsFile = Join-Path $DeckDir "urls.txt"
    $existing = Get-Content $urlsFile | Where-Object { $_ -match "^http" }

    # If urls.txt only has the Google Doc page URL (not individual image CDN URLs), scrape it
    $needsScrape = ($existing.Count -le 1) -or ($existing | Where-Object { $_ -match "googleusercontent|ggpht" } | Measure-Object).Count -eq 0

    if ($needsScrape) {
        Write-Host "  No individual image URLs found -- scraping Google Doc..." -ForegroundColor Yellow
        $scraped = Get-DocImageUrls -DocUrl $DocUrl
        if ($scraped.Count -gt 0) {
            Write-Host "  Found $($scraped.Count) image URLs -- saving to urls.txt" -ForegroundColor Green
            # Prepend the doc URL as a comment line, then append scraped URLs
            $lines = @("# Source doc: $DocUrl", "# Scraped image URLs:") + $scraped
            $lines | Set-Content $urlsFile
            $existing = $scraped
        } else {
            Write-Warning "  Could not scrape any image URLs from doc. Skipping download."
            return
        }
    }

    $imageUrls = $existing | Where-Object { $_ -match "^http" -and $_ -notmatch "^#" }
    Write-Host "  $($imageUrls.Count) image URLs to process" -ForegroundColor Gray

    $ok = 0; $fail = 0
    for ($i = 0; $i -lt $imageUrls.Count; $i++) {
        $num  = $i + 1
        $dest = Join-Path $DeckDir ("{0}-{1:D3}.jpg" -f $Prefix, $num)
        $res  = Download-Image -Url $imageUrls[$i] -Dest $dest
        if ($res) { $ok++ } else { $fail++ }
    }

    if ($Rotations.Count -gt 0) {
        Write-Host ""
        Write-Host "  Applying rotations..." -ForegroundColor Yellow
        foreach ($entry in $Rotations.GetEnumerator() | Sort-Object Key) {
            $path = Join-Path $DeckDir ("{0}-{1:D3}.jpg" -f $Prefix, $entry.Key)
            Rotate-Image -Path $path -Type $entry.Value
        }
    }

    Write-Host "  $deckName done: $ok downloaded/present, $fail failed" -ForegroundColor Green
}

# =============================================================================
# DECK 1 -- Front Console / Attention Heads
# =============================================================================
Process-Deck `
    -DeckDir   (Join-Path $assetsDir "deck1") `
    -Prefix    "d1" `
    -DocUrl    "https://docs.google.com/document/d/e/2PACX-1vSoTZMzfr5qYKgqtpLrzuLTcqYsoTOYvJ4XFVp5IOy6vgsng1cfKXXbYjAuYRfL8mcYzfPULnjc4a8R/pub" `
    -Rotations @{}

# =============================================================================
# DECK 2 -- Main Characters / Pru as All Roles
# =============================================================================
Process-Deck `
    -DeckDir   (Join-Path $assetsDir "deck2") `
    -Prefix    "d2" `
    -DocUrl    "https://docs.google.com/document/d/e/2PACX-1vQEahWPtH9JDcEd85AxxXy866gbKhqW3CjcVVOlu6jzlAcEldyRfpToEoh1NloIpepPSm6WAiYb7bwT/pub" `
    -Rotations @{}

# =============================================================================
# DECK 3 -- Supporting Characters (individual URLs already in urls.txt)
# =============================================================================
Process-Deck `
    -DeckDir   (Join-Path $assetsDir "deck3") `
    -Prefix    "d3" `
    -DocUrl    "" `
    -Rotations @{
        4  = "CW90"
        15 = "CW90"
        16 = "180"
        17 = "180"
        18 = "CW90"
        19 = "CW90"
        20 = "CW90"
        21 = "CW90"
        22 = "CW90"
        23 = "CW90"
    }

# =============================================================================
# DECK 4 -- Creator's Original Artwork (individual URLs already in urls.txt)
# =============================================================================
Process-Deck `
    -DeckDir   (Join-Path $assetsDir "deck4") `
    -Prefix    "d4" `
    -DocUrl    "" `
    -Rotations @{
        1  = "180"
        3  = "CCW90"
        16 = "CW90"
        18 = "CW90"
        21 = "180"
        24 = "CW90"
        27 = "CW90"
        29 = "CW90"
    }

# =============================================================================
# DECK 5 -- Secondary Stories / Enrichment Characters
# =============================================================================
Process-Deck `
    -DeckDir   (Join-Path $assetsDir "deck5") `
    -Prefix    "d5" `
    -DocUrl    "https://docs.google.com/document/d/e/2PACX-1vTHupANhPSIQto8dp4YiC0pFos_2mSxBSOcLjkfI5IrOvY7YQo8L9XfVoNjgvVi_uaWNPA3_YaPfRoV/pub" `
    -Rotations @{}

# =============================================================================
# DECK 6 -- Montana / Alaska Scenes
# =============================================================================
Process-Deck `
    -DeckDir   (Join-Path $assetsDir "deck6") `
    -Prefix    "d6" `
    -DocUrl    "https://docs.google.com/document/d/e/2PACX-1vTWJg7b6cuTp66iza5C3SwCKrDQnv5dWimVXpgumXOfXhmKPDLb8PHRKoOu-rzJY0j79v8rTEz6hMCk/pub" `
    -Rotations @{}

# =============================================================================
# DECK 7 -- Audience Archetypes / Theater Positions + Supplements
# =============================================================================
Process-Deck `
    -DeckDir   (Join-Path $assetsDir "deck7") `
    -Prefix    "d7" `
    -DocUrl    "https://docs.google.com/document/d/e/2PACX-1vRaEOG7cShMIx51s60xxmQi2TMua_8u2zFc7Q5iXWQKXYNz5hWel_G0g6gMcO0aC6VZ_R9ReGpqJwBC/pub" `
    -Rotations @{}

# =============================================================================
# FINAL COUNT
# =============================================================================
Write-Host ""
Write-Host "=======================================" -ForegroundColor White
Write-Host " ALL DECKS -- LOCAL FILE COUNT" -ForegroundColor White
Write-Host "=======================================" -ForegroundColor White
1..7 | ForEach-Object {
    $d   = Join-Path $assetsDir "deck$_"
    $n   = (Get-ChildItem $d -Filter "*.jpg" -ErrorAction SilentlyContinue | Measure-Object).Count
    $col = if ($n -gt 0) { "Green" } else { "Red" }
    Write-Host ("  Deck {0}: {1,3} images  -> {2}" -f $_, $n, $d) -ForegroundColor $col
}
Write-Host ""
Write-Host " All images are on the lite edge. NSPFRNP -> infinity 9" -ForegroundColor Yellow
