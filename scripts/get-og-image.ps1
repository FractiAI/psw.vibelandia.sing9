param([string]$Url)
try {
  $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 15
  if ($r.Content -match 'property="og:image"[^>]+content="([^"]+)"') { $matches[1] }
  elseif ($r.Content -match 'content="([^"]+)"[^>]+property="og:image"') { $matches[1] }
  else { "no og:image" }
} catch { "error: $_" }
