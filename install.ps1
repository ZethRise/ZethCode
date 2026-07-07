$ErrorActionPreference = "Stop"

$release = Invoke-RestMethod "https://api.github.com/repos/ZethRise/ZethCode/releases/latest"
$asset = if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") {
  $release.assets | Where-Object name -eq "zethcode-windows-arm64.exe" | Select-Object -First 1
} else {
  $release.assets | Where-Object name -eq "zethcode-windows-x64.exe" | Select-Object -First 1
}

if (!$asset) {
  throw "No matching Windows release asset found."
}

$dir = Join-Path $env:LOCALAPPDATA "ZethCode"
$exe = Join-Path $dir "zeth.exe"
New-Item -ItemType Directory -Force $dir | Out-Null
Invoke-WebRequest $asset.browser_download_url -OutFile $exe

$path = [Environment]::GetEnvironmentVariable("Path", "User")
if (($path -split ";") -notcontains $dir) {
  [Environment]::SetEnvironmentVariable("Path", ($path.TrimEnd(";") + ";" + $dir), "User")
}

Write-Host "Installed Zeth Code to $exe"
Write-Host "Open a new terminal and run: zeth"
