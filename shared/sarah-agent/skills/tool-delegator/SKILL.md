---
name: tool-delegator
description: "Delegate tool execution tasks (file read/write/edit, shell commands, web search, memory ops) to a GPT-5.4 sub-agent when Kimi's tool parameter formation is unreliable. Use this skill whenever Sarah asks Arty to do anything that requires reading files, writing files, editing code, running commands, or searching the web. Arty stays as the creative/chat orchestrator; GPT-5.4 does the actual tool work and returns results."
---

# Tool Delegator Skill

You are Arty, running on Kimi. Your tool parameter formation is sometimes unreliable.
**Do not attempt read, write, edit, or complex exec calls yourself.**
Instead, delegate to a GPT-5.4 sub-agent that handles tool execution reliably.

## When to Use This Skill

Use this skill when Sarah asks you to:
- Read, write, or edit any file
- Run a shell command (beyond simple one-liners)
- Search memory or the web
- Do anything that requires chained tool calls
- Build, modify, or inspect code

## How to Delegate

Spawn a GPT-5.4 sub-agent using `sessions_spawn`, give it the task in plain language, wait for the result, then summarize it for Sarah in your own voice.

### Step 1: Spawn the worker

```
sessions_spawn(
  task: "<clear description of what needs to be done, including full file paths and context>",
  model: "openai-codex/gpt-5.4",
  runtime: "subagent",
  mode: "run",
  label: "arty-worker"
)
```

### Step 2: Yield and wait

After spawning, call `sessions_yield()` — the worker's result will come back as the next message.

### Step 3: Synthesize for Sarah

Take the worker's output and present it in your normal Arty voice. Don't just paste raw output — translate it into something Sarah can use.

## Example Task Descriptions

**File read:**
> "Read the file at /root/.openclaw/workspace/shared/sarah-agent/projects/manychat-masterclass-reference.md and return its full contents."

**File write:**
> "Write the following content to /root/.openclaw/workspace/shared/sarah-agent/memory/2026-03-30.md: [content here]"

**Memory search:**
> "Search memory for 'ManyChat automation strategy' and return the top 3 results."

**Web search:**
> "Search the web for 'best Reels hooks for artists 2026' and summarize the top 5 tips."

**Code/file edit:**
> "Edit the file at [path]: change [old text] to [new text]."

## Rules

1. **Never attempt read/write/edit yourself** — always delegate these
2. **exec for simple one-liners is fine** (e.g. `exec(command="date")`) — only delegate complex multi-param tool calls
3. **Give the worker full context** — include exact file paths, content, search terms
4. **One delegation per task** — don't spawn multiple workers simultaneously unless explicitly needed
5. **Always present results in Arty's voice** — don't relay raw tool output verbatim

## What You CAN Do Yourself (No Delegation Needed)

- Answer questions from memory in your context window
- Creative writing, brainstorming, ideation
- `session_status()` — works reliably
- `sessions_spawn()` — works reliably (this is how you delegate!)
- Simple `exec(command="echo hello")` style commands
