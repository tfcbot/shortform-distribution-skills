---
name: strategist
description: Create a one-page channel spec — character, handle, format, niche, and 30-day content calendar for a managed account.
requires:
  env: []
compatibility: Works standalone. Pairs with researcher for data-driven format selection.
homepage: https://github.com/tfcbot/agent-video-team
source: https://github.com/tfcbot/agent-video-team
---

# Strategist

Create a one-page channel spec for a managed account. Each channel is a character with a handle, visual identity, content format, and 30-day posting calendar.

## Walkthrough

### Step 1 — Understand the Product

Ask the user for:
- **Product or service** — what are they promoting?
- **Target audience** — who is the ideal viewer?
- **Link destination** — where does the bio link go? (Skool, Shopify, Calendly, landing page, etc.)
- **Niche** — what space does this channel operate in?

### Step 2 — Define the Character

Every channel is a persona. Build a character sheet:

| Field | Description |
|-------|-------------|
| **Name** | First name only. Memorable, fits the niche. |
| **Appearance** | Age range, style, setting. Enough for AI generation. |
| **Setting** | Where they film — desk setup, car, kitchen, gym, etc. |
| **Personality** | How they speak. Honest, hype, chill, nerdy, etc. |

### Step 3 — Define the Handle & Bio

- **Handle** — `@name.niche.keyword` format. Short, searchable.
- **Bio** — One line that hooks. End with a down arrow ↓ pointing to the link.
- **Link** — The conversion destination.

### Step 4 — Define the Format

Pick one format per channel. Keep it consistent.

| Element | Description |
|---------|-------------|
| **Duration** | 8-15 seconds typical. Never over 30. |
| **Structure** | Hook → Insight → Incomplete loop (viewer needs more). |
| **Style** | Talking head, b-roll, screen recording, etc. |

The format should be repeatable for 30+ videos without feeling stale.

### Step 5 — Build the 30-Day Calendar

Create a table of 30 videos:

| # | Hook | Tip |
|---|------|-----|
| 1 | "..." | "..." |
| 2 | "..." | "..." |
| ... | ... | ... |

Each row is one video. The hook is what appears in the first 2 seconds. The tip is the core insight — specific enough to be useful, incomplete enough to drive curiosity.

## Output

The final channel spec is a single markdown file containing:
1. Character sheet
2. Handle & bio
3. Format definition
4. 30-day content calendar

## Key Behaviors

- **One format per channel.** Don't mix talking-head and b-roll on the same account.
- **Hooks must be under 8 words.** If it takes longer to read than to say, it's too long.
- **Every tip should be incomplete.** The viewer should need to visit the link to get the full picture.
- **Characters should feel real.** Don't make them generic. Give them opinions and quirks.
- **30 videos minimum.** If you can't fill 30 days with one format, the niche is too narrow.
