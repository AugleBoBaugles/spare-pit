@echo off
cd /d %~dp0

echo Starting backend...

cd server
if not exist node_modules (
  echo Installing backend dependencies...
  npm install
)

start "Backend" /b cmd /c "npm run dev > ..\backend.log 2>&1"

echo Waiting for backend on port 3000...
:wait_loop
  powershell -NoProfile -Command "try { $null = New-Object System.Net.Sockets.TcpClient('localhost', 3000); exit 0 } catch { exit 1 }" >nul 2>&1
  if %errorlevel% == 0 goto backend_ready
  timeout /t 1 /nobreak >nul
  goto wait_loop

:backend_ready
echo Backend is ready.

cd ../client
if not exist node_modules (
  echo Installing frontend dependencies...
  npm install
)

start "Frontend" cmd /k "npm run dev"

echo Both servers are running. Close this window to stop.
pause
