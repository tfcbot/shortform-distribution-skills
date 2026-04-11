---
name: director
description: >-
  Orchestrate AI video production. Chains the pipeline steps — frame gen, clip gen, QA gates,
  and post-production — for any video style. Adapts to the user's format, model, and character.
requires:
  env:
    - KIE_API_KEY
    - VIDJUTSU_API_KEY
compatibility: >-
  Orchestrates director-frame-gen, director-clip-gen, director-qa, and editor-post-production skills.
  Full VidJutsu API reference at https://docs.vidjutsu.ai/llms.txt
---

# Director

Orchestrate AI video production for any style — talking head, b-roll, product demo, podcast, or custom. This skill chains the pipeline steps. Each step has its own skill with detailed instructions.

## Inputs

Ask the user for:

1. **What kind of video?** — style, tone, purpose (e.g. "lofi b-roll surfing video", "talking head explaining a product", "podcast clip")
2. **Character** — directory with `character.json` containing `name`, `promptBase`, `referenceSheet.url`, optionally `voiceId`
3. **Scenes** — scene prompts from `/prompt-writer`, or describe what happens and this skill will write basic prompts. For best results, use `/prompt-writer` first — it applies model-specific prompt structure and camera vocabulary.
4. **Model** — Seedance 2, Sora 2, or Kling 3.0 (see `/model-provider`)

## Determine Format Config

Based on what the user described, determine these settings:

| Setting | When ON | When OFF |
|---|---|---|
| **Sound** | Video has spoken dialogue | Silent / overlay-only / music-only |
| **Speech gate** | Video has spoken dialogue | No dialogue |
| **STS voice swap** | Video has spoken dialogue and character has `voiceId` | No dialogue or no voice clone |
| **Loudnorm** | Video has spoken dialogue | Silent |
| **Overlay text** | User provides overlay text | No overlay needed |
| **Music** | User provides music prompt or URL | No music |
| **Motion in prompts** | B-roll, lifestyle, action content | Talking head (stillness required) |

## Pipeline

Run these steps in order. Each step is a separate skill — invoke it or follow its instructions inline.

### 0. `/prompt-writer` (recommended)
Write model-ready scene prompts from the video concept. Applies model-specific structure, camera vocabulary, and constraints. Skip if the user already has scene prompts.

### 1. `/director-frame-gen`
Generate start frames (and optionally end frames) for each scene using the character reference sheet.

### 2. `/director-clip-gen`
Generate video clips from the frames. Configure sound on/off based on format config.

### 3. `/director-qa`
Run QA gates on each clip — anatomy check, critic check, and optionally speech verification. Retry failed scenes (max 5 attempts). If a scene fails all retries, abort.

### 4. `/editor-post-production`
Assemble the final video — concat, loudnorm, STS, overlay, music, edit, resize, upload. Only runs the steps that apply based on format config.

## Key Behaviors

- **Adapt to any style** — the pipeline is the same, only the config changes
- **Ask before assuming format** — if unclear whether sound/overlay/STS is needed, ask
- **Abort early** — if a scene fails 5 retries at any gate, stop. Don't burn credits.
- **Report per-scene results** — critic scores, attempt counts, final CDN URL
