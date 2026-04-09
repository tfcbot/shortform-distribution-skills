# VidJutsu Video Intelligence API — Quick Reference

## Auth

- Header: `X-Api-Key: <VIDJUTSU_API_KEY>`
- Base URL: `https://api.vidjutsu.ai/v1`

## Endpoints

| Method | Path | Credits | Description |
|--------|------|---------|-------------|
| POST | /critic | 10 | Score video quality |
| POST | /breakdown | 10 | Deep async video analysis |
| GET | /breakdown?id= | 0 | Poll breakdown result |
| POST | /score | 10 | Viral scoring |
| POST | /upload | 0 | Upload media binary |
| POST | /upload/url | 0 | Upload from external URL |
| POST | /accounts | 0 | Create account record |
| PUT | /accounts?id= | 0 | Update account record |
| GET | /accounts | 0 | List accounts (?tag.key=value) |
| DELETE | /accounts?id= | 0 | Soft-delete account |
| POST | /posts | 0 | Create post record |
| PUT | /posts?id= | 0 | Update post record |
| GET | /posts | 0 | List posts (?accountId=, ?tag.key=value) |
| DELETE | /posts?id= | 0 | Soft-delete post |
| POST | /api_keys | — | Create API key (Stripe checkout) |
| GET | /api_keys/status | — | Check key status after payment |
| GET | /balance | 0 | Credit balance |
