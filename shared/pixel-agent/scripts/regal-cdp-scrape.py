#!/usr/bin/env python3
"""Scrape Regal Sherman Oaks via raw CDP.

Usage:
  python3 regal-cdp-scrape.py <date> [tab_id]
  date format: 04-02-2026
"""

import sys

from cdp_browser import CdpError, RawCdpClient


REGAL_THEATRE_PATH = "/theatres/regal-sherman-oaks-galleria-1483"
REGAL_BASE = "https://www.regmovies.com"
PAGE_LOAD_WAIT = 7


def scrape_date(client: RawCdpClient, tab_id: str, date_str: str):
    url = f"{REGAL_BASE}{REGAL_THEATRE_PATH}?date={date_str}"
    print(f"  Scraping {date_str}...", end=" ", flush=True)
    try:
        text = client.navigate_and_get_text(tab_id, url, wait=PAGE_LOAD_WAIT, retries=2)
    except CdpError as err:
        print(f"ERROR: {err}")
        return None, str(err)
    print(f"{len(text)} chars")
    return text, None


def main():
    if len(sys.argv) < 2:
        print("Usage: regal-cdp-scrape.py <date> [tab_id]")
        print("  date: MM-DD-YYYY (e.g. 04-02-2026)")
        print("  tab_id: optional, auto-detected")
        sys.exit(1)

    date_arg = sys.argv[1]
    explicit_tab_id = sys.argv[2] if len(sys.argv) > 2 else None
    client = RawCdpClient()

    tab_id = explicit_tab_id
    if not tab_id:
        print("Auto-detecting tab...", end=" ")
        tab_id = client.find_tab("regmovies.com")
        if not tab_id:
            print("FAILED — no usable Chrome tab found")
            sys.exit(1)
        print(f"found tab {tab_id}")

    print(f"Scraping Regal for date: {date_arg}")
    text, err = scrape_date(client, tab_id, date_arg)
    if not text:
        print(f"Scrape failed: {err}")
        sys.exit(1)

    print("\n--- PAGE CONTENT ---")
    print(text[:8000])
    if len(text) > 8000:
        print(f"\n[... truncated, total {len(text)} chars]")


if __name__ == "__main__":
    main()
