---
name: sfd-schedule-posts
description: Schedule content to connected accounts with optimized timing and captions via Zernio.
requires:
  env:
    - ZERNIO_API_KEY
compatibility: Account must be connected via Zernio dashboard and visible in GET /accounts.
homepage: https://github.com/tfcbot/shortform-distribution-skills
source: https://github.com/tfcbot/shortform-distribution-skills
---

# Schedule Posts

Schedule content to connected Instagram accounts via Zernio. Handles media upload, caption writing, and timing.

Base URL: `https://zernio.com/api/v1`
Auth header: `Authorization: Bearer $ZERNIO_API_KEY`

## Walkthrough

### Step 1 — Verify Account Connection

Before scheduling, confirm the target account is connected:

```
GET /accounts
Authorization: Bearer $ZERNIO_API_KEY
```

Find the account in the response and note its `_id` and `platform`. Only schedule to accounts that appear in this list.

### Step 2 — Upload Media

Upload video using Zernio's presigned URL flow:

**2a — Get a presigned upload URL:**

```
POST /media/presign
Authorization: Bearer $ZERNIO_API_KEY

{
  "filename": "video.mp4",
  "contentType": "video/mp4"
}
```

Returns `{ "uploadUrl": "https://...", "publicUrl": "https://..." }`.

**2b — Upload the file to the presigned URL:**

```
PUT [uploadUrl]
Content-Type: video/mp4

[raw file bytes]
```

**2c — Use the `publicUrl`** as the media reference when creating the post.

### Step 3 — Write Caption

Generate a caption based on the video content and channel strategy:
- **Keep it short** — 1-3 lines max.
- **Include a CTA** — "Link in bio", "DM me [keyword]", etc.
- **Use 3-5 relevant hashtags** — niche-specific, not generic.
- **Match the character's voice** — refer to the channel spec.

### Step 4 — Create and Schedule Post

Create a post with scheduling in a single call:

```
POST /posts
Authorization: Bearer $ZERNIO_API_KEY

{
  "content": "[CAPTION]",
  "mediaItems": ["[PUBLIC_URL]"],
  "platforms": [
    {
      "accountId": "[ACCOUNT_ID]",
      "platform": "instagram",
      "platformSpecificData": {
        "contentType": "reel"
      }
    }
  ],
  "scheduledFor": "2026-04-10T14:00:00.000Z",
  "timezone": "America/New_York",
  "publishNow": false
}
```

- `scheduledFor` — ISO 8601 timestamp for when to publish.
- `timezone` — IANA timezone string.
- `publishNow` — set to `true` to post immediately instead of scheduling.
- `platformSpecificData.contentType` — set to `"reel"` for Instagram Reels.

To publish immediately, set `publishNow: true` and omit `scheduledFor`.

### Step 5 — Confirm

Verify the post was created:

```
GET /posts
Authorization: Bearer $ZERNIO_API_KEY
```

Check that your post appears with the correct scheduled time and status.

To update a scheduled post before it publishes:

```
PUT /posts/:id
Authorization: Bearer $ZERNIO_API_KEY

{
  "content": "[UPDATED_CAPTION]",
  "scheduledFor": "2026-04-10T18:00:00.000Z"
}
```

To cancel a scheduled post:

```
DELETE /posts/:id
Authorization: Bearer $ZERNIO_API_KEY
```

## Timing

- **Post 1-2x per day** per account. More than that risks algorithm penalties.
- **Space posts 8-12 hours apart** if posting twice.
- **Best times vary by niche** — use analytics data if available, otherwise default to 9am and 6pm in the account's timezone.

## Key Behaviors

- **Never schedule to an account that isn't in `GET /accounts`.**
- **Always upload media first** via the presign flow, then reference the `publicUrl` in the post.
- **Scheduling and post creation happen in one call** — there is no separate schedule endpoint.
- **Captions should match the channel character's voice.**
- **Don't batch-schedule 30 days at once** — schedule 3-7 days ahead max so you can adjust based on performance.
- **Zernio handles billing separately** — there is no per-post credit charge through the API.
