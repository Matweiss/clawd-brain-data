---
name: yt-summarize
description: Summarize any YouTube video from a link or ID. Fetches the transcript via the Supadata API (works from the VPS — no IP block, no Mac needed) and returns a summary, key takeaways, and any step-by-step/prompts shown. Trigger when Mat shares a YouTube URL or asks to summarize/break down a video.
metadata:
  type: tool
---

# yt-summarize

Fetch a YouTube transcript and summarize it.

## How
1. Run: `python3 scripts/yt-transcript.py "<youtube_url_or_id>" --json`
   - Key lives in `scripts/.secrets/supadata.env` (Supadata, free tier 100/mo).
   - The `content` field is a list of segments — join the `text` fields for the full transcript.
2. Read the full transcript and produce:
   - 2-3 sentence summary of what it teaches
   - Key points / ranked list if it's a tier/list video
   - Any step-by-step instructions, commands, or prompts shown
   - For how-to videos: "is it as easy as a prompt?" — map each step to an action.

## Notes
- 403 "error code 1010" = Cloudflare blocking the default UA; the script already sends a browser UA.
- 429 = free-tier credits exhausted (100/month).
