---
name: director-qa
description: >-
  Run QA gates on generated video clips — anatomy check, visual critic, and speech verification.
  Auto-reject and retry clips that fail. Max 5 retries per scene.
requires:
  env: []
compatibility: >-
  Called by the director skill as pipeline step 3.
  Requires VidJutsu CLI (`vidjutsu`) authenticated via `vidjutsu auth`.
---

# Director — Gate

Run QA gates on each generated clip. Three gates in order — anatomy first (cheapest), then critic, then speech (if enabled). If any gate rejects, regenerate the clip via `/director-clip-gen` and re-run gates. Max 5 retries per scene. Abort if all fail.

## Gate 1 — Anatomy

Extract 3 keyframes (start, middle, near-end) from the clip. Upload each via `vidjutsu upload`. Run spatial check on each:

```bash
vidjutsu watch --mediaUrl "<frameUrl>" --prompt "Spatial anatomy check of AI-generated video frame. Intended scene: '<scene.prompt>'. Trace every visible arm from fingertips to shoulder — does it connect to a torso? Check for: limb-to-torso connectivity, spatial consistency, disembodied body parts, anatomically possible limb count, correct joint positions. Score 6+ ONLY if all visible body parts are spatially connected and anatomically plausible."
```

**Auto-reject** if any frame scores below 8.

## Gate 2 — Critic

Upload the full clip via `vidjutsu upload`. Run visual QA:

```bash
vidjutsu watch --mediaUrl "<clipUrl>" --prompt "AI-generated video clip. Intended scene: '<scene.prompt>'. Check: face consistency, spatial anatomy, visual artifacts, motion quality, audio sync (if applicable). Score 1-10. List issues with severity. Flag CRITICAL: morphing, warping, structural drift, broken physics, disconnected anatomy. Ignore text rendering on clothing."
```

**Auto-reject** if:
- Score < 8/10
- Any major/critical issues (excluding `text_rendering` category)

Adapt the critic prompt to the content style — if b-roll, reward natural motion and penalize stiffness. If talking head, check for stillness and eye contact.

## Gate 3 — Speech (if enabled)

Skip this gate if the video has no spoken dialogue.

```bash
vidjutsu transcribe --mediaUrl "<clipUrl>"
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

## Gate 4 — Custom Rules

VidJutsu check accepts a `rules` config object — same pattern as a compiler config. You pass which VidLang rules to enable, disable, or override severity. Custom rules (plain-text quality criteria) are stored separately and evaluated here in the agent layer.

### Built-in rules config

Pass a rules config to `POST /v1/check` to control which VidLang rules run:

```json
{
  "spec": { "..." },
  "rules": {
    "VL013": true,
    "VL003": false,
    "VL011": { "severity": "warning" }
  }
}
```

- `true` — enable
- `false` — disable (default for all rules)
- `{ "enabled": false }` — disable
- `{ "severity": "warning" }` — enable with overridden severity

All rules are **off by default**. You must explicitly enable the rules you want. Omitting `rules` runs no VidLang rules — only basic structural validation.

#### Available VidLang rules

| Rule | Name | Relevant for |
|------|------|-------------|
| VL001 | Temporal Continuity | All formats |
| VL002 | Subject Consistency | All formats |
| VL003 | Camera Physics | B-roll, cinematic |
| VL004 | Audio Alignment | Talking-head, dialogue |
| VL005 | Provider Compatibility | All formats |
| VL006 | Description Quality | B-roll, cinematic |
| VL009 | Expression Continuity | Talking-head |
| VL010 | Audio Normalization | B-roll, music |
| VL011 | Prosody Control | Talking-head, dialogue |
| VL012 | Anti-Emphasis | Talking-head, dialogue |
| VL013 | Talking Head Stillness | Talking-head only |

#### Example configs by format

**Talking-head:**
```json
{ "VL003": false, "VL006": false, "VL010": false }
```

**B-roll:**
```json
{ "VL009": false, "VL011": false, "VL012": false, "VL013": false }
```

### Custom rules

Custom rules are stored on VidJutsu via `PUT /v1/check/rules` and retrieved via `GET /v1/check/rules`. They are plain-text strings describing quality criteria (e.g., "Dialogue must contain a clear AI reveal"). VidJutsu stores them but does not evaluate them — evaluation happens here, in the agent layer, where Claude is already available.

### Workflow

1. **Run built-in check with rules config:**
```bash
vidjutsu check --spec <path-to-spec.json> --rules '{"VL003": false, "VL013": true}'
```

2. **Pull custom rules:**
```bash
vidjutsu check --rules-list
```

3. **Evaluate custom rules locally:** You are Claude — read the rule text, read the spec, determine pass/fail with a message. No external API call needed.

4. **Merge results:** Combine built-in lint results + custom rule evaluations into a single QA report.

### When to run

- Before video generation (validate the spec with format-appropriate rules config)
- After video generation (validate the output against the spec)
- On demand via `/director-qa --check`

## Output

For each scene that passes all gates:
- Clip URL
- Critic score
- Number of attempts
- Last frame URL (via `vidjutsu extract --mediaUrl "<clipUrl>" --frames last`) for frame chaining to the next scene

Pass all passed clips to `/director-post`.
