#!/usr/bin/env python3
"""Raw CDP fallback for CorePower schedule pages."""

import sys

from cdp_browser import CdpError, RawCdpClient


DEFAULT_URL = "https://www.corepoweryoga.com/yoga-schedules"
PAGE_LOAD_WAIT = 7


def main():
    url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_URL
    explicit_tab_id = sys.argv[2] if len(sys.argv) > 2 else None
    client = RawCdpClient()

    tab_id = explicit_tab_id or client.find_tab("corepoweryoga.com")
    if not tab_id:
        tab_id = client.find_tab(None)
    if not tab_id:
        print("FAILED — no usable Chrome tab found")
        sys.exit(1)

    try:
        text = client.navigate_and_get_text(tab_id, url, wait=PAGE_LOAD_WAIT, retries=2)
    except CdpError as err:
        print(f"Scrape failed: {err}")
        sys.exit(1)

    print(text[:8000])
    if len(text) > 8000:
        print(f"\n[... truncated, total {len(text)} chars]")


if __name__ == "__main__":
    main()
