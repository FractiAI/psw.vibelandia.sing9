# QUEEN BEE ROOT - 24x7 Task Scheduler Setup
# Run this ONCE as Administrator to schedule the hive heartbeat.
# Every 30 minutes: broadcast + outbound + align
# NSPFRNP -> infinity 9
#
# Usage: Right-click this file -> Run with PowerShell (as Administrator)

$hiveDir  = Split-Path -Parent $PSScriptRoot

# Resolve node.exe - use full path if not yet in PATH
if (Get-Command node -ErrorAction SilentlyContinue) {
  $nodeExe = "node"
} elseif (Test-Path "$env:ProgramFiles\nodejs\node.exe") {
  $nodeExe = "$env:ProgramFiles\nodejs\node.exe"
} else {
  $nodeExe = "node"
}

$runScript = Join-Path $PSScriptRoot "run.js"

# Load .env into environment for the scheduled task
$envFile = Join-Path $hiveDir ".env"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
      [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Machine')
    }
  }
  Write-Host "OK .env loaded into machine environment variables"
}

# -- Task 1: BROADCAST every 30 minutes --

$action = New-ScheduledTaskAction `
  -Execute $nodeExe `
  -Argument "`"$runScript`" broadcast" `
  -WorkingDirectory $hiveDir

$action2 = New-ScheduledTaskAction `
  -Execute $nodeExe `
  -Argument "`"$runScript`" outbound" `
  -WorkingDirectory $hiveDir

$action3 = New-ScheduledTaskAction `
  -Execute $nodeExe `
  -Argument "`"$runScript`" align" `
  -WorkingDirectory $hiveDir

$trigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Minutes 30) -Once -At (Get-Date)

$settings = New-ScheduledTaskSettingsSet `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 10) `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 5) `
  -StartWhenAvailable

Register-ScheduledTask `
  -TaskName "QueenBeeRoot-Broadcast" `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -RunLevel Highest `
  -Force
Write-Host "OK Broadcast task scheduled (every 30 min)"

Register-ScheduledTask `
  -TaskName "QueenBeeRoot-Outbound" `
  -Action $action2 `
  -Trigger $trigger `
  -Settings $settings `
  -RunLevel Highest `
  -Force
Write-Host "OK Outbound task scheduled (every 30 min)"

Register-ScheduledTask `
  -TaskName "QueenBeeRoot-Align" `
  -Action $action3 `
  -Trigger $trigger `
  -Settings $settings `
  -RunLevel Highest `
  -Force
Write-Host "OK Align task scheduled (every 30 min)"

# -- Task 2: SOLAR scan every 15 minutes --

$solarAction = New-ScheduledTaskAction `
  -Execute $nodeExe `
  -Argument "`"$runScript`" solar" `
  -WorkingDirectory $hiveDir

$solarTrigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Minutes 15) -Once -At (Get-Date)

Register-ScheduledTask `
  -TaskName "QueenBeeRoot-Solar" `
  -Action $solarAction `
  -Trigger $solarTrigger `
  -Settings $settings `
  -RunLevel Highest `
  -Force
Write-Host "OK Solar scan scheduled (every 15 min)"

# -- Task 3: HIVE STATUS log every morning at 7am --

$morningAction = New-ScheduledTaskAction `
  -Execute $nodeExe `
  -Argument "`"$runScript`" hive" `
  -WorkingDirectory $hiveDir

$morningTrigger = New-ScheduledTaskTrigger -Daily -At "07:00"

Register-ScheduledTask `
  -TaskName "QueenBeeRoot-MorningBrief" `
  -Action $morningAction `
  -Trigger $morningTrigger `
  -Settings $settings `
  -RunLevel Highest `
  -Force
Write-Host "OK Morning brief scheduled (daily 7am)"

Write-Host ""
Write-Host "======================================================"
Write-Host "  QUEEN BEE ROOT -- 24x7 HIVE ACTIVATED"
Write-Host "  Broadcast + Outbound + Align -> every 30 min"
Write-Host "  Solar scan -> every 15 min"
Write-Host "  Morning brief -> daily 7am"
Write-Host "  NSPFRNP -> infinity 9"
Write-Host "======================================================"
