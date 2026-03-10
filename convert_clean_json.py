#!/usr/bin/env python3
import json
from datetime import datetime

# Read the clean JSON file
with open('/root/.openclaw/media/inbound/file_172---309dea1c-ad1e-4db5-8e5f-54ec20f6874a.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

messages = data.get('messages', [])
print(f"Parsed {len(messages)} messages")

# Write to markdown
with open('/root/.openclaw/workspace/memory/chat_history_feb23_mar9_2026.md', 'w', encoding='utf-8') as f:
    f.write("# CLAWD Chat History: February 23 - March 9, 2026\n\n")
    f.write(f"**Total Messages:** {len(messages)}\n")
    f.write(f"**Converted:** {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n---\n\n")
    
    current_date = None
    for msg in messages:
        date = msg.get('date', '')[:10] if msg.get('date') else 'Unknown'
        time = msg.get('date', '')[11:16] if msg.get('date') else 'Unknown'
        sender = msg.get('from', 'Unknown')
        
        if date != current_date:
            f.write(f"\n## {date}\n\n")
            current_date = date
        
        # Extract text
        text_data = msg.get('text', '')
        if isinstance(text_data, str):
            text = text_data
        elif isinstance(text_data, list):
            parts = []
            for p in text_data:
                if isinstance(p, str):
                    parts.append(p)
                elif isinstance(p, dict):
                    parts.append(p.get('text', ''))
            text = ''.join(parts)
        else:
            text = str(text_data)
        
        if not text.strip():
            continue
            
        if sender == "Mat Weiss":
            f.write(f"**[{time}] You:** {text}\n\n")
        else:
            f.write(f"*[{time}] Kimi:* {text}\n\n")

print(f"✅ Saved to: memory/chat_history_feb23_mar9_2026.md")
print(f"📊 Date range: {messages[0].get('date', '')[:10] if messages else 'N/A'} to {messages[-1].get('date', '')[:10] if messages else 'N/A'}")
