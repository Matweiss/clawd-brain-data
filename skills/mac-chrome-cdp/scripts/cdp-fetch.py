#!/usr/bin/env python3
"""
cdp-fetch.py — Fetch rendered page text via Mac Chrome CDP tunnel
Part of the mac-chrome-cdp skill (clawd-brain-data/skills/mac-chrome-cdp/)

CLI:
  python3 cdp-fetch.py "https://example.com" [--wait 7] [--port 28800] [--tab-id <id>]
  python3 cdp-fetch.py --list-tabs [--port 28800]

Library:
  from cdp_fetch import cdp_get_text
  text, err = cdp_get_text(url, cdp_port=28800, wait=7, tab_id=None)
"""

import sys
import socket
import struct
import json
import time
import http.client
import argparse


DEFAULT_PORT = 28800
DEFAULT_WAIT = 7


# ── Tab discovery ──────────────────────────────────────────────────────────────

def get_tabs(cdp_port=DEFAULT_PORT):
    """Return list of open Chrome tabs from CDP /json endpoint."""
    conn = http.client.HTTPConnection("127.0.0.1", cdp_port, timeout=5)
    conn.request("GET", "/json")
    resp = conn.getresponse()
    return json.loads(resp.read())


def find_tab(cdp_port=DEFAULT_PORT, prefer_url=None):
    """
    Find a usable Chrome tab.
    If prefer_url is set, prefer a tab whose URL contains that string.
    Falls back to first non-extension HTTP tab.
    """
    tabs = get_tabs(cdp_port)
    if prefer_url:
        for t in tabs:
            if prefer_url in t.get("url", ""):
                return t["id"]
    for t in tabs:
        url = t.get("url", "")
        if url.startswith("http") and "chrome-extension" not in url:
            return t["id"]
    return None


# ── Raw WebSocket (no Origin header) ──────────────────────────────────────────

def _ws_connect(tab_id, cdp_port=DEFAULT_PORT):
    """Open raw WebSocket to a Chrome tab. No Origin header = Chrome accepts it."""
    path = f"/devtools/page/{tab_id}"
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect(("127.0.0.1", cdp_port))
    s.settimeout(20)
    key = "cmFuZG9ta2V5MTIzNDU2Nzg="  # static, Chrome doesn't validate the key value
    handshake = (
        f"GET {path} HTTP/1.1\r\n"
        f"Host: 127.0.0.1:{cdp_port}\r\n"
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


def _ws_send(s, data):
    """Send a masked WebSocket text frame."""
    payload = json.dumps(data).encode()
    length = len(payload)
    frame = bytearray([0x81])
    if length <= 125:
        frame.append(0x80 | length)
    elif length <= 65535:
        frame.append(0x80 | 126)
        frame.extend(struct.pack(">H", length))
    else:
        frame.append(0x80 | 127)
        frame.extend(struct.pack(">Q", length))
    frame.extend(b"\x00\x00\x00\x00")  # zero mask key
    frame.extend(payload)
    s.sendall(bytes(frame))


def _ws_recv(s, timeout=15):
    """Receive and decode one WebSocket text frame."""
    s.settimeout(timeout)
    buf = b""
    while True:
        try:
            chunk = s.recv(65536)
        except socket.timeout:
            return None
        if not chunk:
            break
        buf += chunk
        if len(buf) < 2:
            continue
        length = buf[1] & 0x7F
        offset = 2
        if length == 126:
            if len(buf) < 4:
                continue
            length = struct.unpack(">H", buf[2:4])[0]
            offset = 4
        elif length == 127:
            if len(buf) < 10:
                continue
            length = struct.unpack(">Q", buf[2:10])[0]
            offset = 10
        if buf[1] & 0x80:
            offset += 4  # masked frame: skip 4-byte mask key
        if len(buf) >= offset + length:
            return json.loads(buf[offset: offset + length].decode())
    return None


# ── Main fetch function ────────────────────────────────────────────────────────

def cdp_get_text(url, cdp_port=DEFAULT_PORT, wait=DEFAULT_WAIT, tab_id=None):
    """
    Navigate Mac Chrome to `url` and return rendered page text.

    Returns:
        (text: str, error: None)  on success
        (None, error: str)        on failure
    """
    if tab_id is None:
        tab_id = find_tab(cdp_port)
        if not tab_id:
            return None, "No usable Chrome tab found. Open a tab in Chrome first."

    try:
        s = _ws_connect(tab_id, cdp_port)
    except Exception as e:
        return None, f"CDP connect failed: {e}"

    try:
        # Navigate
        _ws_send(s, {"id": 1, "method": "Page.navigate", "params": {"url": url}})
        resp = _ws_recv(s, timeout=10)
        if not resp or "error" in resp:
            return None, f"Navigate failed: {resp}"

        # Wait for SPA render
        time.sleep(wait)

        # Extract text
        _ws_send(s, {
            "id": 2,
            "method": "Runtime.evaluate",
            "params": {"expression": "document.body.innerText"}
        })
        resp = _ws_recv(s, timeout=15)
        if not resp:
            return None, "No response to evaluate call"

        text = resp.get("result", {}).get("result", {}).get("value", "")
        return text, None

    except Exception as e:
        return None, f"CDP error: {e}"
    finally:
        try:
            s.close()
        except Exception:
            pass


# ── CLI ────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Fetch page text via Mac Chrome CDP tunnel")
    parser.add_argument("url", nargs="?", help="URL to fetch")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="CDP port (default: 28800)")
    parser.add_argument("--wait", type=float, default=DEFAULT_WAIT, help="Seconds to wait for page render (default: 7)")
    parser.add_argument("--tab-id", help="Specific Chrome tab ID to use")
    parser.add_argument("--list-tabs", action="store_true", help="List open Chrome tabs and exit")
    parser.add_argument("--max-chars", type=int, default=0, help="Truncate output to N chars (0=unlimited)")
    args = parser.parse_args()

    if args.list_tabs:
        try:
            tabs = get_tabs(args.port)
            print(f"{len(tabs)} tabs open on port {args.port}:")
            for t in tabs:
                print(f"  {t['id']}  {t.get('url','')[:80]}")
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)
        return

    if not args.url:
        parser.print_help()
        sys.exit(1)

    print(f"Fetching: {args.url}", file=sys.stderr)
    text, err = cdp_get_text(args.url, cdp_port=args.port, wait=args.wait, tab_id=args.tab_id)
    if err:
        print(f"Error: {err}", file=sys.stderr)
        sys.exit(1)

    if args.max_chars and len(text) > args.max_chars:
        text = text[:args.max_chars] + f"\n[... truncated at {args.max_chars} chars, total {len(text)}]"

    print(text)


if __name__ == "__main__":
    main()
