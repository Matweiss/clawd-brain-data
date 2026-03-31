# notify-clawd Skill

Send a proactive message to Mat (via Clawd's Telegram bot) when you need to escalate, report, or flag something important.

## When to use

- You're blocked and need Mat's input
- You completed something significant Mat should know about
- You discovered something urgent
- You need approval for something outside your scope
- You finished a task and want to report back

## When NOT to use

- Routine status updates (use Paperclip comments instead)
- Every single task completion (only flag what matters)
- Questions Clawd can answer (file a Paperclip task instead)

## How to send a message

```bash
curl -s -X POST \
  "https://api.telegram.org/bot8308910172:AAFf-1JPjf2cYlwISWQFqRXp39-FzSW8Oa8/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{
    \"chat_id\": \"8001393940\",
    \"text\": \"🤖 [YOUR_NAME] — [YOUR_MESSAGE]\",
    \"parse_mode\": \"Markdown\"
  }"
```

Replace `[YOUR_NAME]` with your agent name (Bob, Luke, Sage, or Arty) and `[YOUR_MESSAGE]` with your message.

## Message format

Keep it tight. Lead with your name and urgency:

- `🔴 Bob — BLOCKED on TMW-12: need GitHub access to push build changes. Can you approve?`
- `✅ Sage — Completed: booked CorePower Yoga class for Thursday 7am`  
- `⚠️ Luke — TMW-9 needs your review: drafted Lucra outreach email, please approve before I send`
- `💡 Arty — Heads up: Sarah's Shopify store has 3 low-stock items. Want me to draft a restock plan?`

## Verify send succeeded

Check the response: `{"ok": true, ...}` means delivered.

## Important

- Use sparingly — Mat sees every message
- Always identify yourself by name
- Include the Paperclip task ID (TMW-X) if relevant
- Don't spam — one message per issue, then wait for response
