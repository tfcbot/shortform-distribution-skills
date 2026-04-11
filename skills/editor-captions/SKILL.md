---
name: editor-captions
description: >-
  Add animated captions to videos via the ZapCap API. Uploads video, creates a captioning task,
  polls until complete, and downloads the result. Supports custom templates and language selection.
requires:
  env:
    - ZAPCAP_API_KEY
compatibility: >-
  Composes with director-* skills (captions after generation) and editor-overlay (captions after overlay).
  Requires a public video URL as input.
homepage: https://github.com/tfcbot/agent-video-team
source: https://github.com/tfcbot/agent-video-team
---

# Editor — Captions

Add animated captions to videos via the ZapCap API. Automatic speech-to-text transcription with styled caption rendering.

## ZapCap API

- **Base URL**: `https://api.zapcap.ai`
- **Auth header**: `x-api-key: <ZAPCAP_API_KEY>`

### Step 1 — Upload video

```
POST https://api.zapcap.ai/videos/url
x-api-key: <ZAPCAP_API_KEY>

{ "url": "[VIDEO_URL]" }
```

Returns `{ "id": "..." }`.

### Step 2 — Create captioning task

```
POST https://api.zapcap.ai/videos/{id}/task
x-api-key: <ZAPCAP_API_KEY>

{
  "templateId": "[TEMPLATE_ID]",
  "language": "en"
}
```

Returns `{ "taskId": "..." }`.

### Step 3 — Poll until complete

```
GET https://api.zapcap.ai/videos/{id}/task/{taskId}
x-api-key: <ZAPCAP_API_KEY>
```

Poll every 5 seconds. When `status` is `"completed"`, the response includes a `downloadUrl`.

### Step 4 — Download result

Fetch the `downloadUrl` to get the captioned video.

## Parameters

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `templateId` | string | ZapCap default | Caption style template ID |
| `language` | string | auto-detect | Language code (e.g., `"en"`, `"es"`) |

## Pipeline Integration

Captions should be applied **after** overlays (ZapCap renders on top of everything):

```
1. Generate video (any director-* skill)
2. POST /v1/overlay — burn text overlay (optional)
3. Upload overlaid video URL to ZapCap → poll → download captioned result
```

## Key Behaviors

- **Input must be a public URL** — if you have a local file, upload it via `POST /v1/upload` first to get a URL.
- **Apply captions last** — ZapCap renders on top of everything.
- **Poll, don't block** — captioning takes 30-120 seconds typically.
- **ZapCap billing is separate** — not charged through VidJutsu credits.
