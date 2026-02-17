<#
.SYNOPSIS
Wrapper script to run npm commands inside the Docker container.
Usage: .\scripts\dnpm.ps1 install <package-name>
#>

param(
    [Parameter(ValueFromRemainingArguments = $true)]
    $args
)

# Configuration: Ensure this matches the service name in docker-compose.yml
$serviceName = "expo-app"

# 1. Check if the container is running
$running = docker compose ps -q $serviceName

if (-not $running) {
    Write-Host "⚠️  Container '$serviceName' is not running. Starting it up..." -ForegroundColor Yellow
    docker compose up -d
    
    # Wait a few seconds to ensure the container is ready to accept commands
    Start-Sleep -Seconds 5
}

# 2. Execute the command inside the container
if ($args) {
    Write-Host "🐳 Running: npm $args" -ForegroundColor Cyan
    # We use $args to pass everything (install, start, test, etc.)
    docker compose exec $serviceName npm $args
} else {
    Write-Host "❌ No command provided. Usage: .\scripts\dnpm.ps1 install axios" -ForegroundColor Red
}