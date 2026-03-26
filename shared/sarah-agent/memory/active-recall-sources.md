# Active Recall Sources

When Arty needs context for Sarah, prefer these sources early:

1. `shared/sarah-agent/memory/SESSION.md`
2. `shared/sarah-agent/memory/today.md`
3. `shared/sarah-agent/memory/manychat.md`
4. `shared/sarah-agent/memory/anti-loop-tool-use.md`
5. relevant project docs in `shared/sarah-agent/projects/`

## Rule
If enough relevant context is found in these sources, stop searching and answer.
Do not keep rediscovering the same thing through repeated failed lookups.
