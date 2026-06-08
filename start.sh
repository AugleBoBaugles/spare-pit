#!/bin/bash

echo "Starting backend and frontend..."

cleanup() {
  echo "Stopping processes..."
  kill $SERVER_PID $CLIENT_PID 2>/dev/null
  exit
}

trap cleanup SIGINT

# Backend
cd server
[ ! -d "node_modules" ] && npm install
npm run dev &
SERVER_PID=$!

# Wait for the backend to be ready on port 3000 before starting the frontend.
# Polls every 0.5s for up to 15 seconds; exits early if the backend process dies.
echo "Waiting for backend on port 3000..."
ATTEMPTS=0
until (echo > /dev/tcp/localhost/3000) 2>/dev/null; do
  if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "Backend failed to start. Check the output above for errors."
    exit 1
  fi
  if [ $ATTEMPTS -ge 30 ]; then
    echo "Timed out waiting for backend (15s). Check the output above for errors."
    exit 1
  fi
  ATTEMPTS=$((ATTEMPTS + 1))
  sleep 0.5
done
echo "Backend is ready."

# Frontend
cd ../client
[ ! -d "node_modules" ] && npm install
npm run dev &
CLIENT_PID=$!

wait
