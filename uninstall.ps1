$ErrorActionPreference = "Stop"

$dir = Join-Path $env:LOCALAPPDATA "ZethCode"
$exe = Join-Path $dir "zeth.exe"

if (Test-Path $exe) {
  Remove-Item $exe -Force
  Write-Host "Removed $exe"
} else {
  Write-Host "Zeth Code executable not found at $exe"
}

if ((Test-Path $dir) -and -not (Get-ChildItem $dir -Force)) {
  Remove-Item $dir -Force
  Write-Host "Removed empty install directory $dir"
}

$path = [Environment]::GetEnvironmentVariable("Path", "User")
if ($path) {
  $next = (($path -split ";") | Where-Object { $_ -and $_.TrimEnd("\") -ne $dir.TrimEnd("\") }) -join ";"
  if ($next -ne $path) {
    [Environment]::SetEnvironmentVariable("Path", $next, "User")
    Write-Host "Removed $dir from user PATH"
  }
}

Write-Host "Uninstalled Zeth Code"
Write-Host "Open a new terminal for PATH changes to take effect."
