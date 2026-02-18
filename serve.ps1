# Minimal HTTP server for storyboard capture (camera needs localhost). Run from repo root.
# Terminates any process already using the port before starting.
$root = $PSScriptRoot
if (-not $root) { $root = Get-Location }
$port = 8080

# Stop any prior instance on this port
$pidsOnPort = @()
try {
  $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction Stop
  $pidsOnPort = $conn | Select-Object -ExpandProperty OwningProcess -Unique
} catch {
  $line = netstat -ano | Select-String ":\s*$port\s"
  foreach ($l in $line) {
    if ($l -match '\s+(\d+)\s*$') { $pidsOnPort += [int]$Matches[1] }
  }
}
foreach ($p in $pidsOnPort) {
  # Skip current process, system (4), and other low PIDs we must not kill
  if (-not $p -or $p -eq $PID -or $p -lt 100) { continue }
  try {
    $proc = Get-Process -Id $p -ErrorAction Stop
    # Only stop PowerShell or dotnet that are likely our server
    if ($proc.ProcessName -match 'powershell|pwsh|dotnet') {
      Write-Host "Stopping prior instance (PID $p) on port $port..."
      Stop-Process -Id $p -Force -ErrorAction Stop
      Start-Sleep -Seconds 2
    }
  } catch {}
}

# Bind to port (try 8080, then 8081, 8082 if in use)
$bound = $false
foreach ($tryPort in ($port, 8081, 8082)) {
  $prefix = "http://localhost:$tryPort/"
  $listener = New-Object System.Net.HttpListener
  $listener.Prefixes.Add($prefix)
  try {
    $listener.Start()
    $port = $tryPort
    $bound = $true
    break
  } catch {
    $listener = $null
  }
}
if (-not $bound) {
  Write-Error "Could not bind to port 8080, 8081, or 8082. Close the app using the port and try again."
  exit 1
}
Write-Host "Serving at http://localhost:$port/"
Write-Host "Open: http://localhost:${port}/interfaces/storyboard-start.html"
Write-Host "Press Ctrl+C to stop."
$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.htm'  = 'text/html; charset=utf-8'
  '.css'  = 'text/css'
  '.js'   = 'application/javascript'
  '.json' = 'application/json'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.gif'  = 'image/gif'
  '.ico'  = 'image/x-icon'
  '.svg'  = 'image/svg+xml'
}
try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $path = $ctx.Request.Url.LocalPath.TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
    $path = [IO.Path]::Combine($root, $path)
    if ([string]::IsNullOrEmpty($ctx.Request.Url.LocalPath) -or $ctx.Request.Url.LocalPath -eq '/') {
      $path = [IO.Path]::Combine($root, 'interfaces', 'storyboard-start.html')
    }
    if (-not [IO.Path]::GetFullPath($path).StartsWith([IO.Path]::GetFullPath($root), [StringComparison]::OrdinalIgnoreCase)) {
      $ctx.Response.StatusCode = 403
      $ctx.Response.Close()
      continue
    }
    if (-not [IO.File]::Exists($path)) {
      $ctx.Response.StatusCode = 404
      $ctx.Response.Close()
      continue
    }
    $ext = [IO.Path]::GetExtension($path)
    $ctx.Response.ContentType = if ($mime[$ext]) { $mime[$ext] } else { 'application/octet-stream' }
    $bytes = [IO.File]::ReadAllBytes($path)
    $ctx.Response.ContentLength64 = $bytes.Length
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $ctx.Response.Close()
  }
} finally {
  if ($listener) { try { $listener.Stop() } catch {} }
}
