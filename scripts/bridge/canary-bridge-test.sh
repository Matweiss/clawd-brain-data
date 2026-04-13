#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="${WORKSPACE:-/Users/mat/clawd-workspace}"
WRAPPER="${WRAPPER:-$WORKSPACE/scripts/bridge/brief-wrapper.sh}"
ID="canary-$(date -u +%Y%m%d%H%M%S)"
TITLE="Bridge Canary $(date -u +%F-%H%M%S)"

"$WRAPPER" draft "$ID" "$TITLE" clawd low sloan
"$WRAPPER" promote "$ID"
"$WRAPPER" approve "$ID"

echo "Canary brief created and approved: $ID"
echo "Next check: VPS poller should claim it from approved/ into executing/clawd/"
