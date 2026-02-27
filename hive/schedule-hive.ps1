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

# -- Task 4: REVENUE cycle every 2 hours (all three streams: TECH + EXPERIENCE + THEATER) --

$revenueAction = New-ScheduledTaskAction `
  -Execute $nodeExe `
  -Argument "`"$runScript`" revenue" `
  -WorkingDirectory $hiveDir

$revenueTrigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Hours 2) -Once -At (Get-Date)

Register-ScheduledTask `
  -TaskName "QueenBeeRoot-Revenue" `
  -Action $revenueAction `
  -Trigger $revenueTrigger `
  -Settings $settings `
  -RunLevel Highest `
  -Force
Write-Host "OK Revenue cycle scheduled (every 2 hours -- TECH + EXPERIENCE + THEATER)"

# -- Task 5: PRIZE COMPETITION SCAN daily at 8am and 8pm --

$prizeAction = New-ScheduledTaskAction `
  -Execute $nodeExe `
  -Argument "`"$runScript`" prize" `
  -WorkingDirectory $hiveDir

$prizeTrigger1 = New-ScheduledTaskTrigger -Daily -At "08:00"
$prizeTrigger2 = New-ScheduledTaskTrigger -Daily -At "20:00"

Register-ScheduledTask `
  -TaskName "QueenBeeRoot-PrizeScan-AM" `
  -Action $prizeAction `
  -Trigger $prizeTrigger1 `
  -Settings $settings `
  -RunLevel Highest `
  -Force
Write-Host "OK Prize scan AM scheduled (daily 8am)"

Register-ScheduledTask `
  -TaskName "QueenBeeRoot-PrizeScan-PM" `
  -Action $prizeAction `
  -Trigger $prizeTrigger2 `
  -Settings $settings `
  -RunLevel Highest `
  -Force
Write-Host "OK Prize scan PM scheduled (daily 8pm)"

# ── Task 6: Autonomous Solver (fetch bounties · Claude solves · GitHub PR) ──
# Runs 4x daily. Each run: fetches Algora/IssueHunt/Gitcoin, Claude writes fix,
# GitHub API submits PR. Zero human intervention. Payment auto-releases on merge.

$solveAction = New-ScheduledTaskAction `
  -Execute $nodeExe `
  -Argument "`"$runScript`" solve" `
  -WorkingDirectory $hiveDir

$solveTrigger1 = New-ScheduledTaskTrigger -Daily -At "06:00"
$solveTrigger2 = New-ScheduledTaskTrigger -Daily -At "12:00"
$solveTrigger3 = New-ScheduledTaskTrigger -Daily -At "18:00"
$solveTrigger4 = New-ScheduledTaskTrigger -Daily -At "00:00"

Register-ScheduledTask `
  -TaskName "QueenBeeRoot-Solver-0600" `
  -Action $solveAction `
  -Trigger $solveTrigger1 `
  -Settings $settings `
  -RunLevel Highest `
  -Force
Write-Host "OK Solver 6am scheduled"

Register-ScheduledTask `
  -TaskName "QueenBeeRoot-Solver-1200" `
  -Action $solveAction `
  -Trigger $solveTrigger2 `
  -Settings $settings `
  -RunLevel Highest `
  -Force
Write-Host "OK Solver 12pm scheduled"

Register-ScheduledTask `
  -TaskName "QueenBeeRoot-Solver-1800" `
  -Action $solveAction `
  -Trigger $solveTrigger3 `
  -Settings $settings `
  -RunLevel Highest `
  -Force
Write-Host "OK Solver 6pm scheduled"

Register-ScheduledTask `
  -TaskName "QueenBeeRoot-Solver-0000" `
  -Action $solveAction `
  -Trigger $solveTrigger4 `
  -Settings $settings `
  -RunLevel Highest `
  -Force
Write-Host "OK Solver midnight scheduled"

Write-Host ""
Write-Host "======================================================"
Write-Host "  QUEEN BEE ROOT -- 24x7 HIVE ACTIVATED"
Write-Host "  Broadcast + Outbound(9) + Align -> every 30 min"
Write-Host "  Revenue cycle (4 streams + solver) -> every 2 hours"
Write-Host "  Solar scan -> every 15 min"
Write-Host "  Morning brief -> daily 7am"
Write-Host "  Prize scan (Stream 4) -> daily 8am + 8pm"
Write-Host "  Solver (ZERO HUMAN) -> 6am / 12pm / 6pm / midnight"
Write-Host "    Algora + IssueHunt + Gitcoin -> Claude -> GitHub PR -> payment"
Write-Host "  Outbound Goldilocks cap: 9 pitches/cycle (SING!9)"
Write-Host "  Streams: TECH . EXPERIENCE . THEATER . PRIZE"
Write-Host "  NSPFRNP -> infinity 9"
Write-Host "======================================================"
