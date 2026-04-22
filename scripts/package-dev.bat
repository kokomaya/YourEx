@echo off
setlocal

cd /d "%~dp0.."

echo [YourEx] Packaging development VSIX...
call npm run package:dev
if errorlevel 1 (
  echo [YourEx] Development packaging failed.
  exit /b 1
)

echo [YourEx] Development VSIX packaged successfully.
exit /b 0
