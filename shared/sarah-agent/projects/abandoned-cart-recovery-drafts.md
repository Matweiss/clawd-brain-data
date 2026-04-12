# Abandoned Cart Recovery Drafts

Date: 2026-04-12
Owner: Arty
Purpose: Give Sarah a clean, on-brand abandoned cart follow-up sequence she can review before any automation is turned on.

## Voice guardrails
- warm, human, lightly playful
- elevated, not salesy
- assume the buyer may have simply gotten distracted
- no pressure language
- no fake scarcity unless the piece is genuinely one-of-one and still available
- Sarah reviews every draft before anything is sent

## Recommended sequence

### Email 1, gentle reminder
**Send window:** ~1 hour after cart abandonment

**Subject options:**
- your piece is still waiting for you
- just in case you got pulled away
- leaving this here for you

**Draft:**
Hi {{ first_name | default: "there" }},

Just a little note in case life pulled you away mid-click.

The piece you were looking at is still sitting in your cart, and I wanted to make it easy to find your way back if you meant to keep going.

{{ cart_items }}

You can return to your cart here:
{{ checkout_url }}

If you had a question about the piece, shipping, sizing, or anything else, just reply and I can help.

Warmly,
Sarah

---

### Email 2, artist-voice reassurance
**Send window:** ~24 hours after cart abandonment

**Subject options:**
- a quick note about the piece you picked
- just wanted to make sure you had what you needed
- if you’re still thinking about it

**Draft:**
Hi {{ first_name | default: "there" }},

I wanted to reach out one more time in case you were still thinking about the piece you added to your cart.

Buying original art is personal. Sometimes it’s an immediate yes, and sometimes it helps to sit with it for a minute.

If you want to take another look, your cart is still here:
{{ checkout_url }}

And if you want help deciding, you can always reply to this email. I’m happy to answer questions about color, scale, framing, shipping, or whether it feels like the right fit for your space.

Warmly,
Sarah

---

### Email 3, soft close with optional incentive
**Send window:** ~48 to 72 hours after cart abandonment
**Use incentive only if Sarah wants it**

**Subject options:**
- last note from me
- in case you wanted to come back to it
- one last gentle nudge

**Draft, no incentive:**
Hi {{ first_name | default: "there" }},

This is my last note about the piece you left in your cart.

If it is meant for you, you can pick it back up here:
{{ checkout_url }}

If not, no pressure at all. I know collecting art is a feeling thing, and I’d rather it land with the right person at the right time.

Either way, thank you for spending time with the work.

Warmly,
Sarah

**Optional closing swap, free shipping version:**
If you were on the fence, I’m also happy to offer free shipping on this order with code {{ discount_code }} for the next {{ discount_window }}.

**Optional closing swap, small collector incentive version:**
If it helps you decide, you can use {{ discount_code }} for {{ discount_value }} off over the next {{ discount_window }}.

Warmly,
Sarah

## SMS versions, only if Sarah wants text follow-up
Keep these rarer and softer than ecommerce defaults.

### SMS 1
Hi {{ first_name | default: "there" }}, it looks like you left a piece in your cart. If you meant to come back to it, here’s your link: {{ checkout_url }} — Sarah

### SMS 2
Hi {{ first_name | default: "there" }}, just leaving this here in case you’re still thinking about that piece: {{ checkout_url }}. Happy to answer questions if helpful. — Sarah

## Personalization tokens to support
- `first_name`
- `checkout_url`
- `cart_items`
- `discount_code`
- `discount_window`
- `discount_value`
- optional `piece_title`

## Sarah-specific recommendations
1. Start with email only. Her brand is better served by restraint.
2. Use the 3-email sequence, but keep the third email incentive-free by default.
3. Only use a discount if the piece is not one-of-one or if Sarah explicitly wants recovery over brand purity.
4. If the abandoned cart includes an original, test free shipping before percentage-off discounts.
5. If someone replies, that thread should become personal and manual immediately.

## Suggested first live setup
- Email 1 at 1 hour
- Email 2 at 24 hours
- Email 3 at 72 hours
- No discount in first test
- Measure: recovery rate, reply rate, and whether the tone feels like Sarah

## Review checklist before launch
- confirm placeholders match Shopify/Klaviyo field names
- confirm whether one-of-one pieces should mention availability
- confirm if free shipping is preferable to discounting
- confirm reply-to inbox goes somewhere Sarah will actually see
- send test emails to Sarah before enabling
