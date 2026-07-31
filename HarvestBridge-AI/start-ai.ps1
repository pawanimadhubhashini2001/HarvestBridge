param(
    [string]$BindHost = "127.0.0.1",
    [int]$Port = 8010
)

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonPath = Join-Path $projectRoot ".venv\Scripts\python.exe"

if (-not (Test-Path $pythonPath)) {
    Write-Error "Python virtual environment was not found at $pythonPath"
    exit 1
}

Set-Location $projectRoot

Write-Host "Starting HarvestBridge AI on http://$BindHost`:$Port" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Yellow

& $pythonPath -m uvicorn app.main:app --host $BindHost --port $Port
