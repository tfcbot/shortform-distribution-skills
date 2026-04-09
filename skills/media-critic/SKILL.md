---
name: sfd-media-critic
description: Analyze video and image content using watch prompts for quality checks, verification, and deep analysis. QA gate before posting.
requires:
  env:
    - VIDJUTSU_API_KEY
compatibility: Requires vidjutsu-api skill for endpoint reference.
homepage: https://github.com/tfcbot/shortform-distribution-skills
source: https://github.com/tfcbot/shortform-distribution-skills
---

# Media Critic

QA gate for video and image content. One endpoint — `POST /v1/watch` — with different prompts for different jobs.

## Quality Check

Score content on a pass/fail basis. Catches bad hooks, visual artifacts, weak CTAs, and audio issues.

```
POST /v1/watch {
  "mediaUrl": "[MEDIA_URL]",
  "prompt": "Score quality 1-10. List issues with severity for: face consistency, artifacts, motion, audio sync."
}
```

Returns structured JSON with score and issues. If score is below threshold, regenerate.

## Verification

Check that generated content matches the intended description. Compares the video against the original spec — did the hook land? Is the setting correct? Does the dialogue match?

```
POST /v1/watch {
  "mediaUrl": "[MEDIA_URL]",
  "prompt": "Does this video match this description: [ORIGINAL_DESCRIPTION]. Compare and list discrepancies."
}
```

## Deep Analysis

Full content breakdown for strategy or debugging. Returns hook text, format classification, pacing notes, transition types, CTA analysis, and suggested tags.

```
POST /v1/watch {
  "mediaUrl": "[MEDIA_URL]",
  "prompt": "Analyze this video. Return: hook text, format, pacing, transitions, CTA, tags."
}
```

## Key Behaviors

- **Run a quality check on every video before posting.** No exceptions.
- **Verification is optional** — use it when generation quality is inconsistent.
- **Deep analysis is for strategy and debugging** — don't run it on every video.
- **If a video fails quality check twice**, change the prompt or model before retrying.
- 10 credits per watch call.
