#!/usr/bin/env python3
"""Extract chat history from RTF-wrapped JSON"""
import json
import re

# Read the RTF file
with open('/root/.openclaw/media/inbound/file_171---a1d0d470-a5ed-4359-a247-e99606a70404', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Process line by line
cleaned_lines = []
for line in lines:
    # Remove RTF line continuation (backslash at end before newline)
    if line.rstrip().endswith('\\') and not line.rstrip().endswith('\\\\'):
        line = line.rstrip()[:-1]
    cleaned_lines.append(line)

# Join and fix common RTF escapes
content = ''.join(cleaned_lines)

# Find JSON boundaries  
start = content.find('"name": "Kimi"')
start = content.rfind('{', 0, start)
end = content.rfind('}') + 1
json_content = content[start:end]

# Replace RTF escapes with proper characters
replacements = [
    ('\\\\{', '{'),      # Escaped braces
    ('\\\\}', '}'),
    ('\\\\"', '"'),      # Escaped quotes
    ('\\\\/', '/'),      # Escaped slashes
    ('\\\\n', '\n'),     # Newlines
    ('\\\\t', '\t'),     # Tabs
    ('\\\\\\', '\\'),    # Double backslash -> single
    ('\\uc0\\u', '\\u'), # RTF unicode prefix
]

for old, new in replacements:
    json_content = json_content.replace(old, new)

# Handle RTF unicode \uNNNN format - convert to actual characters
# Pattern: \u followed by 3-5 digits
json_content = re.sub(r'\\u(\d{3,5})\s*', lambda m: chr(int(m.group(1))), json_content)

# Try parsing
try:
    data = json.loads(json_content)
    messages = data.get('messages', [])
    print(f"✅ Parsed {len(messages)} messages successfully!")
    
    # Write markdown
    with open('/root/.openclaw/workspace/memory/chat_history_full.md', 'w', encoding='utf-8') as f:
        f.write("# CLAWD Chat History: February 23 - March 9, 2026\n\n")
        f.write(f"**Total Messages:** {len(messages)}\n")
        f.write(f"**Source:** Telegram Export\n\n---\n\n")
        
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
    
    print(f"📁 Saved to: memory/chat_history_full.md")
    print(f"📊 Date range: {messages[0].get('date', '')[:10] if messages else 'N/A'} to {messages[-1].get('date', '')[:10] if messages else 'N/A'}")
    
except json.JSONDecodeError as e:
    print(f"❌ JSON Error at position {e.pos}: {e.msg}")
    # Save the problematic content for debugging
    with open('/tmp/problematic.json', 'w', encoding='utf-8') as f:
        f.write(json_content)
    print(f"💾 Saved problematic content to /tmp/problematic.json")
