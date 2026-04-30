@echo off
cd /d %~dp0

echo Starting backend and frontend...

cd server
if not exist node_modules (
  echo Installing backend dependencies...
  npm install
)
start cmd /k "npm run dev"

cd ../client
if not exist node_modules (
  echo Installing frontend dependencies...
  npm install
)
start cmd /k "npm run dev"

echo Both servers are starting...