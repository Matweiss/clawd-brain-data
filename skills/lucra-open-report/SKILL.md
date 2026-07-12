---
name: lucra-open-report
description: Report email opens from the Lucra open-tracker — who opened, how many times, hot leads. Use when Mat asks "who opened / who's engaging / open report." I can see the open log even though I don't get the Telegram pings.
metadata:
  type: tool
---

# lucra-open-report

Read the tracker's open log (I see this even though Telegram pings go to Mat's phone).

## How
Read `memory/lucra-email-open-tracker/opens.jsonl` + `tokens.json`. Count `class=="prospect_open"` per `tokenId`, map tokenId -> recipientEmail/company via tokens.json. Report per-recipient open counts, flag 3+ as HOT, and note bounced addresses (an "open" on a bounced address = mail-system scan, not a human). Ignore `*@example.com` test tokens.
