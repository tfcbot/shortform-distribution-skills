# VidJutsu API — Quick Reference

## Auth

- Header: `X-Api-Key: <VIDJUTSU_API_KEY>`
- Version header: `VidJutsu-Version: 2026-03-25`
- Base URL: `https://api.vidjutsu.ai/v1`

## Endpoints

| Method | Path | Credits | Description |
|--------|------|---------|-------------|
| POST | /api_keys | — | Create API key (Stripe checkout) |
| GET | /api_keys/status | — | Check key status after payment |
| POST | /api_keys/rotate | — | Rotate API key |
| POST | /api_keys/recover | — | Email key recovery |
| GET | /balance | 0 | Credit balance |
| GET | /pricing | — | Pricing info |
| GET | /info | — | Full API info |
| POST | /subscriptions | — | Create monthly subscription |
| POST | /accounts | 990 | Create managed account (max 3) |
| GET | /accounts | 0 | List accounts (?id= for single) |
| DELETE | /accounts?id= | 0 | Soft-delete account |
| GET | /analytics?accountId= | 0 | Account analytics (cached) |
| POST | /analytics/refresh | 0 | Force-refresh analytics |
| GET | /analytics/videos?accountId= | 0 | Per-video stats |
| POST | /upload | 0 | Upload file (raw binary body) |
| POST | /upload/url | 0 | Upload from external URL |
| POST | /posts | 36/0 | Schedule post or create draft |
| GET | /posts | 0 | List posts (?id= for single, ?accountId= to filter) |
| POST | /posts/assign | 0 | Assign draft to account |
| POST | /posts/duplicate | 0 | Duplicate post |
| POST | /scrape | 10 | Scrape platform content |
| POST | /analyze | 10 | Analyze media (critic/verify/breakdown) |
| POST | /campaigns/estimate | 0 | Estimate campaign cost |
| POST | /campaigns | varies | Create campaign |
| GET | /campaigns | 0 | List campaigns (?id= for single) |
| POST | /campaigns/execute | 0 | Execute campaign |
| POST | /campaigns/cancel | 0 | Cancel + refund credits |
