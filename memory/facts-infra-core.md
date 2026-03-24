# Infrastructure Core Facts

## Identity and Time
- Name: Mat Weiss
- Timezone: Los Angeles (PT)

## GitHub Repos (private)
- Matweiss/clawd-brain-data
- Matweiss/clawd-dashboard
- Matweiss/clawd-command-center

## Dashboard
- URL: https://clawd-dashboard-eight.vercel.app
- GitHub: https://github.com/Matweiss/clawd-dashboard
- Current issue: update from HubSpot to Google Sheets API

## CRM
- Google Sheets replaced HubSpot in March 2026
- Sheet name: Mat's Pipeline
- Columns: Company, Stage, Amount, Close Date, Last Contact, Notes, Next Action

## Voice
### TTS
- Grok: active
- ElevenLabs: active
- Minimax: broken

### STT
- Groq Whisper: working
- Script: `/root/.openclaw/workspace/scripts/transcribe.sh`

## Browser Coworking
- VPS OpenClaw gateway + Mac node host routing works
- Mac extension relay auth uses Mac-local gateway token
- Node host connection to VPS uses VPS gateway token
- `openclaw nodes status` is the go/no-go browser-capable node check
