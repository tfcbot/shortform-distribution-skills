---
name: sfd-media-critic
description: Analyze video and image content using critic, verify, and breakdown modes. QA gate before posting.
requires:
  env:
    - VIDJUTSU_API_KEY
compatibility: Requires vidjutsu-api skill for endpoint reference.
homepage: https://github.com/tfcbot/shortform-distribution-skills
source: https://github.com/tfcbot/shortform-distribution-skills
---

# Media Critic

QA gate for video and image content. Three modes — use the right one for the job.

## Modes

### Critic

Score content on a pass/fail basis. Catches bad hooks, visual artifacts, weak CTAs, and audio issues.

```
POST /v1/analyze {
  "mediaUrl": "[MEDIA_URL]",
  "mode": "critic",
  "mediaType": "video",
  "context": "[OPTIONAL_CONTEXT]"
}
```

Returns a score and list of issues. If score is below threshold, regenerate.

### Verify

Check that generated content matches the intended description. Compares the video against the original spec — did the hook land? Is the setting correct? Does the dialogue match?

```
POST /v1/analyze {
  "mediaUrl": "[MEDIA_URL]",
  "mode": "verify",
  "description": "[ORIGINAL_DESCRIPTION]",
  "mediaType": "video",
  "keyframeDescriptions": ["[SCENE_1_DESC]", "[SCENE_2_DESC]"]
}
```

### Breakdown

Frame-by-frame analysis of a video. Useful for debugging generation issues or understanding why a video performed well/poorly. Returns async (202) with an analysis ID.

```
POST /v1/analyze {
  "mediaUrl": "[MEDIA_URL]",
  "mode": "breakdown",
  "prompt": "[OPTIONAL_ANALYSIS_PROMPT]"
}
```

## Key Behaviors

- **Run critic on every video before posting.** No exceptions.
- **Verify mode is optional** — use it when generation quality is inconsistent.
- **Breakdown mode is for debugging** — don't run it on every video.
- **If a video fails critic twice**, change the prompt or model before retrying.
- 10 credits per analysis.
