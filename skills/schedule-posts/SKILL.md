---
name: sfd-schedule-posts
description: Schedule content to managed accounts with optimized timing and captions.
requires:
  env:
    - VIDJUTSU_API_KEY
compatibility: Requires vidjutsu-api skill for endpoint reference. Account must be in `active` status.
homepage: https://github.com/tfcbot/shortform-distribution-skills
source: https://github.com/tfcbot/shortform-distribution-skills
---

# Schedule Posts

Schedule content to managed accounts. Handles upload, caption writing, and timing.

## Walkthrough

### Step 1 — Verify Account Status

Before scheduling, confirm the target account is active:

```
GET /accounts?id=acc_xxx
```

Only schedule to accounts with `status: "active"`. Never post to accounts still warming.

### Step 2 — Upload Media

Upload the video to CDN first:

```
POST /v1/upload {
  "file": "[VIDEO_FILE]",
  "type": "video"
}
```

Returns `{ url: "https://cdn.vidjutsu.ai/..." }`.

### Step 3 — Write Caption

Generate a caption based on the video content and channel strategy:
- **Keep it short** — 1-3 lines max
- **Include a CTA** — "Link in bio", "DM me [keyword]", etc.
- **Use 3-5 relevant hashtags** — niche-specific, not generic
- **Match the character's voice** — refer to the channel spec

### Step 4 — Schedule

```
POST /v1/posts {
  "accountId": "acc_xxx",
  "mediaUrl": "[CDN_URL]",
  "caption": "[CAPTION]",
  "scheduledAt": "[ISO_TIMESTAMP]"
}
```

To create a draft without scheduling (free, 0 credits):

```
POST /v1/posts {
  "accountId": "acc_xxx",
  "mediaUrl": "[CDN_URL]",
  "caption": "[CAPTION]",
  "draft": true
}
```

### Step 5 — Confirm

Verify the post was created:

```
GET /v1/posts?accountId=acc_xxx
```

## Timing

- **Post 1-2x per day** per account. More than that risks algorithm penalties.
- **Space posts 8-12 hours apart** if posting twice.
- **Best times vary by niche** — use analytics data if available, otherwise default to 9am and 6pm EST.

## Key Behaviors

- **Never schedule to an account that isn't `active`.**
- **Always upload media first**, then reference the CDN URL in the post.
- **Drafts are free** (0 credits). Scheduled posts cost 36 credits each.
- **Captions should match the channel character's voice.**
- **Don't batch-schedule 30 days at once** — schedule 3-7 days ahead max so you can adjust based on performance.
