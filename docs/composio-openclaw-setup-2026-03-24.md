# Composio → OpenClaw setup note (2026-03-24)

## Outcome
Composio is installed and working in OpenClaw on this host.

Verified after restart:
- Gateway running normally
- Composio plugin loaded
- MCP connection established to `https://connect.composio.dev/mcp`
- 7 Composio tools registered:
  - `COMPOSIO_MANAGE_CONNECTIONS`
  - `COMPOSIO_MULTI_EXECUTE_TOOL`
  - `COMPOSIO_REMOTE_BASH_TOOL`
  - `COMPOSIO_REMOTE_WORKBENCH`
  - `COMPOSIO_SEARCH_TOOLS`
  - `COMPOSIO_WAIT_FOR_CONNECTIONS`
  - `COMPOSIO_GET_TOOL_SCHEMAS`

Observed log lines:
- `[plugins] [composio] Ready — 7 tools registered`
- `[plugins] [composio] MCP client connected`

## Exact setup used
Installed published package:

```bash
openclaw plugins install @composio/openclaw-plugin@0.0.8
```

Allowlisted plugin/tools:

```bash
openclaw config set plugins.allow '["composio"]' --strict-json
openclaw config set tools.alsoAllow '["composio"]' --strict-json
```

Then restarted gateway:

```bash
openclaw gateway restart
```

## Important README mismatch / workaround
The package README says to set the consumer key with:

```bash
openclaw config set plugins.entries.composio.config.consumerKey "ck_..."
```

But in this environment that path did **not** produce a working runtime config for the plugin.

Also, trying to set:

```bash
openclaw config set plugins.entries.composio.consumerKey '"ck_..."' --strict-json
```

failed CLI validation with:

```text
Config validation failed: plugins.entries.composio: Unrecognized key: "consumerKey"
```

### Working fix
Patch `~/.openclaw/openclaw.json` directly so the Composio entry contains:

```json
"composio": {
  "enabled": true,
  "config": {
    "consumerKey": "ck_..."
  }
}
```

After that, `openclaw gateway restart` succeeded and the plugin registered tools.

## Non-fatal warning
This warning appears but does not block operation:

```text
plugin id mismatch (manifest uses "composio", entry hints "openclaw-plugin")
```

The user explicitly chose to ignore plugin-name mismatch warnings. In practice, the plugin still loads and works.

## Smoke test notes
### Successful verification
A real runtime verification was completed at the plugin level:
- plugin loaded
- connected to Composio MCP
- registered live tools from the MCP endpoint

### Attempted local-agent smoke test
I also attempted an isolated embedded agent turn to call Composio search via the newly registered tool surface.
That attempt failed due to an unrelated embedded agent/provider header error, not due to Composio:

```text
Headers.append: "Bearer ..." is an invalid header value.
```

So:
- **Composio status:** working
- **embedded local smoke test:** blocked by separate agent auth/header issue

## Verified connection inventory (live query)
Explicitly confirmed via live `COMPOSIO_MANAGE_CONNECTIONS` / discovery checks:

### Active and usable
- **GitHub** — active
  - login: `Matweiss`
  - profile: `https://github.com/Matweiss`
  - public repos: 15
  - private repos: 5
- **ElevenLabs** — active
  - returned live account/model catalog data
- **Shopify** — active
- **Supabase** — active
  - surfaced projects:
    - `Clawdv2` — `ACTIVE_HEALTHY`
    - `craftable-onboarding` — `INACTIVE`
- **Vercel** — active
  - username: `matweiss`
  - email: `mat.weiss@att.net`

### Active connection, but needs attention
- **GroqCloud** — connection marked active, but current user info returned:
  - `Invalid API Key`

### Active connection, but likely limited
- **OpenRouter** — active
  - total credits: 0
  - total usage: 0

### Not confirmed in Composio
- **PerplexityAI** — not cleanly surfaced as a confirmed Composio toolkit/connection during these checks

## Recommendation
For future setup docs, treat the current working path as:
1. install plugin
2. allow `composio` in `plugins.allow`
3. allow `composio` in `tools.alsoAllow`
4. ensure `plugins.entries.composio.config.consumerKey` exists in the actual JSON config
5. restart gateway
6. verify plugin registration / MCP connectivity
7. verify important toolkit connections individually with connection-management checks
