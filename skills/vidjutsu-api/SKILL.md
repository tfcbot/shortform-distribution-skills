---
name: sfd-api
description: Call the VidJutsu API to manage Instagram accounts, schedule posts, scrape niche content, and analyze media.
requires:
  env:
    - VIDJUTSU_API_KEY
compatibility: Requires VIDJUTSU_API_KEY. Obtain via Stripe checkout at POST /v1/api_keys.
homepage: https://github.com/tfcbot/shortform-distribution-skills
source: https://github.com/tfcbot/shortform-distribution-skills
---

# VidJutsu API

Procedural knowledge for agents to call the VidJutsu API.

## Authentication

- **Environment variable**: `VIDJUTSU_API_KEY`
- **Header**: `X-Api-Key: <VIDJUTSU_API_KEY>`
- If the key is missing, inform the user they must set it.

## Base URL

`https://api.vidjutsu.ai/v1`

## API Versioning

Header: `VidJutsu-Version: 2026-03-25`

---

## API Keys

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

### POST /api_keys/rotate

Rotate API key. Requires `X-Api-Key` header. Old key is immediately invalidated.

**Response** (200):
```json
{"apiKey": "vj_prod_...", "clientId": "mc_...", "message": "Key rotated..."}
```

### POST /api_keys/recover

Recover API key via email.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Email used during checkout |

---

## Accounts

### POST /accounts

Create a managed Instagram account. 990 credits. Max 3 accounts per user.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `platform` | string | Yes | `instagram` (only supported platform) |
| `name` | string | No | Account display name |
| `username` | string | No | Preferred username |
| `bio` | string | No | Account biography |
| `profilePictureUrl` | string | No | Profile picture URL |
| `linkInBio` | string | No | Link in bio URL |
| `country` | string | No | Target country |
| `niche` | string | No | Niche keyword for warming |

**Response** (202):
```json
{"id": "acc_...", "status": "creating", "creditsCharged": 990}
```

### GET /accounts

List all accounts for the authenticated client. Use `?id=acc_xxx` for a single account.

**Response** (200 list):
```json
{"data": [{"accountId": "acc_...", "platform": "instagram", "status": "active", ...}]}
```

**Response** (200 single — `?id=acc_xxx`):
```json
{"accountId": "acc_...", "platform": "instagram", "status": "active", ...}
```

### DELETE /accounts?id=acc_xxx

Soft-delete an account. Sets status to `deleted`.

---

## Analytics

### GET /analytics?accountId=acc_xxx

Get account-level analytics (cached, refreshed hourly). Instagram only.

### POST /analytics/refresh

Force-refresh analytics for an account.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `accountId` | string | Yes | Target account ID |

### GET /analytics/videos?accountId=acc_xxx

Get per-video performance stats. Instagram only.

---

## Upload

### POST /upload

Upload a file via raw binary body. Send file bytes directly with `Content-Type` header. Max 100MB.

**Response** (201):
```json
{"id": "file_...", "url": "https://...", "clientId": "mc_..."}
```

### POST /upload/url

Upload from an external URL.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sourceUrl` | string | Yes | URL of media to upload |
| `contentType` | string | No | MIME type (e.g. `video/mp4`) |

**Response** (201):
```json
{"id": "file_...", "url": "https://...", "clientId": "mc_..."}
```

---

## Posts

### POST /posts

Schedule a post or create a draft. 36 credits for scheduling, 0 for drafts.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `accountId` | string | Yes (scheduling) | Target account ID. Not required for drafts. |
| `videoId` | string | No | VidJutsu video ID |
| `videoUrl` | string | No | Any video URL |
| `caption` | string | No | Post caption |
| `brief` | object | No | Content brief metadata |
| `scheduledAt` | number | No | Unix timestamp for scheduling |
| `draft` | boolean | No | Set `true` to create a draft (0 credits) |

Either `videoId` or `videoUrl` required.

**Response** (201 draft / 202 scheduled):
```json
{"id": "post_...", "status": "draft|scheduled", "creditsCharged": 0|36}
```

### GET /posts

List all posts for the authenticated client. Use `?id=post_xxx` for a single post, or `?accountId=acc_xxx` to filter by account.

### POST /posts/assign

Assign a draft post to an account.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `postId` | string | Yes | Draft post ID |
| `accountId` | string | Yes | Target account ID |

### POST /posts/duplicate

Duplicate a post, optionally to a different account.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `postId` | string | Yes | Post ID to duplicate |
| `accountId` | string | No | Target account (defaults to same) |

---

## Scraping

### POST /scrape

Scrape platform content for niche research. 10 credits.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `platform` | string | No | `instagram` |
| `action` | string | No | `search` |
| `params` | object | No | `{ "keyword": "[NICHE_KEYWORD]" }` |

---

## Media Analysis

### POST /analyze

Analyze media content. 10 credits.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mediaUrl` | string | Yes | URL of media to analyze |
| `mode` | string | Yes | `critic`, `verify`, or `breakdown` |
| `mediaType` | string | No | `image` or `video` |
| `context` | string | No | Additional context (critic mode) |
| `description` | string | No | Original description to verify against (verify mode) |
| `keyframeDescriptions` | array | No | Per-keyframe descriptions (verify mode) |
| `prompt` | string | No | Analysis prompt (breakdown mode) |

---

## Campaigns

### POST /campaigns/estimate

Estimate campaign cost. No auth required.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `platform` | string | Yes | `instagram` |
| `accountCount` | number | No | Number of accounts (default 1) |
| `postsPerAccount` | number | No | Posts per account (default 1) |

### POST /campaigns

Create a campaign. Credits deducted upfront.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `platform` | string | Yes | `instagram` |
| `accountCount` | number | Yes | 1-50 accounts |
| `postsPerAccount` | number | Yes | 1-20 posts per account |
| `name` | string | No | Campaign name |
| `niche` | string | No | Niche keyword |
| `country` | string | No | Target country |
| `accountProfiles` | array | No | Per-account profile overrides |

**Response** (201):
```json
{"id": "cmp_...", "status": "draft", "creditsCost": 47520, "breakdown": {...}, "accounts": ["acc_..."], "posts": ["post_..."]}
```

### GET /campaigns

List all campaigns. Use `?id=cmp_xxx` for a single campaign with account/post details.

### POST /campaigns/execute

Start executing a campaign (provision and warm accounts).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `campaignId` | string | Yes | Campaign ID |

### POST /campaigns/cancel

Cancel a campaign and refund credits.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `campaignId` | string | Yes | Campaign ID |

---

## Balance & Subscriptions

### GET /balance — Credit balance and client ID
### GET /pricing — Current pricing and credit costs
### POST /subscriptions — Create monthly subscription ($59/mo, 100 credits)
### GET /info — Full API info with all endpoint paths

---

## Common Workflows

### Managed page + external content

```
1. POST /accounts {platform: "instagram", name: "fitpage", niche: "fitness"}
2. POST /upload/url {sourceUrl: "https://...video.mp4"}
3. POST /posts {accountId: "acc_...", videoUrl: "https://cdn-url", caption: "..."}
```

### Niche research → content strategy

```
1. POST /scrape {platform: "instagram", action: "search", params: {keyword: "fitness"}}
2. POST /analyze {mediaUrl: "...", mode: "breakdown"}
```

### Draft → assign → schedule

```
1. POST /posts {videoUrl: "...", caption: "...", draft: true}
2. POST /posts/assign {postId: "post_...", accountId: "acc_..."}
```
