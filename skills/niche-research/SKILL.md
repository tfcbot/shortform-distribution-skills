---
name: sfd-niche-research
description: Scrape and analyze top-performing content on Instagram to build a data-driven content strategy. Walk the user through identifying ICP accounts, analyzing hooks and formats, and building a research brief.
requires:
  env:
    - VIDJUTSU_API_KEY
compatibility: Requires vidjutsu-api skill for endpoint reference.
homepage: https://github.com/tfcbot/shortform-distribution-skills
source: https://github.com/tfcbot/shortform-distribution-skills
---

# Niche Research

Skill for researching niche content performance on Instagram using the platform scrape and analyze endpoints.

## Walkthrough

### Step 1 — Define the Niche

Ask the user for:
- **Niche** — what space are they in?
- **Goal** — what does performing well mean for them? (views, likes, comments, shares, followers)
- **Known competitors** — any accounts they already know are doing well?

### Step 2 — Search for Top Accounts

Search Instagram for top-performing accounts:

```
POST /scrape { "platform": "instagram", "action": "search", "params": { "keyword": "[NICHE_KEYWORD]" } }
```

Collect 10-15 accounts.

### Step 3 — Analyze Top Content

For each top-performing post, run a breakdown:

```
POST /analyze {
  "mediaUrl": "[POST_URL]",
  "mode": "breakdown"
}
```

Extract:
- **Hook** — what stops the scroll in the first 1-2 seconds?
- **Format** — talking head, b-roll, slideshow, text overlay, etc.
- **Length** — optimal duration for this niche
- **Transitions** — cuts, zooms, speed ramps
- **CTA style** — how do they drive action?

### Step 4 — Build Research Brief

Compile findings into a structured brief:

1. **Top hooks** — ranked by engagement
2. **Winning formats** — which content types perform best
3. **Posting patterns** — frequency, timing, caption styles
4. **Content gaps** — topics the niche wants but nobody is making
5. **Hashtag clusters** — 3-5 hashtag groups that drive discovery

Present the brief to the user. This informs all content generation.

## Key Behaviors

- 10 credits per scrape
- Always present findings before generating content
- Look for content gaps, not just what's popular — differentiation matters
