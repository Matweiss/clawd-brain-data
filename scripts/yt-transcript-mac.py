#!/usr/bin/env python3
"""
YouTube Transcript Fetcher
Run on Mac node (residential IP, not blocked by YouTube)
Usage: python3 yt-transcript-mac.py <video_id_or_url>
Output: plain transcript text to stdout
"""
import sys
import re
import subprocess

def install_dep():
    subprocess.run(
        [sys.executable, "-m", "pip", "install", "youtube-transcript-api", "-q"],
        capture_output=True
    )

def extract_id(url_or_id):
    patterns = [
        r'(?:v=|youtu\.be/|embed/)([a-zA-Z0-9_-]{11})',
        r'^([a-zA-Z0-9_-]{11})$'
    ]
    for p in patterns:
        m = re.search(p, url_or_id)
        if m:
            return m.group(1)
    return None

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 yt-transcript-mac.py <youtube_url_or_id>", file=sys.stderr)
        sys.exit(1)

    install_dep()

    from youtube_transcript_api import YouTubeTranscriptApi

    vid = extract_id(sys.argv[1])
    if not vid:
        print(f"ERROR: Could not parse video ID from: {sys.argv[1]}", file=sys.stderr)
        sys.exit(1)

    api = YouTubeTranscriptApi()
    transcript = api.fetch(vid)
    text = " ".join([t.text for t in transcript])
    print(text)

if __name__ == "__main__":
    main()
