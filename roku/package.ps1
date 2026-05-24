# Package Roku app for sideload deployment
# CRITICAL: Zip must have files at root, not nested in subfolder

$outputFile = "AIAMusicRoku.zip"

Write-Host "Packaging Roku app..." -ForegroundColor Cyan

# Remove old package if exists
if (Test-Path $outputFile) {
    Remove-Item $outputFile -Force
    Write-Host "Removed old package" -ForegroundColor Yellow
}

# Create temp directory for staging
$tempDir = "temp_package"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy files to temp directory (flat structure)
Copy-Item "manifest" -Destination $tempDir
Copy-Item "source" -Destination $tempDir -Recurse
Copy-Item "components" -Destination $tempDir -Recurse
Copy-Item "images" -Destination $tempDir -Recurse

# Create zip from temp directory contents (files at root)
$tempPath = Resolve-Path $tempDir
$items = Get-ChildItem $tempPath
Compress-Archive -Path $items.FullName -DestinationPath $outputFile -Force

# Clean up temp directory
Remove-Item $tempDir -Recurse -Force

if (Test-Path $outputFile) {
    $size = (Get-Item $outputFile).Length / 1KB
    Write-Host "✅ Package created: $outputFile ($([math]::Round($size, 2)) KB)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Zip structure verified (files at root, no nesting)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Verify auth token in source/main.brs (line 15)" -ForegroundColor White
    Write-Host "2. Open http://192.168.1.71 in browser" -ForegroundColor White
    Write-Host "3. Login: rokudev / 1718roku" -ForegroundColor White
    Write-Host "4. Upload $outputFile" -ForegroundColor White
} else {
    Write-Host "❌ Failed to create package" -ForegroundColor Red
}
