@echo off
setlocal EnableExtensions EnableDelayedExpansion

cd /d "%~dp0.."

set "VERSION=%~1"
if "%VERSION%"=="" (
  for /f "usebackq delims=" %%v in (`bun -e "console.log(JSON.parse(await Bun.file('packages/opencode/package.json').text()).version)"`) do set "VERSION=%%v"
)

if "%VERSION%"=="" (
  echo Failed to resolve version.
  exit /b 1
)

set "NPM_TAG=latest"

for /f "usebackq delims=" %%v in (`bun -e "console.log(JSON.parse(await Bun.file('packages/opencode/package.json').text()).version)"`) do set "OPENCODE_VERSION=%%v"
for /f "usebackq delims=" %%v in (`bun -e "console.log(JSON.parse(await Bun.file('packages/shared/package.json').text()).version)"`) do set "SHARED_VERSION=%%v"

if not "%OPENCODE_VERSION%"=="%VERSION%" (
  echo packages/opencode/package.json is %OPENCODE_VERSION%, expected %VERSION%.
  exit /b 1
)

if not "%SHARED_VERSION%"=="%VERSION%" (
  echo packages/shared/package.json is %SHARED_VERSION%, expected %VERSION%.
  exit /b 1
)

echo Publishing Zeth Code npm packages v%VERSION%
echo.

call :publish_dir packages\shared @zethrise/shared %VERSION%
if errorlevel 1 exit /b 1

echo.
echo Building Windows x64...
bun run .\packages\opencode\script\build.ts --os=windows --arch=x64
if errorlevel 1 exit /b 1

if exist .npm-dist rmdir /s /q .npm-dist
mkdir .npm-dist
xcopy /e /i /q /y packages\opencode\dist\zethcode-windows-x64 .npm-dist\zethcode-windows-x64 >nul
if errorlevel 1 exit /b 1

echo.
echo Building Linux x64...
bun run .\packages\opencode\script\build.ts --os=linux --arch=x64
if errorlevel 1 exit /b 1

xcopy /e /i /q /y .npm-dist\zethcode-windows-x64 packages\opencode\dist\zethcode-windows-x64 >nul
if errorlevel 1 exit /b 1

echo.
echo Publishing binaries and CLI...
bun run .\packages\opencode\script\publish.ts
if errorlevel 1 exit /b 1

if exist .npm-dist rmdir /s /q .npm-dist

echo.
echo Done. Published/skipped v%VERSION%.
exit /b 0

:publish_dir
set "PKG_DIR=%~1"
set "PKG_NAME=%~2"
set "PKG_VERSION=%~3"

echo.
echo Checking %PKG_NAME%@%PKG_VERSION%...
npm view "%PKG_NAME%@%PKG_VERSION%" version >nul 2>nul
if not errorlevel 1 (
  echo Already published %PKG_NAME%@%PKG_VERSION%, skipping.
  exit /b 0
)

echo Publishing %PKG_NAME%@%PKG_VERSION%...
pushd "%PKG_DIR%" >nul
npm publish --access public --tag "%NPM_TAG%"
set "PUBLISH_EXIT=%ERRORLEVEL%"
popd >nul
exit /b %PUBLISH_EXIT%
