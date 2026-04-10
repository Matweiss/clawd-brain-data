#!/usr/bin/env python3
"""
Apple Health Webhook Server
Receives health data from iOS Shortcuts, stores in SQLite, exposes query API.

Usage:
    python3 health-webhook-server.py
    HEALTH_WEBHOOK_PORT=8421 python3 health-webhook-server.py

Endpoints:
    POST /health           — ingest health data
    GET  /health/summary   — aggregated summary (?period=daily|weekly|monthly)
    GET  /health/latest    — most recent value per metric
    GET  /health/ping      — health check
"""

import http.server
import json
import os
import secrets
import sqlite3
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import parse_qs, urlparse

# ── Config ────────────────────────────────────────────────────────────────────

DATA_DIR   = Path("/root/.apple-health-sync")
DB_PATH    = DATA_DIR / "health_webhook.db"
TOKEN_FILE = DATA_DIR / "webhook-secret.txt"
PORT       = int(os.environ.get("HEALTH_WEBHOOK_PORT", 8421))
HOST       = "0.0.0.0"

# ── Bootstrap ─────────────────────────────────────────────────────────────────

def ensure_data_dir():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

def load_or_create_token() -> str:
    if TOKEN_FILE.exists():
        tok = TOKEN_FILE.read_text().strip()
        if tok:
            return tok
    tok = secrets.token_urlsafe(32)
    TOKEN_FILE.write_text(tok + "\n")
    TOKEN_FILE.chmod(0o600)
    print(f"[bootstrap] Generated new bearer token → {TOKEN_FILE}")
    return tok

def init_db(conn: sqlite3.Connection):
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS snapshots (
            id          INTEGER PRIMARY KEY,
            received_at TEXT    NOT NULL,
            date        TEXT    NOT NULL,
            source      TEXT    NOT NULL,
            payload     TEXT    NOT NULL
        );

        CREATE TABLE IF NOT EXISTS metrics (
            id         INTEGER PRIMARY KEY,
            date       TEXT    NOT NULL,
            metric     TEXT    NOT NULL,
            value      REAL    NOT NULL,
            unit       TEXT    NOT NULL DEFAULT '',
            source     TEXT    NOT NULL DEFAULT 'unknown',
            updated_at TEXT    NOT NULL,
            UNIQUE(date, metric, source)
        );

        CREATE INDEX IF NOT EXISTS idx_metrics_date   ON metrics(date);
        CREATE INDEX IF NOT EXISTS idx_metrics_metric ON metrics(metric);
    """)
    conn.commit()

def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

# ── Helpers ───────────────────────────────────────────────────────────────────

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def json_response(handler, data, status=200):
    body = json.dumps(data, indent=2).encode()
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)

def error_response(handler, message, status=400):
    json_response(handler, {"ok": False, "error": message}, status)

def log(handler, extra=""):
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    client = handler.client_address[0]
    print(f"[{ts}] {client} {handler.command} {handler.path} {extra}", flush=True)

# ── Auth ──────────────────────────────────────────────────────────────────────

BEARER_TOKEN: str = ""   # set at startup

def check_auth(handler) -> bool:
    auth = handler.headers.get("Authorization", "")
    if auth == f"Bearer {BEARER_TOKEN}":
        return True
    error_response(handler, "Unauthorized", 401)
    return False

# ── Request handlers ──────────────────────────────────────────────────────────

def handle_ping(handler):
    log(handler)
    json_response(handler, {"ok": True, "ts": now_iso()})


def handle_post_health(handler):
    if not check_auth(handler):
        log(handler, "→ 401 unauthorized")
        return

    length = int(handler.headers.get("Content-Length", 0))
    if length == 0:
        log(handler, "→ 400 no body")
        error_response(handler, "Empty body")
        return

    try:
        raw = handler.rfile.read(length)
        payload = json.loads(raw.decode("utf-8"))
    except Exception as e:
        log(handler, f"→ 400 bad JSON: {e}")
        error_response(handler, f"Invalid JSON: {e}")
        return

    date   = payload.get("date", "")
    source = payload.get("source", "unknown")
    metrics_in = payload.get("metrics", {})

    if not date:
        error_response(handler, "Missing 'date' field")
        return

    ts = now_iso()
    stored = 0

    try:
        with get_db() as conn:
            init_db(conn)
            # raw snapshot
            conn.execute(
                "INSERT INTO snapshots (received_at, date, source, payload) VALUES (?,?,?,?)",
                (ts, date, source, json.dumps(payload))
            )
            # upsert each metric
            for metric_name, meta in metrics_in.items():
                value = meta.get("value")
                unit  = meta.get("unit", "")
                if value is None:
                    continue
                try:
                    value = float(value)
                except (TypeError, ValueError):
                    continue
                conn.execute("""
                    INSERT INTO metrics (date, metric, value, unit, source, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON CONFLICT(date, metric, source) DO UPDATE SET
                        value      = excluded.value,
                        unit       = excluded.unit,
                        updated_at = excluded.updated_at
                """, (date, metric_name, value, unit, source, ts))
                stored += 1
            conn.commit()
    except Exception as e:
        log(handler, f"→ 500 db error: {e}")
        error_response(handler, f"Database error: {e}", 500)
        return

    log(handler, f"→ 200 stored={stored}")
    json_response(handler, {"ok": True, "stored": stored, "date": date})


def handle_get_latest(handler):
    if not check_auth(handler):
        log(handler, "→ 401")
        return

    try:
        with get_db() as conn:
            init_db(conn)
            rows = conn.execute("""
                SELECT metric, value, unit, source, date, updated_at
                FROM metrics
                WHERE (metric, date) IN (
                    SELECT metric, MAX(date) FROM metrics GROUP BY metric
                )
                ORDER BY metric
            """).fetchall()
    except Exception as e:
        error_response(handler, str(e), 500)
        return

    result = {}
    for r in rows:
        result[r["metric"]] = {
            "value":      r["value"],
            "unit":       r["unit"],
            "date":       r["date"],
            "source":     r["source"],
            "updated_at": r["updated_at"],
        }

    log(handler, f"→ 200 metrics={len(result)}")
    json_response(handler, {"ok": True, "latest": result})


def handle_get_summary(handler):
    if not check_auth(handler):
        log(handler, "→ 401")
        return

    parsed = urlparse(handler.path)
    qs     = parse_qs(parsed.query)
    period = qs.get("period", ["weekly"])[0]

    days_map = {"daily": 1, "weekly": 7, "monthly": 30}
    days = days_map.get(period, 7)

    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")

    try:
        with get_db() as conn:
            init_db(conn)
            rows = conn.execute("""
                SELECT
                    metric,
                    AVG(value)  AS avg,
                    MIN(value)  AS min,
                    MAX(value)  AS max,
                    COUNT(DISTINCT date) AS days_with_data,
                    unit
                FROM metrics
                WHERE date >= ?
                GROUP BY metric, unit
                ORDER BY metric
            """, (cutoff,)).fetchall()

            # latest value per metric in period
            latest_rows = conn.execute("""
                SELECT metric, value, date
                FROM metrics
                WHERE date >= ?
                  AND (metric, date) IN (
                      SELECT metric, MAX(date) FROM metrics WHERE date >= ? GROUP BY metric
                  )
            """, (cutoff, cutoff)).fetchall()

    except Exception as e:
        error_response(handler, str(e), 500)
        return

    latest_map = {r["metric"]: {"value": r["value"], "date": r["date"]} for r in latest_rows}

    result = {}
    for r in rows:
        m = r["metric"]
        result[m] = {
            "avg":            round(r["avg"], 3),
            "min":            r["min"],
            "max":            r["max"],
            "latest":         latest_map.get(m, {}).get("value"),
            "latest_date":    latest_map.get(m, {}).get("date"),
            "days_with_data": r["days_with_data"],
            "unit":           r["unit"],
        }

    log(handler, f"→ 200 period={period} metrics={len(result)}")
    json_response(handler, {"ok": True, "period": period, "days": days, "since": cutoff, "summary": result})


# ── Request dispatcher ────────────────────────────────────────────────────────

class HealthHandler(http.server.BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):
        # suppress default access log (we do our own)
        pass

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/health/ping":
            handle_ping(self)
        elif path == "/health/latest":
            handle_get_latest(self)
        elif path == "/health/summary":
            handle_get_summary(self)
        else:
            log(self, "→ 404")
            error_response(self, "Not found", 404)

    def do_POST(self):
        path = urlparse(self.path).path
        if path == "/health":
            handle_post_health(self)
        else:
            log(self, "→ 404")
            error_response(self, "Not found", 404)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    global BEARER_TOKEN

    ensure_data_dir()
    BEARER_TOKEN = load_or_create_token()

    # pre-init DB
    with get_db() as conn:
        init_db(conn)

    print(f"╔══════════════════════════════════════════════════════════╗", flush=True)
    print(f"║         Apple Health Webhook Server                     ║", flush=True)
    print(f"╠══════════════════════════════════════════════════════════╣", flush=True)
    print(f"║  Listening : http://{HOST}:{PORT}                        ", flush=True)
    print(f"║  Ping      : http://srv882799.hstgr.cloud:{PORT}/health/ping", flush=True)
    print(f"║  Token     : {BEARER_TOKEN}", flush=True)
    print(f"║  DB        : {DB_PATH}", flush=True)
    print(f"╚══════════════════════════════════════════════════════════╝", flush=True)

    server = http.server.HTTPServer((HOST, PORT), HealthHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[shutdown] Server stopped.", flush=True)
        sys.exit(0)


if __name__ == "__main__":
    main()
