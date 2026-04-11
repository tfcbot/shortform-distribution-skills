---
name: researcher
description: Scrape and analyze top-performing content on Instagram and TikTok to build a data-driven content strategy. Walk the user through identifying ICP accounts, analyzing hooks and formats, and building a research brief.
requires:
  env:
    - SCRAPE_CREATORS_API
    - VIDJUTSU_API_KEY
compatibility: Requires Scrape Creators API for scraping and VidJutsu API for video analysis via watch.
homepage: https://github.com/tfcbot/agent-video-team
source: https://github.com/tfcbot/agent-video-team
---

# Researcher

Skill for researching niche content performance on Instagram and TikTok using Scrape Creators for data collection and VidJutsu for video analysis.

## APIs

### Scrape Creators

- **Base URL**: `https://api.scrapecreators.com`
- **Auth header**: `x-api-key: <SCRAPE_CREATORS_API>`

### VidJutsu (watch only)

- **Base URL**: `https://api.vidjutsu.ai/v1`
- **Auth header**: `Authorization: Bearer <VIDJUTSU_API_KEY>`

---

## Walkthrough

### Step 1 — Define the Niche

Ask the user for:
- **Niche** — what space are they in?
- **Platform** — Instagram, TikTok, or both?
- **Goal** — what does performing well mean for them? (views, likes, comments, shares, followers)
- **Known competitors** — any accounts they already know are doing well?

### Step 2 — Search for Top Content

#### Instagram — search reels by keyword

```
POST https://api.scrapecreators.com/v2/instagram/reels/search
x-api-key: <SCRAPE_CREATORS_API>

{ "keyword": "[NICHE_KEYWORD]" }
```

#### TikTok — search by keyword

```
POST https://api.scrapecreators.com/v1/tiktok/search/keyword
x-api-key: <SCRAPE_CREATORS_API>

{ "keyword": "[NICHE_KEYWORD]" }
```

#### TikTok — search by hashtag

```
POST https://api.scrapecreators.com/v1/tiktok/search/hashtag
x-api-key: <SCRAPE_CREATORS_API>

{ "hashtag": "[HASHTAG]" }
```

Collect 10-15 top-performing posts across platforms.

### Step 3 — Gather Account Details

For each promising creator, pull their profile:

#### Instagram

```
POST https://api.scrapecreators.com/v1/instagram/profile
x-api-key: <SCRAPE_CREATORS_API>

{ "username": "[HANDLE]" }
```

Then get their recent reels (paginated):

```
POST https://api.scrapecreators.com/v1/instagram/user/reels
x-api-key: <SCRAPE_CREATORS_API>

{ "username": "[HANDLE]" }
```

For a specific post's details:

```
POST https://api.scrapecreators.com/v1/instagram/post
x-api-key: <SCRAPE_CREATORS_API>

{ "url": "[POST_URL]" }
```

For comments on a post:

```
POST https://api.scrapecreators.com/v2/instagram/post/comments
x-api-key: <SCRAPE_CREATORS_API>

{ "url": "[POST_URL]" }
```

#### TikTok

```
POST https://api.scrapecreators.com/v1/tiktok/profile
x-api-key: <SCRAPE_CREATORS_API>

{ "username": "[HANDLE]" }
```

Get a specific video with transcript:

```
POST https://api.scrapecreators.com/v2/tiktok/video
x-api-key: <SCRAPE_CREATORS_API>

{ "url": "[VIDEO_URL]" }
```

### Step 4 — Analyze Top Content

For each top-performing video, run a VidJutsu watch:

```
POST https://api.vidjutsu.ai/v1/watch
Authorization: Bearer <VIDJUTSU_API_KEY>

{
  "mediaUrl": "[VIDEO_URL]",
  "prompt": "Analyze this video. Return: hook text, format, pacing, transitions, CTA, tags."
}
```

Extract from each analysis:
- **Hook** — what stops the scroll in the first 1-2 seconds?
- **Format** — talking head, b-roll, slideshow, text overlay, etc.
- **Length** — optimal duration for this niche
- **Transitions** — cuts, zooms, speed ramps
- **CTA style** — how do they drive action?

### Step 5 — Build Research Brief

Compile findings into a structured brief:

1. **Top hooks** — ranked by engagement
2. **Winning formats** — which content types perform best
3. **Posting patterns** — frequency, timing, caption styles
4. **Content gaps** — topics the niche wants but nobody is making
5. **Hashtag clusters** — 3-5 hashtag groups that drive discovery
6. **Platform differences** — what works on Instagram vs TikTok (if both were researched)

Present the brief to the user. This informs all content generation.

## Key Behaviors

- 10 credits per VidJutsu watch call
- Scrape Creators calls are billed separately via Scrape Creators account
- Always present findings before generating content
- Look for content gaps, not just what's popular — differentiation matters
- Use comments data to understand audience sentiment and unmet needs
