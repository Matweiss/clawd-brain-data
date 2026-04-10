#!/usr/bin/env bash
# install-health-webhook-service.sh
# Installs, enables, and starts the health-webhook systemd service.
# Also opens port 8421 in UFW if active.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_SRC="$SCRIPT_DIR/health-webhook.service"
SERVICE_DST="/etc/systemd/system/health-webhook.service"
PORT="${HEALTH_WEBHOOK_PORT:-8421}"

echo "[install] Apple Health Webhook Service installer"
echo ""

# ── Root check ────────────────────────────────────────────────────────────────
if [[ "$EUID" -ne 0 ]]; then
    echo "❌ Must run as root (sudo $0)"
    exit 1
fi

# ── Copy service file ─────────────────────────────────────────────────────────
echo "[1/4] Copying service file to $SERVICE_DST"
cp "$SERVICE_SRC" "$SERVICE_DST"
chmod 644 "$SERVICE_DST"

# ── Reload systemd ────────────────────────────────────────────────────────────
echo "[2/4] Reloading systemd daemon"
systemctl daemon-reload

# ── Enable + start ────────────────────────────────────────────────────────────
echo "[3/4] Enabling and starting health-webhook.service"
systemctl enable health-webhook
systemctl restart health-webhook

# Wait a moment and check status
sleep 2
if systemctl is-active --quiet health-webhook; then
    echo "  ✅ Service is running"
else
    echo "  ❌ Service failed to start"
    journalctl -u health-webhook --no-pager -n 20
    exit 1
fi

# ── UFW ───────────────────────────────────────────────────────────────────────
echo "[4/4] Checking UFW..."
if command -v ufw &>/dev/null && ufw status | grep -q "Status: active"; then
    echo "  UFW is active — opening port $PORT/tcp"
    ufw allow "$PORT/tcp" comment "Apple Health Webhook"
    echo "  ✅ UFW rule added for port $PORT"
else
    echo "  UFW not active — skipping firewall rule"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
TOKEN_FILE="/root/.apple-health-sync/webhook-secret.txt"
TOKEN=""
if [[ -f "$TOKEN_FILE" ]]; then
    TOKEN=$(cat "$TOKEN_FILE" | tr -d '[:space:]')
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║   Apple Health Webhook — INSTALLED & RUNNING                    ║"
echo "╠══════════════════════════════════════════════════════════════════╣"
echo "║  Service : health-webhook                                       ║"
echo "║  Port    : $PORT                                                "
echo "║  Ping    : curl http://localhost:$PORT/health/ping              "
echo "║  Token   : ${TOKEN:-'(start service first to generate token)'}  "
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "Manage with:"
echo "  systemctl status health-webhook"
echo "  journalctl -u health-webhook -f"
echo "  systemctl restart health-webhook"
echo ""
