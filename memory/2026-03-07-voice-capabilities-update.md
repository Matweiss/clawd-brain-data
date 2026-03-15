---
title: "Voice Capabilities Update - TTS Tools Available"
date: 2026-03-07T08:00:00-08:00
type: memory
tags: [tools, voice, tts, elevenlabs, grok, capabilities]
author: Mat
---

# Voice Capabilities Update

## Current TTS (Text-to-Speech) Tools Available

### 1. Grok TTS
- **Status:** ✅ Active and working
- **API Key:** Configured in environment
- **Use case:** Voice responses, audio notifications
- **Quality:** Good for quick responses

### 2. ElevenLabs TTS
- **Status:** ✅ Active and working
- **API Key:** sk_9850ff336cc0997b0a50da9a4c6f2020d332a944c4130887
- **Use case:** High-quality voice generation, storytelling, professional audio
- **Quality:** Premium - best for extended content

### 3. Minimax TTS
- **Status:** ❌ Not working (Error 2049 - invalid API key)
- **Issue:** Both keys invalid, may need account upgrade or new endpoint
- **Action needed:** If Minimax needed, investigate account status

## Speech-to-Text (Transcription)

### Groq Whisper
- **Status:** ✅ Working via direct API calls
- **Model:** whisper-large-v3
- **Use case:** Transcribing voice messages (like Mat's audio notes)
- **How to use:** 
  ```bash
  curl -X POST https://api.groq.com/openai/v1/audio/transcriptions \
    -H "Authorization: Bearer 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" \
    -F "file=@audio.ogg" \
    -F "model=whisper-large-v3"
  ```
- **Note:** Not yet integrated as a native tool - requires manual API call

## Tools Created

### Transcription Script
**Location:** `/root/.openclaw/workspace/scripts/transcribe.sh`

**Usage:**
```bash
/root/.openclaw/workspace/scripts/transcribe.sh audio_file.ogg
```

**How it works:**
- Takes audio file (OGG, MP3, etc.)
- Sends to Groq Whisper API
- Returns transcribed text

## When to Use Which Tool

| Use Case | Recommended Tool | Why |
|----------|------------------|-----|
| Quick voice responses | Grok TTS | Fast, simple |
| High-quality storytelling | ElevenLabs | Best voice quality |
| Transcribing voice messages | Groq Whisper | Accurate, fast |
| Pro audio content | ElevenLabs | Most natural sounding |

## Integration Notes

**Not yet integrated into Mission Control dashboard:**
- Voice input (microphone recording)
- One-click transcription button
- Voice message playback in UI

**To add these features:**
- Would need browser microphone access
- WebRTC or MediaRecorder API
- Frontend UI components

## Recent Usage

**March 7, 2026:**
- Successfully transcribed Mat's voice messages about Lucra ICP
- Used to clarify that Lucra targets entertainment venues (Puttshack, Popstroke, F1) not just casinos
- Enabled faster communication when typing isn't convenient

## Future Enhancements

**Potential additions:**
1. Voice-to-Memory feature (record → transcribe → save as .md)
2. Voice commands for Mission Control ("Show me today's meetings")
3. Audio notes for sales calls (record → transcribe → save to deal notes)

## Related Files

- Script: `/root/.openclaw/workspace/scripts/transcribe.sh`
- API Config: `TOOLS.md`
- Usage examples: See conversation history March 7, 2026

---
*Last updated: March 7, 2026*
*By: Mat (via voice message transcription)*
