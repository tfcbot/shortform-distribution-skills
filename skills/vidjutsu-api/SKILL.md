---
name: sfd-api
description: VidJutsu — Video Intelligence API. Watch, extract, transcribe, check. The server-side gaps your agent can't fill.
requires:
  env:
    - VIDJUTSU_API_KEY
compatibility: Requires VIDJUTSU_API_KEY. Obtain via Stripe checkout at POST /v1/api_keys.
homepage: https://github.com/tfcbot/shortform-distribution-skills
source: https://github.com/tfcbot/shortform-distribution-skills
---

# VidJutsu — Video Intelligence API

Watch, extract, transcribe, check. The server-side gaps your agent can't fill.

## Authentication

- **Environment variable**: `VIDJUTSU_API_KEY`
- **Header**: `X-Api-Key: <VIDJUTSU_API_KEY>`
- If the key is missing, inform the user they must set it.

## Base URL

`https://api.vidjutsu.ai/v1`

---

## Video Intelligence

### POST /watch

Gemini watches the video and responds to a freeform prompt. Returns structured JSON. 10 credits.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mediaUrl` | string | Yes | URL of media to watch |
| `prompt` | string | Yes | Freeform prompt — what to look for, how to respond |

**Response** (200):
```json
{
  "result": { ... }
}
```

The shape of `result` depends on your prompt. Ask for scores, lists, comparisons — Gemini follows instruction.

### POST /extract

FFmpeg extraction — frames, audio, or metadata. 5 credits.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mediaUrl` | string | Yes | URL of media to extract from |
| `frames` | string | No | `"first"`, `"last"`, `"auto"` (key frames), or `"all"` |
| `audio` | boolean | No | Extract audio track |
| `metadata` | boolean | No | Extract technical metadata |

**Response** (200):
```json
{
  "frames": ["https://cdn.../frame_001.jpg", "https://cdn.../frame_002.jpg"],
  "audio": "https://cdn.../audio.mp3",
  "metadata": { "duration": 12.5, "fps": 30, "resolution": "1080x1920" }
}
```

Fields returned depend on what you requested.

### POST /transcribe

Speech-to-text with word-level timing. 10 credits.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mediaUrl` | string | Yes | URL of media to transcribe |

**Response** (200):
```json
{
  "text": "full transcript here",
  "words": [
    {"word": "full", "start": 0.1, "end": 0.3},
    {"word": "transcript", "start": 0.35, "end": 0.7},
    {"word": "here", "start": 0.75, "end": 0.9}
  ]
}
```

### POST /check

Validate video against spec rules. 5 credits.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mediaUrl` | string | Yes | URL of media to check |
| `rules` | array | No | Rule IDs to check against (defaults to client's saved rules) |

**Response** (200):
```json
{
  "passed": false,
  "violations": [
    {"rule": "MIN_DURATION", "message": "Video is 4.2s, minimum is 5s", "severity": "error"}
  ]
}
```

### GET /check/rules

Load per-client custom rules. 0 credits.

**Response** (200):
```json
{
  "rules": [
    {"id": "MIN_DURATION", "params": {"min": 5}},
    {"id": "MAX_DURATION", "params": {"max": 60}},
    {"id": "ASPECT_RATIO", "params": {"ratio": "9:16"}}
  ]
}
```

### PUT /check/rules

Save per-client custom rules. 0 credits.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rules` | array | Yes | Array of rule objects with `id` and `params` |

---

## Upload

### POST /upload

Upload media binary. Send file bytes directly with `Content-Type` header. Max 100MB. 0 credits.

**Response** (201):
```json
{"assetId": "asset_...", "url": "https://..."}
```

### POST /upload/url

Upload from an external URL. 0 credits.

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

Pure data records for organizing content by account. No provisioning or actions. 0 credits.

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

Pure data records for tracking content. No scheduling or publishing. 0 credits.

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

## Assets

Pure data records for uploaded media. 0 credits.

### GET /assets

List assets. Filter: `?tag.key=value`.

### GET /assets?id=asset_xxx

Get a single asset.

### DELETE /assets?id=asset_xxx

Soft-delete an asset.

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

### QA gate before posting

```
1. POST /watch {mediaUrl: "https://...video.mp4", prompt: "Score quality 1-10. List issues with severity for: face consistency, artifacts, motion, audio sync."}
2. If score >= 8, proceed to post
```

### Deep analysis for content strategy

```
1. POST /watch {mediaUrl: "https://...", prompt: "Analyze this video. Return: hook text, format, pacing, transitions, CTA, tags."}
2. Use result to inform next video
```

### Speech verification

```
1. POST /transcribe {mediaUrl: "https://...video.mp4"}
2. Compare transcript word-by-word against intended dialogue
```

### Frame chaining for multi-scene videos

```
1. POST /extract {mediaUrl: "https://...scene1.mp4", frames: "last"}
2. Use returned frame URL as starting image for next scene
```

### Spec validation

```
1. GET /check/rules — load your saved rules
2. POST /check {mediaUrl: "https://...video.mp4"} — validate against rules
3. Fix violations, regenerate if needed
```

### Track content with accounts and posts

```
1. POST /accounts {platform: "instagram", name: "fitpage", handle: "@fitpage", tags: [{"key": "tier", "value": "gold"}]}
2. POST /posts {videoUrl: "https://...", caption: "...", accountId: "acc_...", tags: [{"key": "batch", "value": "april-2026"}]}
3. GET /posts?accountId=acc_xxx
```
