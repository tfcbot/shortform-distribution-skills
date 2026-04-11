---
name: editor-overlay
description: >-
  Burn text overlays onto videos via the VidJutsu API. Supports TikTok-safe zones,
  configurable font size, stroke thickness, and top/center/bottom positioning.
  Server-side processing — no local ffmpeg needed.
requires:
  env:
    - VIDJUTSU_API_KEY
compatibility: >-
  Composes with director-* skills (overlay after generation)
  and editor-captions (overlay before captions).
  Full API reference at https://docs.vidjutsu.ai/llms.txt
homepage: https://github.com/tfcbot/agent-video-team
source: https://github.com/tfcbot/agent-video-team
---

# Editor — Overlay

Burn text overlays onto videos via VidJutsu API. TikTok-safe zone aware, configurable positioning and styling. 5 credits per call.

## Endpoint

```
POST https://api.vidjutsu.ai/v1/overlay
Authorization: Bearer <VIDJUTSU_API_KEY>

{
  "videoUrl": "[VIDEO_URL]",
  "text": "Follow for more tips",
  "position": "bottom",
  "fontSize": 48,
  "strokeThickness": 2
}
```

**Response** (200):
```json
{
  "id": "ovl_...",
  "resultUrl": "https://cdn.vidjutsu.ai/overlays/ovl_.../output.mp4"
}
```

## Parameters

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `videoUrl` | string | **required** | URL of the source video |
| `text` | string | **required** | Overlay text. Use `\n` for line breaks. |
| `position` | `"top"` \| `"center"` \| `"bottom"` | `"bottom"` | Vertical text placement |
| `fontSize` | number | 4% of video height | Font size in pixels |
| `strokeThickness` | number | `2` | Text outline thickness (0–10) |

## TikTok Safe Zones

Margins are calculated automatically based on video dimensions:

- **Top**: clears status bar and username overlay
- **Bottom**: clears caption area and like/comment buttons
- **Sides**: clears edge UI elements

Applied automatically — no manual margin configuration needed.

## Pipeline Integration

Overlay should be applied **before** captions (ZapCap renders on top of everything):

```
1. Generate video (any director-* skill)
2. POST /v1/overlay — burn text overlay, get resultUrl
3. POST /v1/captions (or editor-captions) — add captions to the overlaid video
```

## Key Behaviors

- 5 credits per overlay call
- No local ffmpeg or Bun required — processing happens server-side
- Returns a CDN URL — use it directly in downstream steps
