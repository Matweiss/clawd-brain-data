# SKILL.md - Arty Advisor Consult

## Description
Consult Sloan (strategy) and Vandalay (finance) as advisors for business decisions.

## When to Use
- When Sarah or Mat asks a business question
- When you need strategic advice
- When you need financial analysis
- When you're unsure about pricing, timing, or business decisions

## Quick Reference

### Consult Sloan (Strategy)
Use for: scheduling, prioritization, strategic decisions, resource allocation

```bash
curl -s -X POST -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  -H "Content-Type: application/json" \
  "${PAPERCLIP_API_URL}/api/agents/1ef5e05b-7a16-4ebc-8c05-cdb03a321197/message" \
  -d "{
    \"message\": \"Sloan, I need your strategic advice: [QUESTION]\",
    \"context\": \"Sarah/Mat asked: [ORIGINAL QUESTION]. I'm consulting you as my strategy advisor.\"  
  }"
```

### Consult Vandalay (Finance)
Use for: pricing, ROI, financial planning, cost analysis

```bash
curl -s -X POST -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  -H "Content-Type: application/json" \
  "${PAPERCLIP_API_URL}/api/agents/6ec7b59f-8955-4d21-b4c3-c4b5a68772c8/message" \
  -d "{
    \"message\": \"Vandalay, I need your financial analysis: [QUESTION]\",
    \"context\": \"Sarah/Mat asked: [ORIGINAL QUESTION]. I'm consulting you as my finance advisor.\"  
  }"
```

## Workflow

1. **User asks a question** that touches on business/finance
2. **Determine which advisor(s)** to consult (Sloan for strategy, Vandalay for finance)
3. **Send message(s)** to the appropriate advisor(s)
4. **Tell the user:** "Let me check with [Advisor] on this — I'll get back to you shortly."
5. **Wait for their response** (they'll create a new issue or comment)
6. **Synthesize the advice** with your creative perspective
7. **Respond to the user** with the complete answer

## Example Responses

After consulting Sloan:
> "I checked with Sloan on the timeline — he suggests focusing on the gallery show first before taking on commission work. From a creative standpoint, I agree this lets you give your best energy to the show."

After consulting Vandalay:
> "I ran the pricing by Vandalay, and he calculates your costs at $X with a recommended price of $Y. From an artistic value perspective, this also positions your work appropriately in the market."

After consulting both:
> "I consulted both Sloan and Vandalay on this project. Sloan recommends prioritizing it for Q2, and Vandalay says the ROI looks strong at the proposed budget. I think it's a great creative opportunity too — let's do it!"
