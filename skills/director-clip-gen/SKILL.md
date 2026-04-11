---
name: director-clip-gen
description: >-
  Generate video clips from scene frames using AI video models.
  Supports Sora 2, Seedance 2, and Kling 3.0.
requires:
  env: []
compatibility: >-
  Called by the director skill as pipeline step 2.
  Model API keys depend on which provider the user configured via /model-provider.
---

# Director — Clip Gen

Generate a video clip for each scene from the start frame (and optionally end frame) produced by `/director-frame-gen`.

## Models

| Model | Default | Notes |
|---|---|---|
| **Sora 2** | Recommended | High quality, strong motion |
| **Seedance 2** | Alternative | Strong prompt adherence, good cinematic quality |
| **Kling 3.0** | Fallback | Reliable, clean audio, accessible via KIE API |

Use whichever model the user configured via `/model-provider`. If none specified, ask.

## Kling 3.0 (via KIE API)

```
POST https://api.kie.ai/api/v1/jobs/createTask
{
  "model": "kling-3.0/video",
  "input": {
    "prompt": "<character.promptBase>, <scene.prompt>",
    "negative_prompt": "smooth plastic skin, airbrushed skin, beauty filter, floating limbs, disconnected body parts, distorted hands, extra fingers, morphing clothes",
    "image_urls": ["<startFrameUrl>", "<endFrameUrl (if exists)>"],
    "sound": <true or false based on format config>,
    "duration": "10",
    "aspect_ratio": "9:16",
    "mode": "std",
    "multi_shots": false
  }
}
```

Poll `GET /jobs/recordInfo?taskId=<taskId>` every 15s until `state` is `"success"`. Parse `resultJson` for `resultUrls[0]`.

## Sora 2 / Seedance 2

Refer to the provider's API documentation for endpoint details. The pipeline is the same — send a prompt and reference image, get a clip URL back. The QA gates in `/director-qa` work identically regardless of which model generated the clip.

## Output

For each scene, produce a video clip URL. Pass to `/director-qa` for QA.
