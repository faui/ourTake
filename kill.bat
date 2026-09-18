@echo off
rem Stops the ourTake worker and tunnel. Targets only ourTake processes:
rem the two titled console windows, cloudflared, and whatever listens on 4100.
taskkill /F /T /FI "WINDOWTITLE eq ourTake worker*" >nul 2>&1
taskkill /F /T /FI "WINDOWTITLE eq ourTake tunnel*" >nul 2>&1
taskkill /F /IM cloudflared.exe >nul 2>&1
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 4100 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"
echo ourTake worker and tunnel stopped. https://take.gozaika.in is now offline.
