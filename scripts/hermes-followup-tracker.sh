#!/bin/bash
# hermes-followup-tracker.sh
# Scans Mat's Sent folder for emails sent >3 days ago with no reply received
# Flags unanswered threads and pre-generates nudge drafts
# Part of the Hermes Auto Follow-Up Tracker system

export GOG_KEYRING_PASSWORD="clawd"
ACCOUNT="thematweiss@gmail.com"
STATE_FILE="/root/.openclaw/workspace/memory/followup-tracker-state.json"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

echo "🔍 Hermes Follow-Up Tracker — $(date -u '+%Y-%m-%d %H:%M UTC')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Ensure memory directory exists
mkdir -p /root/.openclaw/workspace/memory

# Date range: sent 3-10 days ago
DATE_FROM=$(date -d '10 days ago' +%Y/%m/%d)
DATE_TO=$(date -d '3 days ago' +%Y/%m/%d)

echo "📅 Scanning sent emails: $DATE_FROM → $DATE_TO"
echo ""

# Fetch sent emails in the window, save to temp file
TMPFILE=$(mktemp /tmp/hermes-sent-XXXXXX.json)
gog gmail messages search "in:sent after:$DATE_FROM before:$DATE_TO" \
  --account "$ACCOUNT" --max 20 --json 2>/dev/null > "$TMPFILE"

TOTAL_SENT=$(python3 -c "
import json
with open('$TMPFILE') as f:
    data = json.load(f)
msgs = data.get('messages') or []
print(len(msgs))
" 2>/dev/null || echo "0")

echo "📤 Found $TOTAL_SENT sent emails in window"

if [ "$TOTAL_SENT" -eq 0 ]; then
  echo "✅ No sent emails found in the 3-10 day window. Nothing to track."
  python3 -c "
import json
state = {'lastRun': '$TIMESTAMP', 'pendingFollowups': []}
with open('$STATE_FILE', 'w') as f:
    json.dump(state, f, indent=2)
print('💾 State saved.')
"
  rm -f "$TMPFILE"
  exit 0
fi

echo ""

# Run the main analysis
python3 << PYEOF
import json, subprocess, datetime, re, os, sys

with open('$TMPFILE') as f:
    data = json.load(f)
messages = data.get('messages') or []

followups = []
mat_email = 'thematweiss@gmail.com'
account = '$ACCOUNT'
password = 'clawd'
env = {**os.environ, 'GOG_KEYRING_PASSWORD': password}

SKIP_PATTERNS = [
    'noreply', 'no-reply', 'donotreply', 'do-not-reply',
    'newsletter', 'notifications@', 'unsubscribe',
    'automated', 'mailer-daemon', 'postmaster',
    'bounce', 'support@', 'info@', 'updates@'
]

AUTO_SUBJECTS = [
    'out of office', 'automatic reply', 'unsubscribe',
    'receipt', 'order confirmation', 'invoice',
    'verify your', 'verification', 'your password',
    'your account', 'welcome to', 'reset your'
]

def is_auto_email(subject, recipient):
    subject_lower = subject.lower()
    recipient_lower = recipient.lower()
    for p in AUTO_SUBJECTS:
        if p in subject_lower:
            return True
    for p in SKIP_PATTERNS:
        if p in recipient_lower:
            return True
    return False

def get_first_name(addr):
    m = re.match(r'^([A-Za-z\'-]+)', addr.strip())
    if m and '@' not in m.group(1):
        return m.group(1)
    m2 = re.search(r'([a-zA-Z]+)@', addr)
    if m2:
        return m2.group(1).capitalize()
    return 'there'

def run_gog(args, timeout=20):
    try:
        result = subprocess.run(
            ['gog'] + args,
            capture_output=True, text=True, env=env, timeout=timeout
        )
        return json.loads(result.stdout)
    except Exception:
        return {}

processed_threads = set()

for msg in messages:
    msg_id = msg.get('id', '')
    thread_id = msg.get('threadId', '')
    subject = msg.get('subject', '(no subject)')
    sent_date_str = msg.get('date', '')

    if thread_id in processed_threads:
        continue
    processed_threads.add(thread_id)

    # Get To: header
    detail = run_gog(['gmail', 'get', msg_id, '--account', account, '--format', 'metadata', '--json'])
    sent_to = detail.get('headers', {}).get('to', '(unknown)')

    # Skip auto-generated emails
    if is_auto_email(subject, sent_to):
        print(f'  ⏭️  Skipping system/auto: {subject[:60]}')
        sys.stdout.flush()
        continue

    # Check for replies from others in the thread
    has_reply = False
    reply_data = run_gog([
        'gmail', 'messages', 'search',
        f'thread:{thread_id} -from:{mat_email} in:anywhere',
        '--account', account, '--max', '5', '--json'
    ])
    replies = reply_data.get('messages') or []
    if replies:
        has_reply = True

    if not has_reply:
        try:
            sent_dt = datetime.datetime.strptime(sent_date_str[:16], '%Y-%m-%d %H:%M')
            days_ago = (datetime.datetime.utcnow() - sent_dt).days
        except Exception:
            days_ago = 4

        recipient_name = get_first_name(sent_to)
        clean_subject = re.sub(r'^(Re:|Fwd?:)\s*', '', subject, flags=re.IGNORECASE).strip()
        nudge = f'Hey {recipient_name}, just wanted to follow up on "{clean_subject}" — still on your radar?'

        followup = {
            'threadId': thread_id,
            'messageId': msg_id,
            'subject': subject,
            'sentTo': sent_to,
            'sentDate': sent_date_str,
            'daysAgo': days_ago,
            'suggestedNudge': nudge
        }
        followups.append(followup)
        print(f'  ❗ No reply: [{subject[:60]}]')
        print(f'     → To: {sent_to[:50]} ({days_ago}d ago)')
        sys.stdout.flush()
    else:
        print(f'  ✅ Has reply: [{subject[:60]}]')
        sys.stdout.flush()

# Save state
state = {'lastRun': '$TIMESTAMP', 'pendingFollowups': followups}
with open('$STATE_FILE', 'w') as f:
    json.dump(state, f, indent=2)

print()
print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
print()

if not followups:
    print('✅ No follow-ups needed — all sent emails have received replies!')
else:
    print(f'⏰ Follow-up needed ({len(followups)} thread(s)):')
    print()
    for item in followups:
        days = item.get('daysAgo', '?')
        subject = item.get('subject', '(no subject)')
        sent_to = item.get('sentTo', '(unknown)')
        nudge = item.get('suggestedNudge', '')
        sent_date = item.get('sentDate', '?')

        m = re.match(r'^([A-Za-z\'-]+)', sent_to.strip())
        name = m.group(1) if m and '@' not in m.group(1) else (sent_to.split('@')[0] if '@' in sent_to else sent_to)

        print(f'→ {name} re: {subject}')
        print(f'  Sent: {sent_date} ({days} days ago), no reply')
        print(f'  Draft: "{nudge}"')
        print()

print()
print(f'💾 State saved → {len(followups)} pending follow-up(s).')
PYEOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Follow-up tracker complete."

rm -f "$TMPFILE"
