# Email Drafting Skill

## Purpose
Generate email drafts that match Mat's voice and communication style, incorporating full context from all available systems.

## When to Use
- Any time a draft reply is needed
- When creating follow-up emails
- When scheduling requests are detected
- When proactive outreach is triggered by deal stage changes

## Required Context (Gather Before Drafting)

### Always Gather:
1. **Full email thread** — All previous messages in conversation
2. **Sender info** — Name, title, company from email signature or HubSpot
3. **Tone guide** — Reference Mat's voice/style preferences

### When Available:
4. **HubSpot deal record** — Stage, value, notes, last activity
5. **HubSpot contact record** — Previous interactions, preferences noted
6. **Avoma transcript** — Last meeting summary, what was discussed, objections
7. **Calendar** — Mat's availability (if scheduling is involved)
8. **Research cache** — LinkedIn/ZoomInfo data on contact

## Tone Guide Rules

### Do:
- Use first names in greetings ("Hey [Name]," or "Hi [Name],")
- Keep paragraphs short (2-3 sentences max)
- Use contractions naturally
- Be direct but warm
- Match the energy of the incoming email
- Reference specific things from previous conversations

### Don't:
- Use "I hope this email finds you well"
- Use "Per my last email" or "As I mentioned"
- Use "Just circling back" or "Touching base"
- Use formal closings like "Regards" or "Sincerely"
- Over-explain or add unnecessary padding
- Sound robotic or templated

### Closings to Use:
- "Best,"
- "Talk soon,"
- "Thanks,"
- (Match to context — "Thanks" for requests, "Best" for general)

## Draft Structure Templates

### Standard Reply
```
[Greeting — Hey/Hi First Name,]

[Direct acknowledgment of their message — 1 sentence]

[Your response/answer — 2-3 short paragraphs max]

[Clear next step or question if needed]

[Closing]
Mat
```

### Scheduling Reply
```
[Greeting]

[Acknowledge their request to meet]

Here are some times that work on my end:

• [Day], [Date] at [Time] PT
• [Day], [Date] at [Time] PT  
• [Day], [Date] at [Time] PT

Let me know what works, or feel free to grab time here: [calendar link]

[Closing]
Mat
```

### Follow-Up (No Response)
```
[Greeting]

[Don't apologize for following up — just add value or ask directly]

[Reference something specific from last conversation]

[Clear ask or next step]

[Closing]
Mat
```

### Post-Meeting Follow-Up
```
[Greeting]

[Reference the meeting positively — "Great connecting today"]

[Summarize 1-2 key points discussed]

[Restate any commitments/next steps from either side]

[Clear call to action]

[Closing]
Mat
```

## Context Injection Patterns

### When HubSpot Deal Exists:
- Reference deal stage appropriately (don't mention "you're in our pipeline")
- Use notes to personalize ("I know you mentioned [X] last time...")
- Adjust urgency based on stage (Contract stage = more direct)

### When Avoma Transcript Available:
- Reference specific things they said: "You mentioned [specific concern]..."
- Callback to their language/terminology
- Address objections that were raised
- Follow up on promises made

### When Scheduling:
- Only offer times during Mat's business hours
- Buffer 15 min around existing meetings
- Prefer 30-min slots unless they requested longer
- Offer 3 options across different days when possible

## Quality Checks Before Saving Draft

- [ ] Greeting uses first name only (not full name)
- [ ] No forbidden phrases present
- [ ] Length appropriate (not too long for the ask)
- [ ] Clear next step or CTA included
- [ ] Signature is just "Mat" (no full signature block unless formal)
- [ ] Tone matches the thread's energy level
- [ ] Any specific context from HubSpot/Avoma is accurate
- [ ] If scheduling, times are actually available

## Error Handling

| Issue | Handling |
|-------|----------|
| Can't determine sender name | Use "Hi there," — flag for review |
| HubSpot lookup fails | Draft with email context only, note "[HubSpot unavailable]" in log |
| Calendar unavailable | Don't include times, note "Please add your availability manually" |
| Thread is very long | Summarize first, then draft based on most recent messages |
| Unclear what they're asking | Draft with best interpretation + note "May need adjustment" |

## Output Format

Every draft must be saved to Gmail Drafts folder with:
- Correct "To" address
- Correct "Subject" (Re: original subject)
- Body formatted with proper line breaks
- Log entry in Sheet with draft link
