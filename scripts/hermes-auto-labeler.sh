#!/usr/bin/env bash
# =============================================================================
# hermes-auto-labeler.sh
# Hermes Gmail Auto-Labeler — classifies and labels recent unread emails
# =============================================================================
# Usage: GOG_KEYRING_PASSWORD=clawd ./scripts/hermes-auto-labeler.sh
# =============================================================================

set -euo pipefail

ACCOUNT="thematweiss@gmail.com"
STATE_FILE="$(dirname "$0")/../shared/hermes-agent/labeler-state.json"
MAX_MESSAGES=50

# Label display names
LABEL_ACTION="📌 Action Required"
LABEL_FYI="👀 FYI"
LABEL_FINANCE="💰 Finance/Receipts"
LABEL_NEWSLETTER="📰 Newsletter"
LABEL_VIP="🌟 VIP"
LABEL_JUNK="🗑 Junk"

# Runtime label ID map (populated by ensure_labels)
declare -A LABEL_IDS

# Counters
COUNT_ACTION=0
COUNT_FYI=0
COUNT_FINANCE=0
COUNT_NEWSLETTER=0
COUNT_VIP=0
COUNT_JUNK=0
COUNT_ALREADY_LABELED=0
COUNT_ERRORS=0

log() { echo "[$(date '+%H:%M:%S')] $*" >&2; }
log_info() { echo "[INFO] $*"; }

# =============================================================================
# ensure_labels — create labels that don't exist yet, populate LABEL_IDS map
# =============================================================================
ensure_labels() {
  log "Fetching existing labels..."
  local existing_json
  existing_json=$(GOG_KEYRING_PASSWORD="${GOG_KEYRING_PASSWORD:-clawd}" \
    gog gmail labels list --account "$ACCOUNT" --json 2>/dev/null)

  local all_labels=("$LABEL_ACTION" "$LABEL_FYI" "$LABEL_FINANCE" "$LABEL_NEWSLETTER" "$LABEL_VIP" "$LABEL_JUNK")

  for label_name in "${all_labels[@]}"; do
    # Check if label already exists
    local existing_id
    existing_id=$(echo "$existing_json" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for l in data.get('labels', []):
    if l['name'] == '''$label_name''':
        print(l['id'])
        break
" 2>/dev/null || true)

    if [[ -n "$existing_id" ]]; then
      log "  ✓ Label exists: $label_name ($existing_id)"
      LABEL_IDS["$label_name"]="$existing_id"
    else
      log "  + Creating label: $label_name"
      local create_result
      create_result=$(GOG_KEYRING_PASSWORD="${GOG_KEYRING_PASSWORD:-clawd}" \
        gog gmail labels create "$label_name" --account "$ACCOUNT" --json 2>/dev/null)
      local new_id
      new_id=$(echo "$create_result" | python3 -c "
import json, sys
data = json.load(sys.stdin)
# gog returns {'label': {...}} wrapper
label_data = data.get('label', data)
print(label_data.get('id', ''))
" 2>/dev/null || true)
      if [[ -n "$new_id" ]]; then
        log "  ✓ Created: $label_name ($new_id)"
        LABEL_IDS["$label_name"]="$new_id"
      else
        log "  ✗ Failed to create label: $label_name"
        log "    Response: $create_result"
      fi
    fi
  done
}

# =============================================================================
# classify_message — returns label name based on heuristics
# Input: from_addr, subject, snippet, has_unsubscribe (0/1)
# =============================================================================
classify_message() {
  local from_addr="$1"
  local subject="$2"
  local snippet="$3"
  local has_unsubscribe="$4"

  local from_lower subject_lower snippet_lower combined
  from_lower=$(echo "$from_addr" | tr '[:upper:]' '[:lower:]')
  subject_lower=$(echo "$subject" | tr '[:upper:]' '[:lower:]')
  snippet_lower=$(echo "$snippet" | tr '[:upper:]' '[:lower:]')
  combined="$from_lower $subject_lower $snippet_lower"

  # ---- 🌟 VIP (highest priority) ----
  if echo "$from_lower" | grep -qiE '@lucrasports\.com'; then
    echo "$LABEL_VIP"; return
  fi
  # Sender name contains Brian/Dylan/Michael/Amber (before the <email> part)
  local sender_name
  sender_name=$(echo "$from_addr" | sed 's/<[^>]*>//' | tr '[:upper:]' '[:lower:]')
  if echo "$sender_name" | grep -qiE '\b(brian|dylan|michael|amber)\b'; then
    echo "$LABEL_VIP"; return
  fi
  # Subject keywords
  if echo "$subject_lower" | grep -qiE '\b(offer|contract|deal|urgent|signing)\b'; then
    echo "$LABEL_VIP"; return
  fi

  # ---- 💰 Finance/Receipts ----
  if echo "$combined" | grep -qiE '(receipt|invoice|statement|payment|transaction|your order|subscription|billing|bank alert|chase|amex|venmo|paypal|stripe|quickbooks|order confirmation|order shipped|your receipt|order #|invoice #)'; then
    echo "$LABEL_FINANCE"; return
  fi

  # ---- 📰 Newsletter ----
  if [[ "$has_unsubscribe" == "1" ]]; then
    # Has List-Unsubscribe header → newsletter/marketing
    # But don't override Finance for legit financial emails
    echo "$LABEL_NEWSLETTER"; return
  fi
  if echo "$from_lower" | grep -qiE '(newsletter|noreply|no-reply|marketing|hello@|info@|updates@|digest|weekly|monthly|notifications@|alert@|donotreply|do-not-reply)'; then
    echo "$LABEL_NEWSLETTER"; return
  fi
  if echo "$subject_lower" | grep -qiE '(unsubscribe|weekly digest|monthly update|weekly update|newsletter|your weekly|your monthly)'; then
    echo "$LABEL_NEWSLETTER"; return
  fi

  # ---- 🗑 Junk ----
  # Social media notifications
  if echo "$combined" | grep -qiE '(linkedin|twitter\.com|x\.com|facebook\.com|instagram|tiktok|pinterest)'; then
    # Check if it's a direct message notification vs just a social platform email
    if echo "$combined" | grep -qiE '(notification|alert|activity|mentioned you|connected with|viewed your|endorsed|commented|reaction|liked your|new follower)'; then
      echo "$LABEL_JUNK"; return
    fi
  fi
  # Shipping/order notifications from retailers
  if echo "$subject_lower" | grep -qiE '(has shipped|shipment|tracking number|out for delivery|delivered|your package|order shipped|estimated delivery)'; then
    echo "$LABEL_JUNK"; return
  fi
  # Generic noreply from unknown/unrecognized domains that aren't finance/newsletter
  if echo "$from_lower" | grep -qiE '^(noreply|no-reply|donotreply|do-not-reply|notifications|alerts|system|mailer-daemon|bounce)@' ; then
    echo "$LABEL_JUNK"; return
  fi

  # ---- 📌 Action Required ----
  # Contains question marks in subject
  if echo "$subject" | grep -q '?'; then
    echo "$LABEL_ACTION"; return
  fi
  if echo "$snippet" | grep -q '?'; then
    # Only flag as action if body also has action keywords
    if echo "$combined" | grep -qiE '(action required|please review|approval needed|response needed|follow.?up|rsvp|deadline|due date|confirm|schedule|can you|could you|would you|let me know|please respond|please reply|awaiting your|need your|your input|your feedback|by eod|by end of day|by tomorrow|asap)'; then
      echo "$LABEL_ACTION"; return
    fi
  fi
  if echo "$subject_lower" | grep -qiE '(action required|please review|approval needed|response needed|follow.?up|rsvp|deadline|due date|your signature|sign.*document|docusign|hellosign|please confirm|please schedule)'; then
    echo "$LABEL_ACTION"; return
  fi
  if echo "$snippet_lower" | grep -qiE '(action required|please review|approval needed|response needed|follow up|rsvp|deadline|due date|can you|could you|would you|let me know|please respond|please reply)'; then
    echo "$LABEL_ACTION"; return
  fi

  # ---- 👀 FYI (default) ----
  echo "$LABEL_FYI"
}

# =============================================================================
# apply_label — apply a label to a message ID
# =============================================================================
apply_label() {
  local msg_id="$1"
  local label_name="$2"
  local label_id="${LABEL_IDS[$label_name]:-}"

  if [[ -z "$label_id" ]]; then
    log "  ✗ No ID for label '$label_name', skipping message $msg_id"
    ((COUNT_ERRORS++)) || true
    return
  fi

  local result
  result=$(GOG_KEYRING_PASSWORD="${GOG_KEYRING_PASSWORD:-clawd}" \
    gog gmail batch modify "$msg_id" \
    --add "$label_id" \
    --account "$ACCOUNT" \
    --json 2>&1) || true

  if echo "$result" | grep -qi '"error"'; then
    log "  ✗ Error applying label to $msg_id: $result"
    ((COUNT_ERRORS++)) || true
  fi
}

# =============================================================================
# check_has_unsubscribe — fetch message metadata to check List-Unsubscribe
# =============================================================================
check_has_unsubscribe() {
  local msg_id="$1"
  local meta
  meta=$(GOG_KEYRING_PASSWORD="${GOG_KEYRING_PASSWORD:-clawd}" \
    gog gmail get "$msg_id" \
    --account "$ACCOUNT" \
    --json \
    --format metadata \
    --headers "List-Unsubscribe" 2>/dev/null) || true

  if echo "$meta" | grep -qi '"List-Unsubscribe"'; then
    echo "1"
  else
    echo "0"
  fi
}

# =============================================================================
# already_has_labeler_label — check if message already has one of our labels
# =============================================================================
already_has_labeler_label() {
  local labels_json="$1"
  for label_id in "${LABEL_IDS[@]}"; do
    if echo "$labels_json" | grep -q "\"$label_id\""; then
      return 0
    fi
  done
  return 1
}

# =============================================================================
# save_state — write labeler-state.json
# =============================================================================
save_state() {
  local ts
  ts=$(date -u +%s)
  mkdir -p "$(dirname "$STATE_FILE")"

  python3 -c "
import json

label_ids = {
$(for key in "${!LABEL_IDS[@]}"; do
  echo "    '${key}': '${LABEL_IDS[$key]}',"
done)
}

state = {
    'lastRun': $ts,
    'lastRunISO': '$(date -u +%Y-%m-%dT%H:%M:%SZ)',
    'account': '$ACCOUNT',
    'stats': {
        'vip': $COUNT_VIP,
        'finance': $COUNT_FINANCE,
        'newsletter': $COUNT_NEWSLETTER,
        'action': $COUNT_ACTION,
        'fyi': $COUNT_FYI,
        'junk': $COUNT_JUNK,
        'alreadyLabeled': $COUNT_ALREADY_LABELED,
        'errors': $COUNT_ERRORS
    },
    'labelIds': label_ids
}

with open('$STATE_FILE', 'w') as f:
    json.dump(state, f, indent=2)
print('State saved.')
"
}

# =============================================================================
# MAIN
# =============================================================================
main() {
  log_info "🚀 Hermes Auto-Labeler starting"
  log_info "Account: $ACCOUNT"
  log_info "Max messages: $MAX_MESSAGES"
  echo ""

  # Step 1: Ensure labels exist
  log "=== Step 1: Ensuring labels exist ==="
  ensure_labels
  echo ""

  # Step 2: Fetch recent unread messages
  log "=== Step 2: Fetching recent unread messages ==="
  local messages_json
  messages_json=$(GOG_KEYRING_PASSWORD="${GOG_KEYRING_PASSWORD:-clawd}" \
    gog gmail messages search "is:unread in:inbox" \
    --account "$ACCOUNT" \
    --json \
    --max "$MAX_MESSAGES" 2>/dev/null)

  local msg_count
  msg_count=$(echo "$messages_json" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(len(data.get('messages', [])))
" 2>/dev/null || echo "0")

  log "Found $msg_count unread messages"
  echo ""

  # Step 3: Classify and label each message
  log "=== Step 3: Classifying messages ==="

  # Parse message list with python
  local msg_data
  msg_data=$(echo "$messages_json" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for m in data.get('messages', []):
    msg_id = m.get('id', '')
    from_addr = m.get('from', '')
    subject = m.get('subject', '')
    labels = json.dumps(m.get('labels', []))
    # Escape for bash: replace | with \| then use | as delimiter
    from_addr_esc = from_addr.replace('|', '\\\\|')
    subject_esc = subject.replace('|', '\\\\|')
    print(f'{msg_id}|{from_addr_esc}|{subject_esc}|{labels}')
" 2>/dev/null || true)

  while IFS='|' read -r msg_id from_addr subject labels_raw; do
    [[ -z "$msg_id" ]] && continue

    log "Processing: [$msg_id] $subject"
    log "  From: $from_addr"

    # Check if already labeled by us
    if already_has_labeler_label "$labels_raw"; then
      log "  → Already labeled, skipping"
      ((COUNT_ALREADY_LABELED++)) || true
      continue
    fi

    # Check for List-Unsubscribe header
    local has_unsub
    has_unsub=$(check_has_unsubscribe "$msg_id")

    # Classify
    local label
    label=$(classify_message "$from_addr" "$subject" "" "$has_unsub")

    log "  → Classified as: $label"

    # Apply label
    apply_label "$msg_id" "$label"

    # Increment counters
    case "$label" in
      "$LABEL_VIP")        ((COUNT_VIP++)) || true ;;
      "$LABEL_FINANCE")    ((COUNT_FINANCE++)) || true ;;
      "$LABEL_NEWSLETTER") ((COUNT_NEWSLETTER++)) || true ;;
      "$LABEL_ACTION")     ((COUNT_ACTION++)) || true ;;
      "$LABEL_FYI")        ((COUNT_FYI++)) || true ;;
      "$LABEL_JUNK")       ((COUNT_JUNK++)) || true ;;
    esac

  done <<< "$msg_data"

  echo ""
  log "=== Step 4: Saving state ==="
  save_state

  echo ""
  log_info "=== ✅ Run Complete ==="
  log_info "📊 Results:"
  log_info "  🌟 VIP:               $COUNT_VIP"
  log_info "  💰 Finance/Receipts:  $COUNT_FINANCE"
  log_info "  📰 Newsletter:        $COUNT_NEWSLETTER"
  log_info "  📌 Action Required:   $COUNT_ACTION"
  log_info "  👀 FYI:               $COUNT_FYI"
  log_info "  🗑  Junk:              $COUNT_JUNK"
  log_info "  ↩  Already labeled:   $COUNT_ALREADY_LABELED"
  log_info "  ✗  Errors:            $COUNT_ERRORS"
  local total=$(( COUNT_VIP + COUNT_FINANCE + COUNT_NEWSLETTER + COUNT_ACTION + COUNT_FYI + COUNT_JUNK ))
  log_info "  📬 Total labeled:     $total"
}

main "$@"
