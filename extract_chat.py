#!/usr/bin/env python3
import re
import json
from datetime import datetime

with open('/root/.openclaw/media/inbound/file_171---a1d0d470-a5ed-4359-a247-e99606a70404', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract all message objects using regex
# Pattern for message start
message_pattern = r'"id":\s*(\d+),\s*"type":\s*"message",\s*"date":\s*"([^"]+)",\s*"date_unixtime":\s*"(\d+)",\s*"from":\s*"([^"]+)"'

matches = list(re.finditer(message_pattern, content))
print(f"Found {len(matches)} messages")

messages = []
for i, match in enumerate(matches):
    msg_id = match.group(1)
    date = match.group(2)
    unixtime = match.group(3)
    sender = match.group(4)
    
    # Find the text content - look between this match and the next
    start_pos = match.end()
    if i < len(matches) - 1:
        end_pos = matches[i + 1].start()
    else:
        end_pos = len(content)
    
    section = content[start_pos:end_pos]
    
    # Extract text - look for "text": [...] or "text": "..."
    text_match = re.search(r'"text":\s*(\[[^\]]+\]|"[^"]*")', section)
    text = ""
    if text_match:
        text_raw = text_match.group(1)
        # Try to extract plain text from the raw content
        text_parts = re.findall(r'"text":\s*"([^"]*)"', text_raw)
        text = ''.join(text_parts)
    
    messages.append({
        'id': msg_id,
        'date': date,
        'from': sender,
        'text': text
    })

# Write to markdown
with open('/root/.openclaw/workspace/memory/chat_history_extracted.md', 'w', encoding='utf-8') as f:
    f.write("# CLAWD Chat History: Feb 23 - Mar 9, 2026\n\n")
    f.write(f"**Extracted:** {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
    f.write(f"**Total Messages:** {len(messages)}\n\n---\n\n")
    
    current_date = None
    for msg in messages:
        date = msg['date'][:10]
        time = msg['date'][11:16]
        sender = msg['from']
        text = msg['text']
        
        if date != current_date:
            f.write(f"\n## {date}\n\n")
            current_date = date
        
        if not text.strip():
            continue
            
        if sender == "Mat Weiss":
            f.write(f"**[{time}] You:** {text}\n\n")
        else:
            f.write(f"*[{time}] Kimi:* {text}\n\n")

print(f"✅ Saved {len(messages)} messages to memory/chat_history_extracted.md")
