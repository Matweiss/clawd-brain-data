#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <file> [--language <code>]" >&2
  exit 2
fi

FILE="$1"
shift || true

LANG_ARG=()
if [[ "${1:-}" == "--language" ]]; then
  if [[ -z "${2:-}" ]]; then
    echo "Missing language code after --language" >&2
    exit 2
  fi
  LANG_ARG=( -F "language=$2" )
fi

if [[ ! -f "$FILE" ]]; then
  echo "File not found: $FILE" >&2
  exit 2
fi

if [[ -z "${GROQ_API_KEY:-}" ]]; then
  echo "GROQ_API_KEY is not set" >&2
  exit 2
fi

RESP=$(curl -sS -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "https://api.groq.com/openai/v1/audio/transcriptions" \
  -H "Authorization: Bearer ${GROQ_API_KEY}" \
  -F "file=@${FILE}" \
  -F "model=whisper-large-v3-turbo" \
  -F "response_format=json" \
  "${LANG_ARG[@]}"
)

BODY="${RESP%HTTP_STATUS:*}"
STATUS="${RESP##*HTTP_STATUS:}"

if [[ "$STATUS" != "200" ]]; then
  echo "Groq transcription failed (HTTP $STATUS)" >&2
  echo "$BODY" >&2
  exit 1
fi

# Extract .text with python (available in this environment)
python3 - <<'PY' "$BODY"
import json,sys
raw=sys.argv[1]
try:
    data=json.loads(raw)
    print((data.get('text') or '').strip())
except Exception:
    print(raw.strip())
PY
