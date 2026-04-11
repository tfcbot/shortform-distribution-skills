---
name: publisher
description: >-
  Schedule content to connected accounts and manage account connections via Zernio.
  Handles media upload, caption writing, timing, and account verification.
requires:
  env:
    - ZERNIO_API_KEY
compatibility: Account must be connected via Zernio dashboard and visible in GET /accounts.
homepage: https://github.com/tfcbot/agent-video-team
source: https://github.com/tfcbot/agent-video-team
---

# Publisher

Schedule content to connected Instagram accounts via Zernio and manage account connections. Handles media upload, caption writing, timing, and account health.

Base URL: `https://zernio.com/api/v1`
Auth header: `Authorization: Bearer $ZERNIO_API_KEY`

---

## Account Management

### Connect Account

Direct the user to connect their Instagram account through Zernio's web dashboard:

1. Go to [zernio.com](https://zernio.com) and log in.
2. Navigate to the accounts/connections section.
3. Follow the OAuth flow to connect an Instagram account.

Zernio handles the Instagram authentication — there is no API endpoint to provision accounts. All connections happen through the dashboard.

### Verify Connection

```
GET /accounts
Authorization: Bearer $ZERNIO_API_KEY
```

Returns an array of connected accounts. Confirm the expected account appears. Note the `_id` for scheduling.

### Account Health

- **Disconnected accounts** — OAuth tokens can expire. Re-authorize via dashboard.
- **Engagement drops** — may indicate algorithm penalties.
- **Account restrictions** — content policy violations on the platform side.

### Multiple Accounts

Each account appears in `GET /accounts`. Connect one at a time and verify each.

---

## Scheduling

### Step 1 — Verify Account

```
GET /accounts
Authorization: Bearer $ZERNIO_API_KEY
```

Only schedule to accounts that appear in this list.

### Step 2 — Upload Media

**Get presigned URL:**

```
POST /media/presign
Authorization: Bearer $ZERNIO_API_KEY

{
  "filename": "video.mp4",
  "contentType": "video/mp4"
}
```

**Upload file to presigned URL:**

```
PUT [uploadUrl]
Content-Type: video/mp4

[raw file bytes]
```

Use the `publicUrl` when creating the post.

### Step 3 — Write Caption

- Keep it short — 1-3 lines max.
- Include a CTA — "Link in bio", "DM me [keyword]", etc.
- Use 3-5 relevant hashtags — niche-specific, not generic.
- Match the character's voice from the channel spec.

### Step 4 — Create Post

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

Set `publishNow: true` to post immediately.

### Step 5 — Confirm

```
GET /posts
Authorization: Bearer $ZERNIO_API_KEY
```

Update: `PUT /posts/:id` | Cancel: `DELETE /posts/:id`

## Timing

- Post 1-2x per day per account.
- Space posts 8-12 hours apart if posting twice.
- Default to 9am and 6pm in the account's timezone.

## Key Behaviors

- **Never schedule to an account not in `GET /accounts`.**
- **Always upload media first** via presign flow.
- **Scheduling and post creation happen in one call.**
- **Don't batch-schedule 30 days** — schedule 3-7 days ahead max.
