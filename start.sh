#!/bin/bash

echo "Starting backend and frontend..."

cleanup() {
  echo "Stopping processes..."
  kill $SERVER_PID $CLIENT_PID
  exit
}

trap cleanup SIGINT

# Backend
cd server
[ ! -d "node_modules" ] && npm install
npm run dev &
SERVER_PID=$!

# Frontend
cd ../client
[ ! -d "node_modules" ] && npm install
npm run dev &
CLIENT_PID=$!

wait