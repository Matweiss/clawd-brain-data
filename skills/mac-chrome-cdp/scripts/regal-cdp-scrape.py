#!/usr/bin/env python3
"""
regal-cdp-scrape.py — Scrape Regal Sherman Oaks via raw CDP (bypasses Cloudflare block on VPS IP)
Uses Mac Chrome tunneled to VPS on port 28800 via SSH reverse tunnel.

Usage:
  python3 regal-cdp-scrape.py <date> [tab_id]
  date format: 04-02-2026
  tab_id: optional, auto-detected from port 28800 if omitted

Discovery:
  curl -s http://127.0.0.1:28800/json | python3 -c "import sys,json;[print(p['id'],p['url'][:80]) for p in json.load(sys.stdin)]"

How it works:
  Chrome's DevTools Protocol (CDP) requires no Origin header when connecting without one.
  The SSH tunnel reverse-forwards Mac Chrome's CDP port to 127.0.0.1:28800 on the VPS.
  The python websocket-client library adds an Origin header by default, which Chrome rejects.
  This script uses raw sockets to send a headerless WebSocket handshake that Chrome accepts.
"""

import sys
import socket
import struct
import json
import time
import http.client

CDP_HOST = "127.0.0.1"
CDP_PORT = 28800
REGAL_THEATRE_PATH = "/theatres/regal-sherman-oaks-galleria-1483"
REGAL_BASE = "https://www.regmovies.com"
PAGE_LOAD_WAIT = 7  # seconds to wait after navigation


def get_pages():
    """List all open Chrome tabs"""
    conn = http.client.HTTPConnection(CDP_HOST, CDP_PORT, timeout=5)
    conn.request("GET", "/json")
    resp = conn.getresponse()
    return json.loads(resp.read())


def find_regal_tab():
    """Find an existing Regal tab, or return any available tab"""
    pages = get_pages()
    # Prefer existing Regal tab
    for p in pages:
        if "regmovies.com" in p.get("url", ""):
            return p["id"]
    # Fall back to first non-extension tab
    for p in pages:
        url = p.get("url", "")
        if url.startswith("http") and "chrome-extension" not in url:
            return p["id"]
    return None


def ws_connect(tab_id):
    """Open a raw WebSocket connection to a Chrome tab (no Origin header)"""
    path = f"/devtools/page/{tab_id}"
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((CDP_HOST, CDP_PORT))
    s.settimeout(20)
    key = "cmFuZG9ta2V5MTIzNDU2Nzg="
    handshake = (
        f"GET {path} HTTP/1.1\r\n"
        f"Host: {CDP_HOST}:{CDP_PORT}\r\n"
        f"Upgrade: websocket\r\n"
        f"Connection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {key}\r\n"
        f"Sec-WebSocket-Version: 13\r\n"
        f"\r\n"
    )
    s.sendall(handshake.encode())
    resp = s.recv(4096).decode()
    if "101" not in resp:
        raise Exception(f"WebSocket handshake failed: {resp[:200]}")
    return s


def ws_send(s, data):
    """Send a masked WebSocket text frame"""
    payload = json.dumps(data).encode()
    length = len(payload)
    frame = bytearray([0x81])  # FIN + text opcode
    if length <= 125:
        frame.append(0x80 | length)
    elif length <= 65535:
        frame.append(0x80 | 126)
        frame.extend(struct.pack(">H", length))
    else:
        frame.append(0x80 | 127)
        frame.extend(struct.pack(">Q", length))
    frame.extend(b"\x00\x00\x00\x00")  # zero mask key = no XOR
    frame.extend(payload)
    s.sendall(bytes(frame))


def ws_recv(s, timeout=15):
    """Receive and decode a WebSocket frame"""
    s.settimeout(timeout)
    data = b""
    while True:
        try:
            chunk = s.recv(65536)
        except socket.timeout:
            return None
        if not chunk:
            break
        data += chunk
        if len(data) < 2:
            continue
        length = data[1] & 0x7F
        offset = 2
        if length == 126:
            if len(data) < 4:
                continue
            length = struct.unpack(">H", data[2:4])[0]
            offset = 4
        elif length == 127:
            if len(data) < 10:
                continue
            length = struct.unpack(">Q", data[2:10])[0]
            offset = 10
        if data[1] & 0x80:
            offset += 4  # skip mask key
        if len(data) >= offset + length:
            return json.loads(data[offset : offset + length].decode())
    return None


def get_page_text(tab_id, url, wait=PAGE_LOAD_WAIT):
    """Navigate to a URL and return document.body.innerText"""
    s = ws_connect(tab_id)
    try:
        ws_send(s, {"id": 1, "method": "Page.navigate", "params": {"url": url}})
        resp = ws_recv(s, timeout=10)
        if not resp or "error" in resp:
            return None, f"Navigate failed: {resp}"
        time.sleep(wait)
        ws_send(s, {"id": 2, "method": "Runtime.evaluate", "params": {"expression": "document.body.innerText"}})
        resp = ws_recv(s, timeout=15)
        if not resp:
            return None, "No response to evaluate"
        text = resp.get("result", {}).get("result", {}).get("value", "")
        return text, None
    finally:
        s.close()


def scrape_date(tab_id, date_str):
    """Scrape showtimes for a specific date (format: MM-DD-YYYY)"""
    url = f"{REGAL_BASE}{REGAL_THEATRE_PATH}?date={date_str}"
    print(f"  Scraping {date_str}...", end=" ", flush=True)
    text, err = get_page_text(tab_id, url)
    if err:
        print(f"ERROR: {err}")
        return None
    print(f"{len(text)} chars")
    return text


def main():
    if len(sys.argv) < 2:
        print("Usage: regal-cdp-scrape.py <date> [tab_id]")
        print("  date: MM-DD-YYYY (e.g. 04-02-2026)")
        print("  tab_id: optional, auto-detected")
        sys.exit(1)

    date_arg = sys.argv[1]
    tab_id = sys.argv[2] if len(sys.argv) > 2 else None

    if not tab_id:
        print("Auto-detecting tab...", end=" ")
        tab_id = find_regal_tab()
        if not tab_id:
            print("FAILED — no usable Chrome tab found")
            sys.exit(1)
        print(f"found tab {tab_id}")

    print(f"Scraping Regal for date: {date_arg}")
    text, err = scrape_date(tab_id, date_arg)
    if text:
        print("\n--- PAGE CONTENT ---")
        print(text[:8000])
        if len(text) > 8000:
            print(f"\n[... truncated, total {len(text)} chars]")
    else:
        print(f"Scrape failed: {err}")
        sys.exit(1)


if __name__ == "__main__":
    main()
