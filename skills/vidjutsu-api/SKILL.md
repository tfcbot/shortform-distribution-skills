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

`https://vidjutsu.ai/v1`

## API Versioning

Header: `VidJutsu-Version: 2026-03-25`

---

## Accounts

### POST /accounts

Create a managed Instagram or TikTok account with niche warming.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `platform` | string | Yes | `tiktok` or `instagram` |
| `niche` | string | No | Niche keyword for warming targeting |

**Response** (202):
```json
{"accountId": "acc_...", "status": "warming", "platform": "instagram"}
```

### GET /accounts — List all accounts
### GET /accounts/:id — Account details
### DELETE /accounts/:id — Delete account

---

## Posts

### POST /posts

Schedule a post to a managed account.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `accountId` | string | Yes | Target account ID |
| `videoId` | string | No | VidJutsu video ID |
| `mediaUrl` | string | No | Any external media URL |
| `caption` | string | No | Post caption |
| `scheduledAt` | number | No | Unix timestamp |

Either `videoId` or `mediaUrl` required. Accepts any media URL.

### GET /posts — List posts (supports `?accountId=` filter)
### GET /posts/:id — Post details including metrics

---

## Scraping

### POST /scrape

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | Yes | URL to scrape |

---

## Media Analysis

### POST /analyze

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mediaUrl` | string | Yes | URL of media to analyze |
| `mode` | string | No | `critic`, `verify`, or `breakdown` |

---

## Campaigns

### POST /campaigns/estimate — Estimate campaign cost
### POST /campaigns — Create campaign
### GET /campaigns/:id — Campaign status

---

## Balance & Subscriptions

### GET /balance — Credit balance and subscription status
### GET /pricing — Current pricing info
### POST /subscriptions — Create membership subscription

---

## Common Workflows

### Managed page + external content

```
1. POST /accounts {platform: "instagram", niche: "fitness"}
2. POST /posts {accountId, mediaUrl: "https://...", caption: "..."}
```

### Niche research → content strategy

```
1. POST /scrape {url: "https://..."}
2. POST /analyze {mediaUrl: "...", mode: "breakdown"}
```
