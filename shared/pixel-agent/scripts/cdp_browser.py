#!/usr/bin/env python3
"""Lightweight raw CDP client for Pixel.

Why this exists:
- mcporter/chrome-devtools is the preferred path
- when MCP is down, Pixel still needs a reliable raw CDP fallback
- websocket-client adds an Origin header Chrome may reject on tunneled connections

This module keeps the handshake/header behavior explicit and reusable across
Regal, CorePower, and future browser scrape fallbacks.
"""

from __future__ import annotations

import http.client
import json
import socket
import struct
import time
from dataclasses import dataclass
from typing import Any, Dict, List, Optional


class CdpError(RuntimeError):
    pass


@dataclass
class PageTarget:
    id: str
    url: str
    title: str
    web_socket_debugger_url: str = ""


class RawCdpClient:
    def __init__(self, host: str = "127.0.0.1", port: int = 28800, timeout: int = 20):
        self.host = host
        self.port = port
        self.timeout = timeout

    def _http_get_json(self, path: str) -> Any:
        conn = http.client.HTTPConnection(self.host, self.port, timeout=5)
        try:
            conn.request("GET", path)
            resp = conn.getresponse()
            body = resp.read()
            if resp.status >= 400:
                raise CdpError(f"HTTP {resp.status} for {path}: {body[:200]!r}")
            return json.loads(body)
        finally:
            conn.close()

    def list_pages(self) -> List[PageTarget]:
        pages = self._http_get_json("/json")
        out: List[PageTarget] = []
        for page in pages:
            out.append(
                PageTarget(
                    id=page.get("id", ""),
                    url=page.get("url", ""),
                    title=page.get("title", ""),
                    web_socket_debugger_url=page.get("webSocketDebuggerUrl", ""),
                )
            )
        return out

    def find_tab(self, url_contains: Optional[str] = None) -> Optional[str]:
        pages = self.list_pages()
        if url_contains:
            for page in pages:
                if url_contains in page.url:
                    return page.id
        for page in pages:
            if page.url.startswith("http") and "chrome-extension" not in page.url:
                return page.id
        return None

    def connect(self, tab_id: str) -> socket.socket:
        path = f"/devtools/page/{tab_id}"
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect((self.host, self.port))
        s.settimeout(self.timeout)
        key = "cmFuZG9ta2V5MTIzNDU2Nzg="
        handshake = (
            f"GET {path} HTTP/1.1\r\n"
            f"Host: {self.host}:{self.port}\r\n"
            f"Upgrade: websocket\r\n"
            f"Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            f"Sec-WebSocket-Version: 13\r\n"
            f"\r\n"
        )
        s.sendall(handshake.encode())
        resp = s.recv(4096).decode(errors="replace")
        if "101" not in resp:
            raise CdpError(f"WebSocket handshake failed: {resp[:200]}")
        return s

    def _ws_send(self, sock: socket.socket, data: Dict[str, Any]) -> None:
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
        frame.extend(b"\x00\x00\x00\x00")
        frame.extend(payload)
        sock.sendall(bytes(frame))

    def _ws_recv(self, sock: socket.socket, timeout: int = 15) -> Optional[Dict[str, Any]]:
        sock.settimeout(timeout)
        data = b""
        while True:
            try:
                chunk = sock.recv(65536)
            except socket.timeout:
                return None
            if not chunk:
                return None
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
                offset += 4
            if len(data) >= offset + length:
                try:
                    return json.loads(data[offset : offset + length].decode())
                except json.JSONDecodeError as exc:
                    raise CdpError(f"Invalid websocket payload: {exc}") from exc

    def evaluate(self, tab_id: str, expression: str, timeout: int = 15) -> Any:
        sock = self.connect(tab_id)
        try:
            self._ws_send(sock, {
                "id": 1,
                "method": "Runtime.evaluate",
                "params": {"expression": expression},
            })
            resp = self._ws_recv(sock, timeout=timeout)
            if not resp:
                raise CdpError("No response to Runtime.evaluate")
            if "error" in resp:
                raise CdpError(f"Runtime.evaluate failed: {resp['error']}")
            return resp.get("result", {}).get("result", {}).get("value")
        finally:
            sock.close()

    def navigate_and_get_text(self, tab_id: str, url: str, wait: int = 7, retries: int = 2) -> str:
        last_error: Optional[Exception] = None
        for attempt in range(1, retries + 2):
            try:
                sock = self.connect(tab_id)
                try:
                    self._ws_send(sock, {"id": 1, "method": "Page.navigate", "params": {"url": url}})
                    resp = self._ws_recv(sock, timeout=10)
                    if not resp or "error" in resp:
                        raise CdpError(f"Navigate failed: {resp}")
                    time.sleep(wait)
                    self._ws_send(
                        sock,
                        {
                            "id": 2,
                            "method": "Runtime.evaluate",
                            "params": {"expression": "document.body.innerText"},
                        },
                    )
                    resp = self._ws_recv(sock, timeout=15)
                    if not resp:
                        raise CdpError("No response to body text evaluate")
                    text = resp.get("result", {}).get("result", {}).get("value", "")
                    if not text:
                        raise CdpError("Empty page text returned")
                    return text
                finally:
                    sock.close()
            except Exception as exc:
                last_error = exc
                time.sleep(min(attempt, 3))
        raise CdpError(str(last_error) if last_error else "Unknown CDP error")
