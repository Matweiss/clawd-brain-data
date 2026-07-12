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
4. Default debate topology is **blind parallel → cross-review parallel → Clawd synthesis**. Avoid sequential Claude → Codex → Claude → Codex by default because speaker order creates anchoring.
5. Round 1: give both panelists the same brief plus explicit output schema:
   - answer
   - assumptions
   - strongest evidence/reasoning
   - risks/caveats
   - recommended next action
6. Round 2: provide each panelist the other's Round 1 answer and ask for a revised answer:
   - what did the other answer catch that you missed?
   - what do you still disagree with?
   - what would you change in your final answer?
   - submit a revised final answer, not just critique
7. Synthesize locally in Clawd:
   - agreements
   - disagreements
   - which model is more persuasive on each point
   - what changed after cross-review
   - final answer
   - practical next step
8. Include a compact receipt with session IDs/harnesses when available.

## Tool choice

Use Debby-style debate when the output is judgment, strategy, writing, or answer quality. Use Polly when the output is coordinated work: plan/build/review/ship, coding execution, or multi-agent task management. Use this panel-synthesis skill as the wrapper when Mat wants both independent model opinions and a final Clawd synthesis.

## Cost policy

Use existing subscriptions and session infrastructure. Avoid OpenRouter Fusion/API calls unless Mat explicitly asks to use them.

## Safety

External, destructive, credential, publishing, deploy, email/send, purchase, or scheduling actions still require explicit approval before execution.
