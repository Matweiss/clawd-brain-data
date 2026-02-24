# Whisper Audio Transcription Setup

**Date:** 2026-02-15
**Status:** ✅ Active

## Configuration

- **API Key:** Groq API key configured
- **Provider:** Groq (https://api.groq.com)
- **Model:** whisper-large-v3
- **Key Location:** Gateway config (GROQ_API_KEY)
- **Script Location:** `/home/node/openclaw/scripts/transcribe.py`
- **Skill Docs:** `/home/node/openclaw/skills/whisper/SKILL.md`

## Usage

### Command Line
```bash
python3 /home/node/openclaw/scripts/transcribe.py /path/to/audio.mp3 [language]
```

Example:
```bash
python3 /home/node/openclaw/scripts/transcribe.py meeting.mp3 en
```

### Python API
```python
from scripts.transcribe import transcribe

result = transcribe("meeting.mp3", language="en")
print(result["text"])
```

## Features

- Ultra-fast transcription via Groq's optimized inference
- Support for 15+ audio formats (mp3, wav, m4a, ogg, etc.)
- Language specification (optional)
- Max file size: 25MB
- Max duration: ~2 hours
- Same quality as OpenAI's native Whisper API
- ~$0.06 per 10 minutes of audio

## Supported Formats

mp3, mp4, mpeg, mpga, m4a, wav, webm, ogg, flac, aac, wma, aiff, opus

## Notes

- Much faster than OpenAI's official API
- Same accuracy (whisper-large-v3 model)
- Can be used for: meeting transcripts, voice memos, sales calls, etc.
