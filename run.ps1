# Run the local static server for this project using Python and open the browser.
# Usage: open PowerShell in this project folder and run `./run.ps1`

$port = 8000
$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $root

Write-Host "Starting local Python server from: $root`n"

if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "Starting: python -m http.server $port"
    Start-Process -FilePath python -ArgumentList "-m", "http.server", "$port" -WorkingDirectory $root
    Start-Sleep -Milliseconds 700
    Start-Process "http://localhost:$port/index.html"
    exit 0
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    Write-Host "Starting: python3 -m http.server $port"
    Start-Process -FilePath python3 -ArgumentList "-m", "http.server", "$port" -WorkingDirectory $root
    Start-Sleep -Milliseconds 700
    Start-Process "http://localhost:$port/index.html"
    exit 0
} else {
    Write-Host "Python was not found in PATH. Install Python 3 or run a static server manually." -ForegroundColor Red
    Write-Host "Suggested commands:" -ForegroundColor Yellow
    Write-Host " - python -m http.server 8000" -ForegroundColor Cyan
    Write-Host " - python3 -m http.server 8000" -ForegroundColor Cyan
    exit 1
}
