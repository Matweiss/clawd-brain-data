---
name: Lucra ROI Calculator
description: A brand-native deal workspace for shaping Lucra economics and customer-ready outputs.
colors:
  play: "#8AE91A"
  play-deep: "#012E2B"
  arena: "#31E5F7"
  energy: "#006DFF"
  midnight: "#061D3B"
  authority: "#374F5E"
  electric: "#FFFA77"
  ink: "#181818"
  surface-card: "#1F1F1F"
  text: "#FFFFFF"
  surface-subtle: "#F4F6F4"
typography:
  display:
    fontFamily: "Playfair Display, Hardcover, Georgia, serif"
    fontSize: "40px"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Hanken Grotesk, Parabolica, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0"
  label:
    fontFamily: "Hanken Grotesk, Parabolica, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.14em"
rounded:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "20px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.play}"
    textColor: "{colors.play-deep}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "12px 18px"
  input:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "12px 14px"
---

# Design System: Lucra ROI Calculator

## Overview

**Creative North Star: "The Deal Arena"**

The calculator is a focused commercial workspace inside Lucra's official corporate product language. Midnight navy and black create a credible, high-concentration working canvas; Lucra Play green signals momentum, selection, and decisive action. The experience is data-dense but guided, with clear stages that help a rep move from setup to economics to deliverable without losing context.

The system rejects generic SaaS card grids, casino cues, decorative glow, and spreadsheet-like input walls. Familiar product affordances, strong labels, and visible assumptions make the tool feel dependable during a live sales call.

**Key Characteristics:**
- Dark midnight partner workspace with restrained Lucra Play accents.
- Guided deal setup before calculator detail.
- Dense, legible controls with clear progressive disclosure.
- Prospect-safe deliverables separated from internal guidance.
- Quick, athletic state transitions with reduced-motion support.

## Colors

Lucra Play is the scarce action color. Midnight and ink carry the workspace; Arena cyan, Energy blue, and Electric yellow are reserved for secondary information roles and meaningful status.

### Primary
- **Lucra Play** (#8AE91A): primary actions, selected states, progress, and live confirmation.
- **Deep Evergreen** (#012E2B): text on Play and high-contrast brand depth.

### Secondary
- **Arena Cyan** (#31E5F7): informational highlights and selected data series.
- **Energy Blue** (#006DFF): secondary chart and comparison series.
- **Electric Yellow** (#FFFA77): warnings and exceptional callouts only.

### Neutral
- **Midnight Navy** (#061D3B): principal application canvas.
- **Lucra Ink** (#181818): navigation and deepest surfaces.
- **Raised Ink** (#1F1F1F): form and result surfaces.
- **Lucra White** (#FFFFFF): primary text on dark surfaces.
- **Subtle Light** (#F4F6F4): print and prospect-safe light output surfaces.

**The Play Signal Rule.** Lucra Play marks action or state. If green appears everywhere, nothing feels active.

## Typography

**Display Font:** Playfair Display with Hardcover and Georgia fallbacks
**Body Font:** Hanken Grotesk with Parabolica and system fallbacks

**Character:** Commercial serif headlines create Lucra distinction; the humanist sans keeps forms, tables, and data calm under pressure. Display type never appears in labels, buttons, or dense data.

### Hierarchy
- **Display** (600, 40px, 1.05): page and major workflow titles.
- **Headline** (600, 30px, 1.1): result and section titles.
- **Title** (600, 20px, 1.2): step and grouped-control headings.
- **Body** (400, 16px, 1.45): instructions and explanatory copy, capped at 70ch.
- **Label** (600, 11px, 0.14em, uppercase): concise eyebrows and status labels.

**The Working-Type Rule.** Product chrome uses the sans family. Serif is reserved for major orientation and high-value result moments.

## Elevation

Dark surfaces use tonal layering and hairline borders rather than decorative shadow. Light prospect outputs may use restrained navy-tinted shadows. Lucra Play glow appears only for live or focused states.

### Shadow Vocabulary
- **Light ambient:** `0 4px 16px rgba(6,29,59,0.10), 0 2px 6px rgba(6,29,59,0.06)` for elevated light outputs.
- **Play focus:** `0 0 0 1px rgba(138,233,26,0.35), 0 8px 30px rgba(138,233,26,0.20)` for active or focus state only.

**The Flat-at-Rest Rule.** Dark working surfaces are separated by tone and a one-pixel line. Shadow must communicate state or hierarchy.

## Components

### Buttons
- **Shape:** confident rounded corners (10px), never pillowy.
- **Primary:** Lucra Play background with Deep Evergreen text and 12px by 18px padding.
- **Hover / Focus:** brighten slightly; use a visible two-pixel Play focus ring; press scales to 0.97 without moving layout.
- **Secondary:** transparent or midnight surface with a strong hairline border.

### Chips
- **Style:** compact, rounded, and stateful; inactive chips use muted text and a hairline border.
- **State:** selected chips use a low-chroma Play tint and Play text, not a saturated filled pill for every option.

### Cards / Containers
- **Corner Style:** 14px for true grouped surfaces only.
- **Background:** tonal dark layers; light only for prospect-safe or print content.
- **Shadow Strategy:** flat on dark; ambient on light.
- **Border:** one-pixel translucent white on dark.
- **Internal Padding:** 16px to 24px depending on information density.

### Inputs / Fields
- **Style:** Raised Ink fill, one-pixel hairline, 10px radius, persistent visible label.
- **Focus:** Play border and two-pixel external focus ring.
- **Error / Disabled:** errors pair color with text; disabled fields remain readable and clearly unavailable.

### Navigation
- Use a compact top-level workflow rail with Guided Setup, Core ROI, and Gamification visible. Place remaining calculators in a clearly labeled More Tools menu or secondary rail. Active state uses Play color plus weight and shape, never color alone. On narrow screens, navigation becomes a horizontal overflow-safe selector or compact menu with a persistent current-workflow label.

### Deal Archetype Selector
- Present a small set of credible starting scenarios with plain-language differences and visible assumptions. Selection pre-fills values but never hides what changed.

## Do's and Don'ts

### Do:
- **Do** use Lucra Play (#8AE91A) for primary action, selection, progress, and verified success.
- **Do** keep calculations and assumptions visible and auditable during guided setup.
- **Do** use local Lucra logos and the approved token system.
- **Do** separate internal guidance from prospect-safe output explicitly.
- **Do** maintain WCAG 2.2 AA contrast, keyboard paths, focus states, and reduced motion.

### Don't:
- **Don't** build a generic SaaS dashboard made from repeated identical cards.
- **Don't** use casino, sportsbook, luck-forward, or gambling visual language.
- **Don't** use decorative neon, glassmorphism, gradient text, or dark-mode glow everywhere.
- **Don't** present a spreadsheet-like wall of inputs with no guided sequence.
- **Don't** use side-stripe borders, nested cards, or modals as the first interaction pattern.
- **Don't** expose internal coaching, unsupported claims, or unlabelled assumptions in prospect-facing output.
