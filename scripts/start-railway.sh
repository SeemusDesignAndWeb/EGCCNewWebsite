#!/bin/sh
# Railway start: log immediately so deploy logs are visible, run deploy script, then start server.
set -e
echo "[railway] Start command running..."
echo "[railway] Deploy step (ensure DB table, log org IDs)..."
node -r dotenv/config scripts/deploy.js || true
echo "[railway] Starting server..."
exec node -r dotenv/config build/index.js
