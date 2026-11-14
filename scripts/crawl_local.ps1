# Cinema local crawler runner
# Crawls sermovie hosts from this laptop (node scripts/crawl.js) and pushes
# public/db.json to GitHub when the content actually changed.
#
# Runs via Windows Task Scheduler: "Cinema Local Crawler" (every 6 hours).
# Manual run:      Start-ScheduledTask 'Cinema Local Crawler'
# Logs:            logs\crawl_local.log   (trimmed to ~500 lines when > 1MB)
# Coexists with the GitHub Actions crawler: pulls with rebase first, and if the
# push races with an Actions commit it rebases on top (-X theirs) and retries.

# NOTE: $ErrorActionPreference must stay 'Continue' — in PS 5.1 with 'Stop', native
# stderr lines (git fetch progress, node console.error) become terminating errors
# when captured via 2>&1. Every native call below is checked via $LASTEXITCODE.
$ErrorActionPreference = 'Continue'
$repo = Split-Path -Parent $PSScriptRoot          # repo root (parent of scripts\)
Set-Location $repo

$logDir = Join-Path $repo 'logs'
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
$log = Join-Path $logDir 'crawl_local.log'

function Log($m) {
  ("{0}  {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m) | Add-Content -Path $log -Encoding UTF8
}

# keep the log small
if ((Test-Path $log) -and ((Get-Item $log).Length -gt 1MB)) {
  $tail = Get-Content $log -Tail 500
  Set-Content -Path $log -Value $tail -Encoding UTF8
}

Log '=== local crawl start ==='
try {
  Log 'git pull --rebase origin main ...'
  $pullOut = & git pull --rebase origin main 2>&1
  if ($LASTEXITCODE -ne 0) {
    Log ("pull failed: " + (($pullOut | ForEach-Object { "$_" }) -join ' | '))
    throw 'git pull failed'
  }

  Log 'running crawler (node scripts/crawl.js) — this takes ~30-60 min ...'
  $crawlOut = & node scripts/crawl.js 2>&1
  $crawlExit = $LASTEXITCODE
  $crawlOut | Select-Object -Last 25 | ForEach-Object { Log "crawl| $_" }
  if ($crawlExit -ne 0) {
    Log "RESULT: crawl-failed (exit $crawlExit)"
    exit 1
  }

  $changed = & git status --porcelain public/db.json
  if (-not $changed) {
    Log 'RESULT: no-changes'
    exit 0
  }

  Log 'db.json changed — committing ...'
  & git add public/db.json
  & git commit -m ("chore: update movie database (local) {0}" -f (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')) | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Log 'nothing to commit'
    Log 'RESULT: no-changes'
    exit 0
  }

  & git push origin main 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) {
    Log 'RESULT: pushed'
    exit 0
  }

  Log 'push rejected — rebasing on top of remote (-X theirs) and retrying ...'
  & git pull --rebase -X theirs origin main 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    & git rebase --abort 2>$null
    & git pull --rebase -X theirs origin main 2>&1 | Out-Null
  }
  & git push origin main 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) {
    Log 'RESULT: pushed (after rebase)'
  } else {
    Log 'RESULT: push-failed'
    exit 1
  }
}
catch {
  Log "RESULT: error - $($_.Exception.Message)"
  exit 1
}
