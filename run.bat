@echo off
rem ourTake trainer-trial launcher: worker + Cloudflare tunnel in their own windows.
cd /d "%~dp0"
set "CF=cloudflared"
where cloudflared >nul 2>&1 || set "CF=C:\Program Files (x86)\cloudflared\cloudflared.exe"
if not exist "%CF%" if not "%CF%"=="cloudflared" set "CF=C:\Program Files\cloudflared\cloudflared.exe"
echo Starting ourTake worker and tunnel...
start "ourTake worker" cmd /k call npm.cmd run start:tunnel
start "ourTake tunnel" cmd /k call "%CF%" tunnel run ourtake
echo.
echo Two windows opened: "ourTake worker" (session milestones) and "ourTake tunnel".
echo Session address: https://take.gozaika.in
echo Stop everything with kill.bat
