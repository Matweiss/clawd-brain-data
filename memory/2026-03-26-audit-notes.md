# 2026-03-26 Audit Notes

## Step 1 — OpenClaw durable source fix

### Status
Completed in fresh upstream clone at:
- `/root/.openclaw/workspace/tmp/openclaw-upstream`

### Exact source file
- `src/agents/pi-tools.schema.ts`

### Change made
Ported the live runtime hotpatch into source-level schema normalization logic.

Before:
- flattening alias-heavy `anyOf` / `oneOf` tool schemas only kept required fields present in all object variants
- many alias tools ended up with no `required` fields after flattening

After:
- if flattened schema has no required fields, apply alias fallback required key in this order:
  - `path`
  - `file`
  - `command`
  - `query`
  - `prompt`
  - `sessionKey`
  - `url`
  - `image`
  - else first merged property key

### Why
Improves tool-call behavior for stricter models like Kimi and GPT-5.4 on alias-heavy tools such as `read`, `write`, `edit`, `exec`, and memory/search-like tools.

### Repo state
- upstream clone branch: `main`
- upstream clone HEAD: `208ff68`
- modified file only:
  - `src/agents/pi-tools.schema.ts`

### Recommended next commands inside clone
```bash
cd /root/.openclaw/workspace/tmp/openclaw-upstream
git diff -- src/agents/pi-tools.schema.ts
# optionally run focused checks/build depending on appetite:
npm test -- --help || true
npm run build
```

### Proposed commit message
`fix(tools): preserve a required alias when flattening union parameter schemas`

---

## Step 2 — Mission Control repo hygiene + build health

### Repo
- `/root/.openclaw/workspace/clawd-mission-control-v2`

### What is healthy
- `npm run build` succeeded on Next.js 14.2.0
- production build generated successfully
- API routes are present under `src/pages/api/*`
- source layout is coherent (`src/pages`, `src/components`, `src/hooks`, `src/lib`)

### What is messy / risky
1. **Dirty working tree from generated output**
   - `.next/` is tracked and currently heavily modified
   - `git status --short` shows many modified `.next/*` files
   - current `.next` size observed: `107M`
   - even though `.gitignore` ignores `/.next`, tracked files remain tracked unless removed from git index

2. **Shell execution in API routes**
   - `src/pages/api/agents/[agentId].ts`
   - `src/pages/api/agents/status.ts`
   - `src/pages/api/agents/action.ts`
   - `src/pages/api/system/backup.ts`
   use `execSync`, which is workable but increases risk / coupling / blocking behavior

3. **Fallback/mock behavior still present in app logic**
   - `src/pages/api/recommendations.ts` logs fallback to mock calendar data
   - `src/components/HeroSection.tsx` contains note about using mock data for schedule
   - `src/pages/index-old.tsx` still exists and likely adds noise

4. **Potential secret/default hygiene issues**
   - `src/pages/api/webhook/ha.ts` includes default fallback:
     - `process.env.HA_WEBHOOK_SECRET || 'your-secret-here'`
   - several endpoints rely directly on env secrets with minimal indirection

### Practical recommendations
1. Remove tracked `.next` build artifacts from git index and keep `.next/` ignored.
2. Audit `execSync` API routes for timeout/error handling and possible replacement with safer adapters.
3. Remove or archive `src/pages/index-old.tsx` if not intentionally kept.
4. Replace insecure secret fallback defaults with hard failure if env is missing.
5. Separate mock/demo fallbacks from production logic more explicitly.

### Immediate priority order for Mission Control
1. repo hygiene (`.next` tracked output cleanup)
2. secret/default hardening
3. API route execSync review
4. mock/dead-code cleanup

---

## Next recommended task
Step 3 should be:
- Mission Control focused cleanup plan execution, starting with tracked `.next` removal from git index and a quick review of the risky API route files before changing code.
