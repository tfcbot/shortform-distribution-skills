---
name: sfd-video-overlay
description: >-
  Burn text overlays onto videos using FFmpeg ASS subtitles. Supports TikTok-safe zones,
  configurable font size, stroke thickness, and top/center/bottom positioning. Runs locally
  via ffmpeg/ffprobe — no sandbox or cloud dependency.
requires:
  env: []
compatibility: >-
  Requires ffmpeg and ffprobe on PATH. Composes with video-director (overlay after generation)
  and video-captions (overlay before captions). No external API keys needed.
homepage: https://github.com/tfcbot/shortform-distribution-skills
source: https://github.com/tfcbot/shortform-distribution-skills
---

# Video Overlay

Burn text overlays onto videos using FFmpeg ASS subtitles. TikTok-safe zone aware, configurable positioning and styling.

## Quick Start

```bash
bun skills/video-overlay/scripts/overlay.ts input.mp4 output.mp4 '{"text":"Follow for more tips"}'
```

## Usage

```
bun scripts/overlay.ts <input-video> <output-video> [options-json]
```

- `input-video` — path to source video file
- `output-video` — path to write the overlaid video
- `options-json` — inline JSON string or path to a JSON file

## Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `text` | string | **required** | Overlay text. Use `\n` for line breaks. |
| `position` | `"top"` \| `"center"` \| `"bottom"` | `"center"` | Vertical text placement |
| `fontSize` | number | 4% of video height | Font size in pixels |
| `strokeThickness` | number | `2` | Text outline thickness (0–10) |
| `topBottomMargin` | number | auto (safe zone) | Override vertical margin in pixels |
| `fontName` | string | `"Roboto Bold"` | ASS font name |
| `fontDir` | string | none | Path to font directory for custom fonts |

## TikTok Safe Zones

When the video is portrait (height > width), safe zone margins are calculated proportionally:

- **Top**: `height * (131 / 1920)` — clears the status bar and username overlay
- **Bottom**: `height * (367 / 1920)` — clears the caption area, like/comment buttons
- **Sides**: `width * (120 / 1080)` — clears edge UI elements

These are applied automatically when `topBottomMargin` is not specified.

## Pipeline Integration

Overlay should be applied **before** captions (ZapCap renders on top of everything):

```bash
# 1. Generate video
bun skills/video-director/scripts/generate-multi-scene.ts kling3 chars/maya scenes.json raw.mp4

# 2. Add text overlay
bun skills/video-overlay/scripts/overlay.ts raw.mp4 overlaid.mp4 '{"text":"Shop now","position":"bottom","fontSize":48}'

# 3. Add captions
bun skills/video-captions/scripts/caption.ts overlaid.mp4 final.mp4
```

## Prerequisites

- `ffmpeg` and `ffprobe` on PATH
- Bun runtime
