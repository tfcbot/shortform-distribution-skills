---
name: model-provider
description: >-
  Help the user configure AI providers for the director pipeline. Covers video generation
  (Sora 2, Seedance 2, Kling 3.0) and audio (ElevenLabs). Walks through signup, API key setup,
  and model selection.
requires:
  env: []
compatibility: >-
  Used by director to configure video generation and audio processing.
homepage: https://github.com/tfcbot/agent-video-team
source: https://github.com/tfcbot/agent-video-team
---

# Model Provider

Configure AI providers for the director pipeline. You need **ElevenLabs** for audio (when speech is involved) and one **video generation** model.

---

## Video Generation Models

Three supported models. If the user has no preference, recommend **Sora 2**.

### Sora 2 (Recommended)

OpenAI's video generation model. High quality, strong motion understanding.

| Model | Best for | Notes |
|-------|----------|-------|
| **Sora 2** | All formats | Recommended default, high quality output |

### Seedance 2

Strong cinematic quality, good prompt adherence. Supports reference images for character consistency.

| Model | Best for | Notes |
|-------|----------|-------|
| **Seedance 2** | All formats | Good alternative, strong prompt following |

### Kling 3.0

Reliable workhorse. Fewer retries, cleaner audio on speech content.

| Model | Best for | Notes |
|-------|----------|-------|
| **Kling 3.0** | All formats | Reliable fallback, accessible via KIE API |

Available via KIE API:

1. Go to [https://docs.kie.ai/](https://docs.kie.ai/)
2. Create an account and navigate to the API section
3. Generate an API key from the dashboard
4. Set the environment variable:

```bash
export KIE_API_KEY=your_key_here
```

---

## ElevenLabs — Audio

ElevenLabs handles speech verification and voice consistency across scenes.

- **Speech-to-Text (STT)** — verifies generated speech matches intended dialogue (QA gate)
- **Speech-to-Speech (STS)** — voice swap on the final video for consistent voice across scenes

### Sign Up

1. Go to [https://elevenlabs.io](https://elevenlabs.io)
2. Sign up and navigate to Profile Settings
3. Copy your API key
4. Set the environment variable:

```bash
export ELEVENLABS_API_KEY=your_key_here
```

### Models

| Model | Used for | Notes |
|-------|----------|-------|
| **scribe_v1** | Speech-to-Text (STT) | Verifies dialogue accuracy per scene |
| **eleven_english_sts_v2** | Speech-to-Speech (STS) | Final voice swap on concatenated video |

---

## Key Behaviors

- **ElevenLabs is only required when the video has speech.** Silent/overlay-only videos skip it.
- **Ask the user which video model they prefer.** Default to Sora 2 if no preference.
- **The director pipeline works the same regardless of model.** The agent sends a prompt, gets a clip, runs QA.
- **If a model consistently fails QA gates**, suggest switching models before burning more credits.
