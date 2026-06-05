---
name: lucra-campaign-send
description: Send or draft a tracked Lucra outbound email (open-pixel + Telegram alerts). Use for any cold/warm outreach to external prospects so every send is tracked. Handles single or batch sends from a sheet row.
metadata:
  type: tool
---

# lucra-campaign-send

Every Lucra outbound goes through the tracker so opens are logged + alerted.

## Single send / draft
`python3 scripts/lucra-tracked-send.py --to <email> --company "<Brand>" --subject "<subj>" --body-file <file>`
- Default = creates a tracked Gmail DRAFT. Add `--send` to send.
- Mints a unique open pixel per recipient; first-open + every-open Telegram alerts; 3+ opens fires a 🔥 HOT LEAD alert (HOT_THRESHOLD).
- Guardrails skip internal/own/no-reply recipients; `--split-external` for multiple recipients.

## Batch (from the Minigame outreach sheet)
For rows with a contact email: pull Email Subject/Draft, replace `{{First}}` with the contact's first name, call the script per row (draft, then send after review). Mark `Email Sent` + `Delivery Status` in the sheet.

## After sending
- Bounces land in mat.weiss@lucrasports.com (DSN from mailer-daemon). Note bounced vs delivered in the sheet's Delivery Status column.
- Opens: `scripts/lucra-email-open-tracker.py opens` or the open-report skill.
