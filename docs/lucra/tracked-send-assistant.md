# Lucra Tracked-Send Assistant

First shippable path for "track every email I send" — without pasting pixels by hand.

You compose through the tool; it bakes a unique open-tracking pixel into the HTML
body and drops the message in your Lucra **Drafts** (default) or **sends** it
(`--send`). You review in Gmail and hit Send. Opens then alert via the existing
[open tracker](./sent-email-open-notification-tool.md) (Telegram + `opens.jsonl`).

> **Why drafts, not your normal Send button?** Gmail exposes no hook to silently
> inject a pixel into a message you type in the Gmail UI. So the practical v1 is:
> build the tracked message here, review, send. The pixel is invisible and automatic.

- Script: `scripts/lucra-tracked-send.py`
- Account: `mat.weiss@lucrasports.com` (via `gog`)
- Pixel host: `https://lucra-open-tracker.thematweiss.com`
- Shares the tracker's token store + pixel markup (single source of truth).

## Quick start

```bash
# 1) Put your message in a text file (plain text is fine — auto-converted to HTML)
printf 'Hi Jane,\n\nGreat connecting at the PGA show...\n\nBest,\nMat' > /tmp/note.txt

# 2) Build a tracked DRAFT to one external prospect (default: draft, no send)
scripts/lucra-tracked-send.py \
  --to jane@acmegolf.com --company "Acme Golf" \
  --subject "Lucra follow-up" --body-file /tmp/note.txt

# 3) Open Gmail Drafts in mat.weiss@lucrasports.com, review, hit Send.
```

## Common commands

Send immediately instead of drafting:
```bash
scripts/lucra-tracked-send.py --to jane@acmegolf.com --subject "..." \
  --body-file /tmp/note.txt --send
```

Body is already HTML:
```bash
scripts/lucra-tracked-send.py --to jane@acmegolf.com --subject "..." \
  --html-body-file /tmp/note.html
# or inline:
scripts/lucra-tracked-send.py --to jane@acmegolf.com --subject "..." \
  --html-body "<p>Hi Jane,</p><p>...</p>"
```

Inline plain-text body (no file):
```bash
scripts/lucra-tracked-send.py --to jane@acmegolf.com --subject "..." \
  --body "Hi Jane, ..."
```

Multiple external recipients — **requires `--split-external`** (one individualized
draft/send per recipient so opens are attributable). CC/BCC are dropped on splits to
keep attribution clean:
```bash
scripts/lucra-tracked-send.py --to jane@acmegolf.com,bob@othergolf.com \
  --subject "..." --body-file /tmp/note.txt --split-external
```

Preview without minting tokens or calling gog:
```bash
scripts/lucra-tracked-send.py --to jane@acmegolf.com --subject "..." \
  --body-file /tmp/note.txt --dry-run
```

Validate the exact gog command (mints a token, gog validates but creates nothing):
```bash
scripts/lucra-tracked-send.py --to jane@acmegolf.com --subject "..." \
  --body-file /tmp/note.txt --gog-dry-run
```

Run behavior checks:
```bash
scripts/lucra-tracked-send.py self-test
```

## Guardrails (automatic)

By default these recipients are **not** tracked (no pixel minted for them):

- Internal domains: `@lucrasports.com`, `@playlucra.com`
- Mat's own accounts: `mat.weiss@lucrasports.com`, `mat@playlucra.com`,
  `thematweiss@gmail.com`, `lucrasports@gmail.com`, `sarahmat0816@gmail.com`
- System/no-reply local-parts: `noreply`, `no-reply`, `donotreply`,
  `mailer-daemon`, `postmaster`, `bounce(s)`, `notifications`, `calendar-notification`

Overrides:
- `--track-internal` — track internal/noisy recipients anyway (used for self-tests).
- `--split-external` — individualize a multi-recipient send for attribution.
- `--allow-shared-tracking` — one shared pixel across multiple externals; **opens
  cannot be attributed to a specific person** (only "someone opened").

If every recipient is filtered out by guardrails, the tool refuses and tells you to
use `--track-internal`.

## Attribution rule

One unique token = one recipient. A single shared pixel can only tell you "someone
opened," never *who*. That's why 2+ trackable recipients require `--split-external`
(or the explicit, ambiguous `--allow-shared-tracking`).

## Flags reference

| Flag | Purpose |
|------|---------|
| `--to` / `--cc` / `--bcc` | Recipients (comma-separated). Display names like `Jane <jane@x.com>` are parsed. |
| `--subject` | Subject (required) |
| `--body-file` | Plain-text body file (auto-converted to HTML) |
| `--html-body-file` | Body file already in HTML |
| `--body` / `--html-body` | Inline plain / HTML body |
| `--company` / `--campaign` / `--notes` | Token metadata for the opens log |
| `--send` | Actually send (default: draft only) |
| `--split-external` | One individualized draft/send per external recipient |
| `--track-internal` | Track internal/noisy recipients too |
| `--allow-shared-tracking` | Allow one shared pixel for multiple externals (ambiguous) |
| `--base-url` | Pixel host (default `https://lucra-open-tracker.thematweiss.com`) |
| `--dry-run` | Plan only; no token, no gog call |
| `--gog-dry-run` | Mint token + run gog in its own `--dry-run` (validates, creates nothing) |

## Limitations (v1)

- Sends multipart/alternative: an HTML part (with the tracking pixel) plus an
  auto-derived plain-text part for deliverability. The pixel is HTML-only by design.
- Does not modify normal Gmail UI sends — those remain untracked unless composed here.
- Open signals are best-effort: Gmail/clients proxy images; scanners may preload.
  See the [open tracker noise caveats](./sent-email-open-notification-tool.md#noise-caveats).
- `--split-external` drops CC/BCC on each individualized message by design.
