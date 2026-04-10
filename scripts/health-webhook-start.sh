#!/usr/bin/env bash
# health-webhook-start.sh
# Starts the Apple Health webhook server in the background.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER="$SCRIPT_DIR/health-webhook-server.py"
PID_FILE="/tmp/health-webhook.pid"
LOG_FILE="/tmp/health-webhook.log"
DATA_DIR="/root/.apple-health-sync"
TOKEN_FILE="$DATA_DIR/webhook-secret.txt"
PORT="${HEALTH_WEBHOOK_PORT:-8421}"
HOST="srv882799.hstgr.cloud"

# ── Stop existing instance ────────────────────────────────────────────────────
if [[ -f "$PID_FILE" ]]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "[health-webhook] Stopping existing instance (PID $OLD_PID)..."
        kill "$OLD_PID" || true
        sleep 1
    fi
    rm -f "$PID_FILE"
fi

# ── Start server ──────────────────────────────────────────────────────────────
echo "[health-webhook] Starting server..."
HEALTH_WEBHOOK_PORT="$PORT" python3 "$SERVER" >> "$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

# give it a moment to boot
sleep 1

if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "[health-webhook] ❌ Server failed to start. Check log: $LOG_FILE"
    tail -20 "$LOG_FILE"
    exit 1
fi

# ── Read token ────────────────────────────────────────────────────────────────
mkdir -p "$DATA_DIR"
TOKEN=""
if [[ -f "$TOKEN_FILE" ]]; then
    TOKEN=$(cat "$TOKEN_FILE" | tr -d '[:space:]')
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║         Apple Health Webhook Server — RUNNING                   ║"
echo "╠══════════════════════════════════════════════════════════════════╣"
echo "║  PID        : $SERVER_PID"
echo "║  Log        : $LOG_FILE"
echo "║  Port       : $PORT"
echo "║  Ping URL   : http://$HOST:$PORT/health/ping"
echo "║  POST URL   : http://$HOST:$PORT/health"
echo "║  Token      : ${TOKEN:-'(not yet generated — check log)'}"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "  Put this in the iOS Shortcut Authorization header:"
echo "    Bearer ${TOKEN:-<check /root/.apple-health-sync/webhook-secret.txt>}"
echo ""
echo "  Test it:"
echo "    curl http://localhost:$PORT/health/ping"
echo ""
