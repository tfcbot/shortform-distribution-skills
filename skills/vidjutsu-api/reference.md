# VidJutsu API — Quick Reference

## Auth

- Header: `X-Api-Key: <VIDJUTSU_API_KEY>`
- Version header: `VidJutsu-Version: 2026-03-25`
- Base URL: `https://vidjutsu.ai/v1`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /accounts | Create managed account (TikTok/Instagram) |
| GET | /accounts | List accounts |
| GET | /accounts/:id | Account details |
| DELETE | /accounts/:id | Delete account |
| POST | /posts | Schedule a post (videoId or mediaUrl) |
| GET | /posts | List posts |
| GET | /posts/:id | Post details + metrics |
| POST | /videos | Generate video |
| GET | /videos/:id | Video status + resultUrl |
| POST | /images | Generate image |
| POST | /music | Generate music |
| POST | /scrape | Scrape URL for niche research |
| POST | /analyze | Analyze media (critic/verify/breakdown) |
| POST | /campaigns/estimate | Estimate campaign cost |
| POST | /campaigns | Create campaign |
| GET | /campaigns/:id | Campaign status |
| GET | /balance | Credit balance + subscription |
| GET | /pricing | Pricing info |
| POST | /subscriptions | Create membership |
