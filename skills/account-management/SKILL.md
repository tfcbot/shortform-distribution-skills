---
name: sfd-account-management
description: Provision, warm, and manage rapid-scale growth accounts for shortform content via VidJutsu. Walk the user through account creation, warming, and monitoring.
requires:
  env:
    - VIDJUTSU_API_KEY
compatibility: Requires vidjutsu-api skill for endpoint reference.
homepage: https://github.com/tfcbot/shortform-distribution-skills
source: https://github.com/tfcbot/shortform-distribution-skills
---

# Account Management

Managed accounts are not your personal accounts. They are rapid-scale growth channels — provisioned, warmed up, and posting within 7 days. You don't log into them or manage them directly. This protects your main presence from shadowbans and algorithm penalties that come with aggressive posting schedules while giving you dedicated distribution channels for your content.

Account provisioning is handled by [VidJutsu](https://docs.vidjutsu.ai) — full end-to-end managed accounts with US-based account managers, built-in analytics, and link-in-bio monetization.

## Setup

Requires `VIDJUTSU_API_KEY` — get one at [docs.vidjutsu.ai/quickstart](https://docs.vidjutsu.ai/quickstart).

```bash
export VIDJUTSU_API_KEY=your_key_here
```

API reference: See [vidjutsu-api/SKILL.md](../vidjutsu-api/SKILL.md) for full endpoint docs.

## Walkthrough

### Step 1 — Collect Information

Ask the user for:
- **Platform** — `instagram` or `tiktok`
- **Niche** — what space will this account operate in?
- **Account name** — preferred handle or name
- **Number of accounts** — how many do they need? (max 3 per user)

### Step 2 — Provision Account

```
POST /accounts {
  "platform": "instagram",
  "name": "[ACCOUNT_NAME]",
  "username": "[OPTIONAL_USERNAME]",
  "bio": "[OPTIONAL_BIO]",
  "profilePictureUrl": "[OPTIONAL_URL]",
  "linkInBio": "[OPTIONAL_LINK]",
  "country": "[OPTIONAL_COUNTRY]",
  "niche": "[NICHE]"
}
```

Returns `{ id: "acc_xxx", status: "creating", creditsCharged: 990 }`.

Inform the user:
- Account creation is handled by a US-based account manager (real person)
- The account will warm for up to 7 days before posting starts
- No content goes live until warming is complete

### Step 3 — Monitor Status

Poll account status:

```
GET /accounts?id=acc_xxx
```

Status progression: `creating` → `active`.

Update the user at each stage. Do not schedule posts until status is `active`.

### Step 4 — Account Health

Monitor for issues:
- **Engagement drops** — may indicate algorithm penalties
- **Account restrictions** — content policy violations

### Step 5 — Multiple Accounts

For Scale plan users (up to 3 accounts):
- Each account can target a different niche
- Each account can point to a different link
- Provision accounts sequentially — don't create all at once

```
GET /accounts
```

Lists all accounts with their status and platform.

## Key Behaviors

- 990 credits per account — covers provisioning, warming, and ongoing management
- Maximum 3 accounts per user
- Never schedule posts to an account that isn't `active`
- Accounts are managed by real people — these are not bot accounts
- Accounts are provisioned fresh — you cannot connect existing accounts
