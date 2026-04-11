---
name: prompt-writer
description: >-
  Turn a video idea into model-ready shot-by-shot prompts. Applies model-specific
  prompt structure, camera vocabulary, and constraints for Seedance 2, Sora 2, and Kling 3.0.
requires:
  env: []
compatibility: >-
  Sits between strategist and director. Takes a video concept and outputs
  scene prompts ready for director-frame-gen and director-clip-gen.
---

# Prompt Writer

Turn a video idea into model-ready shot-by-shot prompts. The quality of the prompt determines the quality of the video. This skill is the core craft.

## Inputs

Ask the user for:

1. **What video do you want to make?** — concept, mood, purpose, product (if any)
2. **Which model?** — Seedance 2, Sora 2, or Kling 3.0
3. **Character** — reference to character.json, or describe one (appearance, wardrobe, setting)
4. **How many scenes?** — default 3 for a 15s reel
5. **Dialogue or overlay?** — spoken words, text overlay, or silent

## Scene Breakdown

Before writing prompts, break the concept into scenes. Each scene gets:

- **Action** — one clear thing happening (one verb, one moment)
- **Camera** — one movement or static shot
- **Environment** — setting, lighting, time of day
- **Character state** — expression, pose, wardrobe
- **Duration** — seconds per scene
- **Dialogue** — exact words if spoken, or overlay text, or none

---

## Model-Specific Prompt Formulas

### Seedance 2

**Structure:** 6-step formula, 60-100 words per prompt.

1. **Subject** — who/what is in frame. Anchor to physical details (hair, clothing, accessories), not abstract traits.
2. **Action** — single clear verb phrase. One action per scene. Describe the motion specifically.
3. **Environment** — setting, props, background. Name materials and surfaces, not vibes.
4. **Camera** — one movement only. Use pacing words (slowly, gently, smoothly) instead of technical parameters.
5. **Style** — cinematic language: "lofi handheld", "studio lit", "golden hour warmth", "overcast flat light", "soft grain".
6. **Constraints** — what NOT to include. "No text on screen", "no second person in frame", etc.

**Rules:**
- 60-100 words per prompt — shorter loses detail, longer loses coherence
- One camera movement per scene maximum
- Pacing words ("slowly", "deliberately") over technical specs ("24fps", "f/2.8")
- Supports up to 12 reference files — use for character and style consistency
- Avoid physically impossible scenarios — the model relies on real-world physics
- Set visual style early — it anchors everything else
- Test with 480P before committing to 720P (cheaper iterations)

**Example:**
> A young woman with dark hair in a cream knit sweater sits cross-legged on a sunlit bedroom floor, slowly folding a stack of linen clothes into a wicker basket. Morning light pours through sheer curtains, casting soft shadows on the hardwood. Slow tracking shot drifting left to right at waist height. Lofi vlog aesthetic, warm golden tones, soft natural grain. No text on screen, no second person visible.

### Sora 2

**Structure:** Scene description → Cinematography block → Actions block → Dialogue block (if any).

```
[Scene description in plain language — what we see, who's there, what the setting looks like]

Cinematography:
Camera shot: [framing + angle + movement]
Mood: [overall tone/atmosphere]

Actions:
- [Beat 1: specific action]
- [Beat 2: specific action]

Dialogue: (if applicable)
- [Character]: "[Line]"
```

**Rules:**
- Be specific about visible results — "wet asphalt, zebra crosswalk, neon reflections" not "beautiful street"
- Establish visual style early — "1970s film grain", "IMAX-scale", "16mm black-and-white"
- Describe lighting precisely — "soft window light with warm lamp fill, cool rim from hallway" not "brightly lit"
- Shorter clips (4-8s) follow instructions more reliably than longer ones
- Maximum 2 characters per generation
- Dialogue goes in a dedicated block below the visual description, not inline
- Keep dialogue concise — long speeches don't sync well
- Use temporal language — "begins with", "transitions to", "ends on"
- Image references anchor the first frame — your text defines what happens after
- Make one controlled change at a time when iterating
- If a shot misfires, simplify — freeze the camera, reduce the action, then rebuild

**Do NOT put API parameters (resolution, duration, character IDs) in the prompt text — those are set in the API call.**

**Example:**
> A woman in a cream cardigan sits at a wooden kitchen table, morning light filtering through a window behind her. A half-empty coffee mug and an open notebook sit in front of her. The kitchen is warm — amber tones, walnut cabinets, copper pendant light.
>
> Cinematography:
> Camera shot: Medium close-up, eye level, slow dolly-in
> Mood: Calm, contemplative, intimate
>
> Actions:
> - She looks down at the notebook, taps her pen twice on the page
> - Looks up toward the window, slight smile

### Kling 3.0

**Structure:** Concise, direct description. Kling prefers shorter prompts than Seedance or Sora.

**Prompt:** `<character.promptBase>, <scene description>`

**Negative prompt (always include):**
```
smooth plastic skin, airbrushed skin, beauty filter, floating limbs, disconnected body parts, distorted hands, extra fingers, morphing clothes
```

Add scene-specific negatives as needed: "no text on screen", "no rapid camera movement", "no second person".

**Rules:**
- Always include `negative_prompt` — Kling artifacts without it
- `sound: true` for dialogue scenes, `sound: false` for silent/overlay
- `image_urls` array for character lock — reference sheet URL
- `mode: std`, `aspect_ratio: 9:16`
- **Talking head (VL013):** NO motion instructions. No "leans forward", "gestures", "nods". Character sits still and talks. Movement causes pose jumps between cuts.
- **B-roll:** Motion and action language is fine — handheld, tracking, natural movement
- **Prosody (VL011):** Include speech rhythm in the prompt — "casual pace, don't stress any single word, conversational"
- **No ALL CAPS in dialogue (VL012):** AI interprets caps as shouting
- Concise prompts preferred — 30-60 words is the sweet spot for Kling
- The `promptBase` from character.json gets prepended, so don't repeat character description

**Example:**
> Sitting at a sunlit desk with a laptop and iced coffee, speaking directly to camera with a relaxed expression. Morning light from a window to the left. Static camera, medium close-up.

---

## Camera Movement Vocabulary

One movement per scene. Two movements in one prompt confuse all three models.

| Movement | What it does | Best for |
|---|---|---|
| **Static** | No camera movement | Talking head, close-up, product detail |
| **Pan left/right** | Camera rotates horizontally | Environment reveals, following action |
| **Tilt up/down** | Camera rotates vertically | Height reveals, looking up at subject |
| **Dolly in/out** | Camera moves toward/away from subject | Emotional emphasis, tension |
| **Tracking shot** | Camera follows the subject laterally | Walking, action sequences |
| **Handheld** | Slight natural shake and drift | Lofi, authentic, vlog aesthetic |
| **Slow zoom** | Gradual focal length change | Building tension, drawing focus |
| **Over-shoulder** | Camera positioned behind one character | Dialogue, POV, reveals |
| **Low angle** | Camera below eye level looking up | Power, drama, scale |
| **High angle** | Camera above looking down | Vulnerability, overview, context |

---

## Character Consistency

### Seedance 2
- Include physical description in every prompt — hair, skin, wardrobe, accessories
- Use reference files (up to 12) as the primary consistency mechanism
- Repeat wardrobe details across scenes — "cream knit sweater" in every prompt, not just the first

### Sora 2
- Upload reference clips (2-4s, 720p-1080p) via Characters API
- Reference up to 2 characters per generation using their IDs
- Use consistent phrasing across shots — same adjectives, same wardrobe language
- Avoid competing traits ("confident yet shy")

### Kling 3.0
- `image_urls` with reference sheet is the primary lock
- `promptBase` from character.json handles identity — don't re-describe in every scene prompt
- Add wardrobe-specific details only when the outfit changes between scenes

**General rule:** Anchor to concrete visual details (hair color, specific clothing items, accessories) not abstract traits ("confident", "energetic").

---

## Negative Prompt Guidance

### Seedance 2
Use the constraints step in the 6-step formula. Phrase as exclusions at the end of the prompt: "No text on screen, no second person visible, no rapid camera movement."

### Sora 2
Negative prompts are not a separate field. Instead, use specificity in the positive prompt to crowd out unwanted results. If you keep getting text overlays, specify "no on-screen text" in the scene description.

### Kling 3.0
Always include the `negative_prompt` field. Start with the default anatomical list and add scene-specific exclusions:
```
smooth plastic skin, airbrushed skin, beauty filter, floating limbs, disconnected body parts, distorted hands, extra fingers, morphing clothes, [scene-specific negatives]
```

---

## Output Format

Output a structured document the user can take directly to generation:

```markdown
## Video: [concept summary]
**Model:** [Seedance 2 / Sora 2 / Kling 3.0]
**Total scenes:** [N]
**Estimated duration:** [Xs]

### Scene 1 — [scene name]
**Duration:** Xs
**Dialogue:** "[exact words]" / overlay: "[text]" / none
**Camera:** [movement]

**Prompt:**
[Full prompt following the model-specific formula]

**Negative prompt:** (Kling only)
[negative prompt string]

### Scene 2 — [scene name]
...
```

---

## Key Behaviors

- **Always ask which model before writing prompts** — structure differs significantly between models
- **One camera movement per scene, no exceptions** — two movements produce incoherent output on all models
- **If the concept is vague, ask questions** — "a fitness video" is not enough. What action? What setting? What's the character wearing? What emotion?
- **Write prompts that are ready to paste** — the user should not need to edit for the model to understand
- **When iterating, change one thing at a time** — camera, action, or lighting. Never all three.
- **Shorter scenes follow instructions better** — 4-8s for Sora 2, 5-10s for Seedance 2, 5-10s for Kling 3.0
- **Style is the most powerful lever** — set it in the first line and it anchors everything else
