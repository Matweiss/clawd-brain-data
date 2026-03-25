#!/usr/bin/env python3
"""
YouTube Video Analyzer
Usage: python3 yt-analyze.py <youtube_url_or_id>
"""

import sys
import re
from youtube_transcript_api import YouTubeTranscriptApi

def extract_video_id(url_or_id):
    patterns = [
        r'(?:v=|youtu\.be/|embed/)([a-zA-Z0-9_-]{11})',
        r'^([a-zA-Z0-9_-]{11})$'
    ]
    for pattern in patterns:
        match = re.search(pattern, url_or_id)
        if match:
            return match.group(1)
    return None

def get_transcript(video_id):
    api = YouTubeTranscriptApi()
    try:
        transcript = api.fetch(video_id)
        return ' '.join([t.text for t in transcript])
    except Exception as e:
        return None, str(e)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 yt-analyze.py <youtube_url_or_id>")
        sys.exit(1)

    video_id = extract_video_id(sys.argv[1])
    if not video_id:
        print(f"Could not extract video ID from: {sys.argv[1]}")
        sys.exit(1)

    print(f"Video ID: {video_id}")
    print("Fetching transcript...\n")

    result = get_transcript(video_id)
    if isinstance(result, tuple):
        print(f"Error: {result[1]}")
        sys.exit(1)

    print("=== TRANSCRIPT ===")
    print(result)
    print(f"\n=== STATS ===")
    print(f"Words: {len(result.split())}")
    print(f"Characters: {len(result)}")
