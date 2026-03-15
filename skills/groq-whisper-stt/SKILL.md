---
name: groq-whisper-stt
description: Transcribe audio/video files to text using Groq Whisper (speech-to-text). Use when user asks to transcribe voice notes, meetings, calls, or media files. Requires GROQ_API_KEY in environment.
---

# Groq Whisper STT

Transcribe local audio/video files via Groq's Whisper-compatible transcription API.

## Preconditions

- `GROQ_API_KEY` must be set in environment.
- File must exist locally and be readable.
- Prefer this for quick transcript extraction from `.mp3`, `.m4a`, `.wav`, `.mp4`, `.mov`, etc.

## Run

```bash
bash skills/groq-whisper-stt/scripts/transcribe.sh /path/to/file
```

Optional language hint:

```bash
bash skills/groq-whisper-stt/scripts/transcribe.sh /path/to/file --language en
```

## Output

- Prints transcription text to stdout.
- Exits non-zero on API/auth/file errors.

## Notes

- Default model: `whisper-large-v3-turbo`
- If user asks for JSON-ish metadata later, extend script with `response_format=verbose_json`.
