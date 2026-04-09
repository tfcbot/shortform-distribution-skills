# VidJutsu Video Intelligence API — Quick Reference

## Auth

- Header: `Authorization: Bearer <VIDJUTSU_API_KEY>`
- Base URL: `https://api.vidjutsu.ai/v1`

## Endpoints

| Method | Path | Credits | Description |
|--------|------|---------|-------------|
| POST | /watch | 10 | AI watches video, freeform prompt, structured JSON |
| POST | /extract | 5 | Server-side extraction: frames, audio, metadata |
| POST | /transcribe | 10 | STT with word-level timing |
| POST | /check | 5 | Spec validation against rules |
| GET | /check/rules | 0 | Load per-client custom rules |
| PUT | /check/rules | 0 | Save per-client custom rules |
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
| POST | /references | 0 | Create reference record |
| GET | /references | 0 | Get/list references (?id=, ?platform=, ?tag.key=value) |
| PUT | /references?id= | 0 | Update reference record |
| DELETE | /references?id= | 0 | Soft-delete reference |
| POST | /assets | 0 | Create asset record |
| PUT | /assets?id= | 0 | Update asset record |
| GET | /assets | 0 | List assets |
| GET | /assets?id= | 0 | Get single asset |
| DELETE | /assets?id= | 0 | Soft-delete asset |
| POST | /credits | — | Create API key (Stripe checkout) |
| GET | /credits/status | — | Check key status after payment |
| GET | /balance | 0 | Credit balance |
