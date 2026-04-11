---
name: director-qa
description: >-
  Run QA gates on generated video clips — anatomy check, visual critic, and speech verification.
  Auto-reject and retry clips that fail. Max 5 retries per scene.
requires:
  env:
    - VIDJUTSU_API_KEY
compatibility: >-
  Called by the director skill as pipeline step 3.
  Uses VidJutsu API (watch, transcribe, upload, extract).
  Full API reference at https://docs.vidjutsu.ai/llms.txt
---

# Director — Gate

Run QA gates on each generated clip. Three gates in order — anatomy first (cheapest), then critic, then speech (if enabled). If any gate rejects, regenerate the clip via `/director-clip-gen` and re-run gates. Max 5 retries per scene. Abort if all fail.

## Gate 1 — Anatomy

Extract 3 keyframes (start, middle, near-end) from the clip. Upload each via `POST /v1/upload`. Run spatial check on each:

```
POST /v1/watch
{
  "mediaUrl": "<frameUrl>",
  "prompt": "Spatial anatomy check of AI-generated video frame. Intended scene: '<scene.prompt>'. Trace every visible arm from fingertips to shoulder — does it connect to a torso? Check for: limb-to-torso connectivity, spatial consistency, disembodied body parts, anatomically possible limb count, correct joint positions. Score 6+ ONLY if all visible body parts are spatially connected and anatomically plausible."
}
```

**Auto-reject** if any frame scores below 8.

## Gate 2 — Critic

Upload the full clip via `POST /v1/upload`. Run visual QA:

```
POST /v1/watch
{
  "mediaUrl": "<clipUrl>",
  "prompt": "AI-generated video clip. Intended scene: '<scene.prompt>'. Check: face consistency, spatial anatomy, visual artifacts, motion quality, audio sync (if applicable). Score 1-10. List issues with severity. Flag CRITICAL: morphing, warping, structural drift, broken physics, disconnected anatomy. Ignore text rendering on clothing."
}
```

**Auto-reject** if:
- Score < 8/10
- Any major/critical issues (excluding `text_rendering` category)

Adapt the critic prompt to the content style — if b-roll, reward natural motion and penalize stiffness. If talking head, check for stillness and eye contact.

## Gate 3 — Speech (if enabled)

Skip this gate if the video has no spoken dialogue.

```
POST /v1/transcribe
{
  "mediaUrl": "<clipUrl>"
}
```

Compare transcript word-by-word against the intended `dialogue` for the scene.

**Auto-reject** if:
- Missing or wrong words
- Repeated phrases (same 3+ word sequence appears consecutively)
- Audio events during speech (laughs, sighs, clicks)

**Non-blocking:**
- Numbers normalized — "8" matches "eight", "12" matches "twelve"
- Peripheral noise before first word or after last word — trimmed in post

## Retry Logic

If any gate rejects a clip:
1. Log which gate failed and why
2. Regenerate the clip via `/director-clip-gen` (same scene, same frames)
3. Re-run all gates from the beginning
4. Max 5 total attempts per scene
5. If attempt 5 fails, **abort the entire pipeline** — don't continue to post-production with missing scenes

## Output

For each scene that passes all gates:
- Clip URL
- Critic score
- Number of attempts
- Last frame URL (via `POST /v1/extract` with `frames: "last"`) for frame chaining to the next scene

Pass all passed clips to `/director-post`.
