#!/bin/bash
# ElevenLabs TTS Generator
# Usage: ./tts.sh "Text to speak"

set -euo pipefail

# Configuration
API_KEY="sk_20b35cd432e741e8f93429c78241d7d0d963810c22f27aaf"
VOICE_ID="IKne3meq5aSn9XLyUdCD"  # Charlie - Deep, Confident, Energetic
MODEL="eleven_turbo_v2_5"
OUTPUT_DIR="/tmp"

# Input validation
if [ $# -eq 0 ]; then
    echo "Error: No text provided" >&2
    echo "Usage: $0 \"Text to speak\"" >&2
    exit 1
fi

TEXT="$1"
OUTPUT_FILE="${OUTPUT_DIR}/elevenlabs_$(date +%s).mp3"

# Generate TTS
curl -s -X POST \
  "https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}" \
  -H "xi-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"text\": \"${TEXT}\",
    \"model_id\": \"${MODEL}\",
    \"voice_settings\": {
      \"stability\": 0.5,
      \"similarity_boost\": 0.75,
      \"style\": 0.0,
      \"use_speaker_boost\": true
    }
  }" \
  --output "${OUTPUT_FILE}"

# Verify output
if [ ! -s "${OUTPUT_FILE}" ]; then
    echo "Error: Audio generation failed" >&2
    exit 1
fi

# Return path
echo "${OUTPUT_FILE}"
