# Download Valeria images from Google Doc pub (embedded) and save as valeria-001.jpg, ...
$ErrorActionPreference = 'Stop'
$docUrl = 'https://docs.google.com/document/d/e/2PACX-1vRrKpVr6ardyNdNqzr-pt-3wnTZH5UCKQ-r1MG4gHgLiqduC8czhunLwcjaabFRdpvdzm3xHhBe1dri/pub?embedded=true'
$outDir = Join-Path $PSScriptRoot 'interfaces\assets\valeria'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$html = Invoke-WebRequest -Uri $docUrl -UseBasicParsing -UserAgent 'Mozilla/5.0' | Select-Object -ExpandProperty Content
$pattern = 'https://docs\.google\.com/docs-images-rt/[^"]+'
$urls = [regex]::Matches($html, $pattern) | ForEach-Object { $_.Value } | Select-Object -Unique
$i = 1
foreach ($url in $urls) {
  $num = $i.ToString('000')
  $path = Join-Path $outDir "valeria-$num.jpg"
  try {
    Invoke-WebRequest -Uri $url -UseBasicParsing -OutFile $path -UserAgent 'Mozilla/5.0'
    Write-Host "Saved $path"
  } catch {
    Write-Warning "Failed $num : $_"
  }
  $i++
}
Write-Host "Done. $($i - 1) images."
