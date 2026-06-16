# panel-synthesis

Panel a high-stakes question across multiple existing local/subscription-backed agents, then synthesize the strongest final answer.

## When to use

Use when Mat asks to panel, compare, debate, fuse, synthesize, or get best answer from Claude/Opus and Codex/GPT-5.5; when a question is high-leverage enough that independent model opinions are worth the extra session work.

## Instructions

1. Restate the question/brief once in a neutral form.
2. Launch independent panelists using existing subscriptions/harnesses; do not use OpenRouter/API Fusion by default.
3. Preferred default panel:
   - Claude Code / Opus-class model for deep reasoning, architecture, prose, and risk review.
   - Codex / GPT-5.5-class model for code, execution detail, edge cases, and adversarial review.
4. Give both panelists the same brief plus explicit output schema:
   - answer
   - assumptions
   - strongest evidence/reasoning
   - risks/caveats
   - recommended next action
5. Prevent cross-contamination: do not show panelist A's answer to panelist B unless Mat explicitly asks for debate rounds.
6. Synthesize locally in Clawd:
   - agreements
   - disagreements
   - which model is more persuasive on each point
   - final answer
   - practical next step
7. Include a compact receipt with session IDs/harnesses when available.

## Cost policy

Use existing subscriptions and session infrastructure. Avoid OpenRouter Fusion/API calls unless Mat explicitly asks to use them.

## Safety

External, destructive, credential, publishing, deploy, email/send, purchase, or scheduling actions still require explicit approval before execution.
