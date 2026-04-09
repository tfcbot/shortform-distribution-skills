---
name: sfd-api
description: VidJutsu — Video Intelligence API. The feedback loop your agent is missing. Critic, breakdown, and viral scoring for AI-generated video.
requires:
  env:
    - VIDJUTSU_API_KEY
compatibility: Requires VIDJUTSU_API_KEY. Obtain via Stripe checkout at POST /v1/api_keys.
homepage: https://github.com/tfcbot/shortform-distribution-skills
source: https://github.com/tfcbot/shortform-distribution-skills
---

# VidJutsu — Video Intelligence API

The feedback loop your agent is missing. Critic, breakdown, and viral scoring for AI-generated video.

## Authentication

- **Environment variable**: `VIDJUTSU_API_KEY`
- **Header**: `X-Api-Key: <VIDJUTSU_API_KEY>`
- If the key is missing, inform the user they must set it.

## Base URL

`https://api.vidjutsu.ai/v1`

---

## Video Intelligence

### POST /critic

Score video quality. 10 credits.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mediaUrl` | string | Yes | URL of media to analyze |
| `mediaType` | string | Yes | `image` or `video` |
| `context` | string | No | Additional context for scoring |

**Response** (200):
```json
{
  "score": 7.5,
  "issues": ["Low contrast in opening frame", "Audio peaks at 0:04"],
  "verdict": "pass"
}
```

### POST /breakdown

Deep async video analysis. 10 credits.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mediaUrl` | string | Yes | URL of media to analyze |
| `mediaType` | string | Yes | `image` or `video` |
| `prompt` | string | No | Analysis prompt to guide breakdown |

**Response** (202):
```json
{"id": "va_...", "status": "pending"}
```

### GET /breakdown?id=va_xxx

Poll for breakdown result. Call every 5 seconds until `status` is `completed`.

**Response** (200):
```json
{"id": "va_...", "status": "completed", "result": { ... }}
```

### POST /score

Viral scoring. 10 credits.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mediaUrl` | string | Yes | URL of media to score |
| `mediaType` | string | Yes | `image` or `video` |
| `content` | string | No | Description of the content |
| `niches` | array | No | Target niches (e.g. `["fitness", "health"]`) |
| `type` | string | No | Content type (e.g. `"talking-head"`, `"b-roll"`) |

**Response** (200):
```json
{
  "score": 82,
  "breakdown": {"hook_strength": 9, "pacing": 7, "format_match": 8, "engagement_prediction": 8},
  "suggestions": ["Stronger CTA in last 2 seconds", "Add text overlay for hook"]
}
```

---

## Upload

### POST /upload

Upload media binary. Send file bytes directly with `Content-Type` header. Max 100MB.

**Response** (201):
```json
{"assetId": "asset_...", "url": "https://..."}
```

### POST /upload/url

Upload from an external URL.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sourceUrl` | string | Yes | URL of media to upload |
| `contentType` | string | No | MIME type (e.g. `video/mp4`) |

**Response** (201):
```json
{"assetId": "asset_...", "url": "https://..."}
```

---

## Accounts

Pure data records for organizing content by account. No provisioning or actions.

### POST /accounts

Create an account record.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `platform` | string | Yes | Platform name (e.g. `instagram`, `tiktok`) |
| `name` | string | No | Display name |
| `niche` | string | No | Niche keyword |
| `handle` | string | No | Account handle |
| `bio` | string | No | Account biography |
| `pfp` | string | No | Profile picture URL |
| `linkInBio` | string | No | Link in bio URL |
| `tags` | array | No | Key-value tags (e.g. `[{"key": "tier", "value": "gold"}]`) |

**Response** (201):
```json
{"id": "acc_...", "platform": "instagram", "name": "fitpage"}
```

### PUT /accounts?id=acc_xxx

Update an account record. Send only the fields to update.

### GET /accounts

List accounts. Filter by tag: `?tag.key=value`.

**Response** (200):
```json
{"data": [{"id": "acc_...", "platform": "instagram", "name": "fitpage", "tags": {...}}]}
```

### DELETE /accounts?id=acc_xxx

Soft-delete an account record.

---

## Posts

Pure data records for tracking content. No scheduling or publishing.

### POST /posts

Create a post record.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `videoId` | string | No | VidJutsu video ID |
| `videoUrl` | string | No | Any video URL |
| `caption` | string | No | Post caption |
| `brief` | object | No | Content brief metadata |
| `tags` | array | No | Key-value tags (e.g. `[{"key": "tier", "value": "gold"}]`) |
| `accountId` | string | No | Associated account ID |

**Response** (201):
```json
{"id": "post_...", "videoUrl": "https://...", "caption": "..."}
```

### PUT /posts?id=post_xxx

Update a post record. Send only the fields to update.

### GET /posts

List posts. Filter: `?accountId=acc_xxx`, `?tag.key=value`.

**Response** (200):
```json
{"data": [{"id": "post_...", "videoUrl": "...", "caption": "...", "tags": {...}}]}
```

### DELETE /posts?id=post_xxx

Soft-delete a post record.

---

## Billing

### POST /api_keys

Create an API key via Stripe checkout.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | No | Email for key recovery |
| `credits` | number | No | Initial credits (default 100) |
| `successUrl` | string | No | Redirect URL after checkout |

**Response** (200): Stripe checkout session URL.

### GET /api_keys/status?session=SESSION_ID

Check Stripe session status and retrieve API key after payment.

### GET /balance

Credit balance and client ID.

---

## Common Workflows

### Critic gate before posting

```
1. POST /upload/url {sourceUrl: "https://...video.mp4"}
2. POST /critic {mediaUrl: "https://cdn-url", mediaType: "video"}
3. If verdict is "pass", proceed to post
```

### Deep analysis for content strategy

```
1. POST /breakdown {mediaUrl: "https://...", mediaType: "video", prompt: "Break down hook, pacing, and CTA."}
2. GET /breakdown?id=va_xxx (poll until completed)
3. Use result to inform next video
```

### Score before distributing

```
1. POST /score {mediaUrl: "https://...", mediaType: "video", niches: ["fitness"], type: "talking-head"}
2. If score > 70, distribute. Otherwise iterate.
```

### Track content with accounts and posts

```
1. POST /accounts {platform: "instagram", name: "fitpage", handle: "@fitpage", tags: {"tier": "gold"}}
2. POST /posts {videoUrl: "https://...", caption: "...", accountId: "acc_...", tags: {"batch": "april-2026"}}
3. GET /posts?accountId=acc_xxx
```
