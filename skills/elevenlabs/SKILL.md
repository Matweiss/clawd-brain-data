# ElevenLabs TTS Skill

Generate natural-sounding voice messages using ElevenLabs text-to-speech API.

## When to Use

- Mat asks you to "say" something or send a voice message
- Storytelling, movie summaries, or "storytime" moments
- Creative/funny voice messages
- Leaving proactive voice updates or reminders

## How It Works

1. Call `tts.sh` with text input
2. Script hits ElevenLabs API with configured voice
3. Returns audio file path
4. Use `message` tool with `action=send`, `media=<path>`, `asVoice=true`

## Usage

```bash
# Generate TTS audio
./tts.sh "Your message text here"
# Returns: /tmp/elevenlabs_<timestamp>.mp3

# Send via Telegram
message action=send channel=telegram target=<chat> media=<path> asVoice=true
```

## Voice Selection

Default voice: **Adam** (deep, warm, engaging)

Other voices available:
- **Nicole** - warm, conversational female
- **Clyde** - medium male, professional
- **Bella** - soft, friendly female

To change voice, edit `VOICE_ID` in `tts.sh`.

## Notes

- Keep messages under 2500 characters (API limit)
- Audio delivered as voice message on Telegram (blue waveform UI)
- Works great for: stories, summaries, jokes, dramatic readings
- API key stored in script (not in gateway config)

## Cost

~$0.30 per 1000 characters. Budget accordingly.
