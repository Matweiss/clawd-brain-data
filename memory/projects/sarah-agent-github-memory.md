# GitHub Shared Memory for Sarah's Agent

## Overview
Since Sarah's agent runs on Kimi Claw (cloud), we use GitHub as the shared memory backend.

**Repository:** `Matweiss/clawd-brain-data`  
**Memory Path:** `shared/sarah-agent/`  
**Access:** GitHub API (REST)

---

## API Endpoints (GitHub REST API v3)

### Read a File
```http
GET https://api.github.com/repos/Matweiss/clawd-brain-data/contents/shared/sarah-agent/memory/SESSION.md
Authorization: Bearer YOUR_GITHUB_TOKEN
```

**Response:**
```json
{
  "content": "base64-encoded-content",
  "sha": "file-sha-for-updates"
}
```

### Write/Update a File
```http
PUT https://api.github.com/repos/Matweiss/clawd-brain-data/contents/shared/sarah-agent/memory/today.md
Authorization: Bearer YOUR_GITHUB_TOKEN
Content-Type: application/json

{
  "message": "Update today.md - Session with Sarah",
  "content": "base64-encoded-new-content",
  "sha": "existing-file-sha"  // Required for updates
}
```

### List Directory Contents
```http
GET https://api.github.com/repos/Matweiss/clawd-brain-data/contents/shared/sarah-agent/memory/
Authorization: Bearer YOUR_GITHUB_TOKEN
```

---

## Helper Functions (Python)

```python
import base64
import requests

GITHUB_TOKEN = "ghp_xxxx"  # Store in Kimi Claw secrets
REPO = "Matweiss/clawd-brain-data"
BASE_PATH = "shared/sarah-agent"

def read_memory_file(filepath):
    """Read a file from shared memory"""
    url = f"https://api.github.com/repos/{REPO}/contents/{BASE_PATH}/{filepath}"
    headers = {"Authorization": f"Bearer {GITHUB_TOKEN}"}
    
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        content_b64 = response.json()["content"]
        return base64.b64decode(content_b64).decode("utf-8")
    elif response.status_code == 404:
        return None  # File doesn't exist yet
    else:
        raise Exception(f"GitHub API error: {response.status_code}")

def write_memory_file(filepath, content, message="Update from agent"):
    """Write/update a file in shared memory"""
    url = f"https://api.github.com/repos/{REPO}/contents/{BASE_PATH}/{filepath}"
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Get existing file SHA (if updating)
    existing = requests.get(url, headers=headers)
    sha = existing.json().get("sha") if existing.status_code == 200 else None
    
    # Prepare payload
    payload = {
        "message": message,
        "content": base64.b64encode(content.encode()).decode()
    }
    if sha:
        payload["sha"] = sha
    
    response = requests.put(url, headers=headers, json=payload)
    return response.status_code == 200 or response.status_code == 201

def log_activity(activity):
    """Append activity to today.md"""
    today_file = "memory/today.md"
    current = read_memory_file(today_file) or ""
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    new_entry = f"\n## {timestamp}\n{activity}\n"
    
    return write_memory_file(today_file, current + new_entry, f"Log activity - {timestamp}")

def update_session(state_dict):
    """Overwrite SESSION.md with current state"""
    import json
    from datetime import datetime
    
    state_dict["last_updated"] = datetime.now().isoformat()
    state_dict["agent"] = "Sarah's Art Assistant"
    
    content = f"""# Current Session State

**Last Updated:** {state_dict['last_updated']}  
**Agent:** {state_dict['agent']}  
**Status:** {state_dict.get('status', 'Active')}

## Immediate Priorities
{chr(10).join(f"{i+1}. {p}" for i, p in enumerate(state_dict.get('priorities', [])))}

## Active Context
{state_dict.get('context', 'No additional context')}

## Blockers
{state_dict.get('blockers', 'None currently')}

## Mood/Context
{state_dict.get('mood', 'Neutral')}

---

*This file is overwritten at the start of each session*
"""
    
    return write_memory_file("memory/SESSION.md", content, "Update session state")
```

---

## Usage Examples

### At Session Start
```python
# 1. Read SESSION.md to get current state
session = read_memory_file("memory/SESSION.md")
print(f"Last priority: {extract_priorities(session)}")

# 2. Read today.md to see recent activities
today = read_memory_file("memory/today.md")
print(f"Today's wins: {extract_wins(today)}")

# 3. Update SESSION.md for this session
update_session({
    "priorities": ["Draft birthday email", "Update landing pages"],
    "context": "Sarah wants to launch birthday program next week",
    "mood": "Excited about automation possibilities"
})
```

### During Session
```python
# Log a win
log_activity("🎉 Drafted birthday welcome email - awaiting Sarah approval")

# Log a decision
log_activity("""**Decision:** Sarah approved auto-apply STARCOLLECTOR discount
- Context: Collector hit 10 orders
- Action: Discount will auto-apply on next purchase
- Sarah's note: "Make sure they know it's because they're valued"
""")

# Update active projects
update_session({
    "priorities": [
        "Finalize birthday program launch (scheduled next week)",
        "Update 3 landing pages with new Shine Through pieces"
    ],
    "context": "Birthday program approved for launch. Need 3 more landing page updates.",
    "blockers": "Waiting on images for 'Midnight Garden' piece"
})
```

### For Mission Control (Mat)
```python
# Check what Sarah and agent are working on
def get_current_status():
    session = read_memory_file("memory/SESSION.md")
    today = read_memory_file("memory/today.md")
    
    return {
        "current_priorities": extract_priorities(session),
        "today_activities": extract_activities(today),
        "blockers": extract_blockers(session),
        "last_updated": extract_timestamp(session)
    }

# Usage
status = get_current_status()
print(f"Sarah is working on: {status['current_priorities']}")
print(f"Blockers: {status['blockers']}")
```

---

## File Structure on GitHub

```
shared/sarah-agent/
├── SOUL.md                 # Link to system prompt
├── memory/
│   ├── SESSION.md         # Current state (overwritten each session)
│   ├── today.md           # Today's log (appended throughout day)
│   ├── 2026-03-21.md      # Daily archive
│   └── 2026-03-22.md
├── projects/
│   ├── birthday-program/
│   ├── landing-pages/
│   └── newsletter-drafts/
├── decisions/
│   └── [topic].md
└── collectors/
    └── [collector-data].md
```

---

## Setup for Kimi Claw Agent

### 1. Get GitHub Token
- Go to GitHub → Settings → Developer settings → Personal access tokens
- Generate new token (classic) with `repo` scope
- Copy the token (starts with `ghp_`)

### 2. Store in Kimi Claw
Add to Kimi Claw secrets/environment:
```
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
SHARED_MEMORY_REPO=Matweiss/clawd-brain-data
```

### 3. Test Connection
```python
# Verify read access
content = read_memory_file("memory/SESSION.md")
print("✅ Connected to shared memory")

# Verify write access
success = log_activity("🎨 Agent initialized and connected to shared memory")
print(f"{'✅' if success else '❌'} Write access")
```

---

## Fallback Strategy

If GitHub API fails:
1. **Read-only mode:** Use local session memory only
2. **Queue writes:** Store updates locally, retry GitHub later
3. **Notify Sarah:** "Memory sync delayed, but I'm still working"
4. **Mission Control:** Mat can manually sync via VPS if needed

---

## Security Notes

- Token has read/write access to `clawd-brain-data` repo only
- No access to other repos or account settings
- Token can be revoked anytime from GitHub
- Content is base64 encoded in transit (HTTPS)

---

## Quick Reference

| Action | Function | GitHub API |
|--------|----------|------------|
| Read | `read_memory_file(path)` | GET /contents/ |
| Write | `write_memory_file(path, content)` | PUT /contents/ |
| Log activity | `log_activity(text)` | Read + Append + Write |
| Update session | `update_session(dict)` | PUT /contents/ |

---

*This enables cloud-based agents (Kimi Claw) to share memory with VPS-based agents*
