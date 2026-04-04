---
name: sfd-video-captions
description: >-
  Add animated captions to videos via the ZapCap API. Uploads video, creates a captioning task,
  polls until complete, and downloads the result. Supports custom templates and language selection.
requires:
  env:
    - ZAPCAP_API_KEY
compatibility: >-
  Composes with video-director (captions after generation) and video-overlay (captions after overlay).
  Accepts a public URL or local file path. Local files require VIDJUTSU_API_KEY for CDN upload.
homepage: https://github.com/tfcbot/shortform-distribution-skills
source: https://github.com/tfcbot/shortform-distribution-skills
---

# Video Captions

Add animated captions to videos via the ZapCap API. Automatic speech-to-text transcription with styled caption rendering.

## Quick Start

```bash
# From a URL
ZAPCAP_API_KEY=xxx bun skills/video-captions/scripts/caption.ts https://example.com/video.mp4 captioned.mp4

# From a local file (requires VIDJUTSU_API_KEY for CDN upload)
ZAPCAP_API_KEY=xxx VIDJUTSU_API_KEY=xxx bun skills/video-captions/scripts/caption.ts local.mp4 captioned.mp4
```

## Usage

```
bun scripts/caption.ts <input-url-or-path> <output-path> [options-json]
```

- `input-url-or-path` — public video URL or local file path
- `output-path` — path to write the captioned video
- `options-json` — inline JSON string or path to a JSON file

## Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `templateId` | string | ZapCap default | Caption style template ID |
| `language` | string | auto-detect | Language code (e.g., `"en"`, `"es"`) |
| `pollInterval` | number | `5000` | Polling interval in milliseconds |
| `maxWait` | number | `300000` | Max wait time in milliseconds (5 min) |

## ZapCap API Flow

1. **Upload** — `POST /videos/url` sends the video URL to ZapCap
2. **Create task** — `POST /videos/{id}/task` starts captioning (auto-approved)
3. **Poll** — `GET /videos/{id}/task/{taskId}` polls until complete
4. **Download** — Fetches the captioned video to the output path

## Pipeline Integration

Captions should be applied **after** overlays (ZapCap renders on top of everything):

```bash
# 1. Generate video
bun skills/video-director/scripts/generate-multi-scene.ts kling3 chars/maya scenes.json raw.mp4

# 2. Add text overlay (optional)
bun skills/video-overlay/scripts/overlay.ts raw.mp4 overlaid.mp4 '{"text":"Shop now","position":"bottom"}'

# 3. Add captions
bun skills/video-captions/scripts/caption.ts overlaid.mp4 final.mp4 '{"language":"en"}'
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ZAPCAP_API_KEY` | Yes | ZapCap API authentication key |
| `VIDJUTSU_API_KEY` | For local files | VidJutsu API key for CDN upload |
| `VIDJUTSU_DEV_KEY` | For local files | VidJutsu dev key for CDN upload |
| `VIDJUTSU_API_BASE` | No | Override API base URL |

## Prerequisites

- Bun runtime
- ZapCap API key ([zapcap.ai](https://zapcap.ai))
