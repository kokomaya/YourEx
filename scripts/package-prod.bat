@echo off
setlocal

cd /d "%~dp0.."

echo [YourEx] Packaging production VSIX...
call npm run package:prod
if errorlevel 1 (
  echo [YourEx] Production packaging failed.
  exit /b 1
)

echo [YourEx] Production VSIX packaged successfully.
exit /b 0
