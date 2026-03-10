#!/usr/bin/env python3
import json
import re

# Read the file
with open('/root/.openclaw/media/inbound/file_171---a1d0d470-a5ed-4359-a247-e99606a70404', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the actual JSON start (after RTF header)
json_start_marker = '"name": "Kimi"'
marker_pos = content.find(json_start_marker)
if marker_pos == -1:
    print("Could not find JSON start marker")
    exit(1)

# Go back to find the opening brace
start = content.rfind('{', 0, marker_pos)
end = content.rfind('}') + 1
json_str = content[start:end]

# Step 1: Remove RTF line continuation (backslash at end of line, before newline)
# In RTF, lines end with \ followed by newline
lines = json_str.split('\n')
cleaned_lines = []
for line in lines:
    # Remove trailing backslash used for line continuation in RTF
    if line.rstrip().endswith('\\') and not line.rstrip().endswith('\\\\'):
        line = line.rstrip()[:-1]
    cleaned_lines.append(line)
json_str = ''.join(cleaned_lines)

# Step 2: Fix remaining RTF escapes for valid JSON
# The order matters here!
# Handle RTF unicode control words
json_str = re.sub(r'\\uc0\s*', '', json_str)  # Remove \uc0 prefix
# Convert RTF \uNNNN? format to Python unicode escapes
# RTF uses \uNNNN followed by a replacement char, JSON uses \uNNNN
json_str = re.sub(r'\\u(\d{3,5})\s*', lambda m: chr(int(m.group(1))), json_str)

json_str = json_str.replace('\\\\', '\x00')  # Temp placeholder for double backslash
json_str = json_str.replace('\\{', '{')       # Escaped braces
json_str = json_str.replace('\\}', '}')
json_str = json_str.replace('\\"', '"')      # Escaped quotes
json_str = json_str.replace('\\/', '/')       # Escaped forward slash
json_str = json_str.replace('\\n', '\n')      # Escaped newlines in text
json_str = json_str.replace('\\t', '\t')      # Escaped tabs
json_str = json_str.replace('\x00', '\\')     # Restore double backslash as single

# Parse the JSON
try:
    data = json.loads(json_str)
    messages = data.get('messages', [])
    print(f"Successfully parsed {len(messages)} messages")
    
    # Write to markdown
    with open('/root/.openclaw/workspace/memory/chat_history_feb_mar_2026.md', 'w', encoding='utf-8') as f:
        f.write("# CLAWD Chat History: Feb 23 - Mar 9, 2026\n\n")
        f.write(f"**Total Messages:** {len(messages)}\n\n---\n\n")
        
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
            
            # Skip empty messages
            if not text.strip():
                continue
                
            if sender == "Mat Weiss":
                f.write(f"**[{time}] You:** {text}\n\n")
            else:
                f.write(f"*[{time}] Kimi:* {text}\n\n")
    
    print("✅ Saved to: memory/chat_history_feb_mar_2026.md")
    
except json.JSONDecodeError as e:
    print(f"JSON Error: {e}")
    print(f"Error at position: {e.pos}")
    # Save problematic section for inspection
    with open('/tmp/json_error_section.txt', 'w', encoding='utf-8', errors='ignore') as f:
        f.write(json_str[max(0,e.pos-100):e.pos+100])
    print(f"Saved context to /tmp/json_error_section.txt")
