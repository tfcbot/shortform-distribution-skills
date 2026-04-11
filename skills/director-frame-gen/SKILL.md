---
name: director-frame-gen
description: >-
  Generate start and end frames for video scenes using AI image generation.
  Character identity lock via reference sheet. Frame chaining for scene continuity.
requires:
  env:
    - KIE_API_KEY
compatibility: Called by the director skill as pipeline step 1.
---

# Director — Frame Gen

Generate start frames (and optionally end frames) for each scene. These frames seed the video generation step with character identity and scene composition.

## Image Generation

Use nano-banana-2 via KIE for character-consistent image generation:

```
POST https://api.kie.ai/api/v1/jobs/createTask
{
  "model": "nano-banana-2",
  "input": {
    "prompt": "<character.promptBase>, <scene.prompt>",
    "image_input": ["<reference image URL>"],
    "aspect_ratio": "9:16",
    "resolution": "2K",
    "output_format": "png"
  }
}
```

Poll `GET /jobs/recordInfo?taskId=<taskId>` every 5s until `state` is `"success"`. Parse `resultJson` for `resultUrls[0]`. Retry up to 3 times on failure.

## Frame Chaining

For scene 2 and beyond, reuse the previous scene's end frame as this scene's start image. This creates visual continuity across cuts.

If no end frame exists from the previous scene, generate a fresh start frame using the character reference sheet.

## End Frames

If a scene specifies an `endPrompt`, generate an end frame using the start image as the `image_input` reference. This gives the video generator two keyframes to interpolate between.

## Scene Image Override

If the user provides a `sceneImageUrl` for a scene, skip generation and use that URL directly as the start frame.

## Output

For each scene, produce:
- `startUrl` — URL of the start frame
- `endUrl` — URL of the end frame (or null if not generated)

Pass these to `/director-clip-gen`.
