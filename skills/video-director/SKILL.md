---
name: sfd-video-director
description: >-
  Produce multi-scene AI videos with per-scene QA gates (STT speech verification + critic visual check),
  frame chaining, audio normalization, and voice swap. Works with any format — talking-head, podcast,
  b2c, dtc, fashion, yapper, or custom. The production pipeline is the same regardless of format.
requires:
  env:
    - KIE_API_KEY
    - ELEVENLABS_API_KEY
    - VIDJUTSU_API_KEY
compatibility: >-
  Requires vidlang skill for spec linting. Works with any format skill (talking-head, podcast, ugc-b2c,
  ugc-dtc, ugc-fashion, ugc-skincare, ugc-supplements, ugc-saas, ugc-mobile, ugc-lifestyle-broll,
  ugc-yapper, or custom). Uses KIE API (Kling 3.0 or Veo 3.1), ElevenLabs (STT + STS),
  VidJutsu API (critic + CDN upload).
homepage: https://github.com/tfcbot/shortform-distribution-skills
source: https://github.com/tfcbot/shortform-distribution-skills
---

# Video Director

Produce multi-scene AI videos with automated QA. This skill handles the production pipeline — generation, speech verification, visual QA, assembly, and voice swap. It works with **any format** by converting the format's recording brief or prompt template into a vidlang spec.

The process is always the same:
1. Pick a format (talking-head, ugc-b2c, ugc-yapper, etc.)
2. Write a vidlang spec using that format's structure
3. Run the production pipeline below

---

## Step 0: Choose a Format

The format determines the scene structure, setting, and tone. The production pipeline stays the same regardless of format.

| Format skill | Use when | Spec adaption |
|-------------|----------|---------------|
| talking-head | One person speaking to camera | Single character, varied settings per scene |
| podcast | Conversation at a desk with mic | Two characters or solo with mic visible |
| ugc-b2c | Product demos, unboxings, reviews | Character interacts with product, lofi feel |
| ugc-dtc | DTC brand rituals, textures | Close-ups, tactile moments, lifestyle settings |
| ugc-fashion | OOTDs, try-ons, styling | Full-body or mirror shots, outfit changes |
| ugc-skincare | Routines, textures, shelfies | Bathroom/vanity setting, product application |
| ugc-supplements | Morning stacks, gym bag dumps | Kitchen/gym setting, product display |
| ugc-saas | Desk tours, tool rants, wins | Desk/office setting, laptop visible |
| ugc-mobile | Phone reactions, app moments | Phone in hand, reaction shots |
| ugc-yapper | Car rants, raw monologues | Messy settings, imperfect framing, raw energy |
| ugc-lifestyle-broll | Ambient b-roll, no dialogue | Cinematic, no character speech |
| custom | Anything else | Write the spec from scratch |

Take the format's **Recording Brief** or **Prompt Template** and use it as the `prompt` field in your vidlang spec. The character, voice, and scene structure come from the format. The production rules (VL001-VL013) apply universally.

---

## Step 1: Write the Spec

Use the `vidlang` skill to write and lint a video spec. The spec defines character, voice, scenes, and dialogue.

The scenes JSON must include for each scene:

```json
{
  "prompt": "full generation prompt — adapted from your chosen format's recording brief",
  "dialogue": "the exact intended dialogue for STT verification",
  "sceneImageUrl": "starting frame image URL",
  "prosody": "natural speech rhythm instructions"
}
```

---

## Step 2: Lint Rules

Run all VidLang rules plus these production-specific rules:

### VL009 — Expression Continuity
Every scene after the first must specify `startExpression` matching the previous scene's ending expression.

### VL010 — Audio Normalization
Multi-scene specs must include audio normalization in post-production.

### VL011 — Prosody Control
Every scene must include a `prosody` field with natural speech rhythm instructions. Must contain anti-robot instructions: "no dramatic emphasis", "casual pace", "conversational". Without it, AI over-emphasizes keywords.
- FAIL: No prosody field
- PASS: `"prosody": "casual pace, don't stress any single word, conversational like talking to a friend"`

### VL012 — Anti-Emphasis
Dialogue must NOT contain words in ALL CAPS or formatting that implies emphasis. AI models interpret emphasis cues as shouting.
- FAIL: "TWELVE" or "typed, NOT filmed"
- PASS: All natural casing

### VL013 — Talking Head Stillness
No motion instructions in prompts. No "leans forward", "sits back", "gestures", "nods". The character sits still and talks. Movement causes pose jumps between cuts.
- FAIL: "leans forward on final word, gestures toward own face"
- PASS: "sitting still at desk"

---

## Step 3: Generate with QA Gates

For each scene (max 5 retries):

### Gate 1 — STT Speech Verification
1. Generate the scene clip (Kling 3.0 or Veo 3.1)
2. Extract audio → transcribe via ElevenLabs STT (`POST /v1/speech-to-text`, model `scribe_v1`)
3. Compare transcript word-by-word against intended `dialogue`
4. **Auto-reject if:**
   - Missing or wrong words
   - Repeated phrases (e.g., same 3+ word sequence appears consecutively)
   - Audio events during speech (laughs, sighs, clicks)
5. Peripheral noise (before first word / after last word) is logged but non-blocking
6. Numbers normalized: "8" matches "eight", "12" matches "twelve"

### Gate 2 — Critic Visual Check
1. Upload clip to CDN
2. Run the critic (`POST /v1/analyze`, mode `critic`)
3. **Auto-reject if:**
   - Score < 8/10
   - Any major/critical issues (excluding `text_rendering` category — AI always garbles t-shirt text)
   - Face morphing, warping, or structural drift
   - Eye contact breaks

### Frame Chaining
After a scene passes both gates:
1. Extract the last frame of the clip
2. Upload it to CDN
3. Use it as the starting frame for the next scene (Kling 3.0 supports 2 images in `image_urls` for first/last frame control)

---

## Step 4: Post-Production

After all scenes pass QA:

1. **Concat** — FFmpeg concat demuxer, hard cuts (no crossfades)
2. **Loudnorm** — Two-pass FFmpeg loudnorm at -16 LUFS, normalizes volume across all scenes
3. **Save pre-STS** — Keep a copy before voice swap for comparison
4. **STS Voice Swap** — Single-pass ElevenLabs Speech-to-Speech on the full concatenated audio (NOT per-scene). Uses the character's `voiceId` from `character.json`
5. **STT Final Check** — Transcribe the final video to catch any STS artifacts

---

## Step 5: Edit Instructions

The pipeline outputs an edit report with:
- Silence gaps > 0.5s with timestamps
- Audio events detected in final video
- Specific trim/cut instructions

The agent executes these edits with FFmpeg:
- Trim dead air at start/end
- Shorten long silence gaps to 0.3s
- Mute any audio artifacts at specific timestamps

After editing, run STT one final time to verify the edited video is clean.

---

## Step 6: Final Critique

Run the critic on the edited final video with focus on:
- Natural speech cadence and prosody
- Scene-to-scene transition quality
- Overall flow — does it feel like one conversation?

Report issues and propose fixes for the next iteration.

---

## Key Behaviors

- **STT is the hard gate for speech.** The critic is unreliable for word-level audio QA — use it for visual checks only.
- **Single-pass STS produces cleaner results** than per-scene voice swap. Always do STS as the final step on the concatenated video.
- **Ignore t-shirt text** — AI models always garble graphic tee text. It's cosmetic and viewers don't notice at mobile resolution.
- **Peripheral noise is non-blocking** — sighs/clicks before the first word or after the last word are trimmed in post, not worth rejecting a generation.
- **Frame chaining helps pose continuity** but doesn't guarantee expression matching. Remove motion cues from prompts (VL013) to minimize pose jumps.
- **Save the pre-STS version** — if STS introduces artifacts, you can re-swap with a different voice or fall back to native voice.
