

$port = 8000
$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $root

Write-Host "Starting local server from: $root`n"

function Start-NodeServer {
    Write-Host "Node.js detected — starting server.js"
    Start-Process -FilePath node -ArgumentList "server.js" -WorkingDirectory $root
    Start-Sleep -Milliseconds 700
    Start-Process "http://localhost:$port/index.html"
}

function Start-PythonServer {
    Write-Host "Node.js not found — falling back to Python http.server"
    Start-Process -FilePath python -ArgumentList "-m", "http.server", "$port" -WorkingDirectory $root
    Start-Sleep -Milliseconds 700
    Start-Process "http://localhost:$port/index.html"
}

if (Get-Command node -ErrorAction SilentlyContinue) {
    Start-NodeServer
    exit 0
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    Start-PythonServer
    exit 0
} else {
    Write-Host "Neither Node.js nor Python were found in PATH. Install one, or run a static server manually."
    Write-Host "Suggested options:" -ForegroundColor Yellow
    Write-Host " - Install Node.js and run ./run.ps1 (recommended)."
    Write-Host " - Or run: python -m http.server 8000" -ForegroundColor Cyan
    exit 1
}
