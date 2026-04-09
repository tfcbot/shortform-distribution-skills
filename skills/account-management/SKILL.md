---
name: sfd-account-management
description: Connect and manage Instagram accounts for shortform content distribution via Zernio. Walk the user through connecting accounts and verifying status.
requires:
  env:
    - ZERNIO_API_KEY
homepage: https://github.com/tfcbot/shortform-distribution-skills
source: https://github.com/tfcbot/shortform-distribution-skills
---

# Account Management

Managed accounts are distribution channels you connect through [Zernio](https://zernio.com) for shortform content posting. You connect your existing Instagram accounts via Zernio's dashboard, then use the API to verify they're linked and ready for scheduling.

## Setup

Requires `ZERNIO_API_KEY` — get one from your Zernio dashboard.

```bash
export ZERNIO_API_KEY=your_key_here
```

Base URL: `https://zernio.com/api/v1`
Auth header: `Authorization: Bearer $ZERNIO_API_KEY`

## Walkthrough

### Step 1 — Connect Account via Zernio Dashboard

Direct the user to connect their Instagram account through Zernio's web dashboard:

1. Go to [zernio.com](https://zernio.com) and log in.
2. Navigate to the accounts/connections section.
3. Follow the OAuth flow to connect an Instagram account.

Zernio handles the Instagram authentication — there is no API endpoint to provision or create accounts. All account connections happen through the dashboard.

### Step 2 — Verify Connection

Once the user says they've connected, verify via the API:

```
GET /accounts
Authorization: Bearer $ZERNIO_API_KEY
```

Returns an array of connected accounts:

```json
{
  "accounts": [
    {
      "_id": "abc123",
      "platform": "instagram",
      "handle": "@example",
      ...
    }
  ]
}
```

Confirm the expected account appears in the list. Note the `_id` — you'll need it when scheduling posts.

### Step 3 — Account Health

Monitor connected accounts for issues:
- **Disconnected accounts** — OAuth tokens can expire. If a post fails, have the user re-authorize via the Zernio dashboard.
- **Engagement drops** — may indicate algorithm penalties from posting cadence.
- **Account restrictions** — content policy violations on the platform side.

### Step 4 — Multiple Accounts

Users can connect multiple Instagram accounts through the Zernio dashboard. Each account appears in the `GET /accounts` response.

```
GET /accounts
Authorization: Bearer $ZERNIO_API_KEY
```

Lists all connected accounts with their platform and handle.

For multi-account strategies:
- Each account can target a different niche.
- Each account can have its own posting cadence.
- Connect accounts one at a time and verify each before moving on.

## Key Behaviors

- **Accounts are connected via the Zernio dashboard** — not provisioned via API.
- **Always verify connection with `GET /accounts`** before attempting to schedule posts.
- **If an account disappears from the list**, the user needs to re-authorize through the dashboard.
- **Never schedule posts to an account that isn't showing in `GET /accounts`.**
- **Zernio handles billing separately** — there is no per-account credit charge through the API.
