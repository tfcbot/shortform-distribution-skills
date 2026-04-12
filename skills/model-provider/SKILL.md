---
name: model-provider
description: >-
  Help the user configure AI providers for the director pipeline. Covers video providers
  (Wavespeed, KIE) and models (Sora 2, Seedance 2, Kling 3.0), plus audio (ElevenLabs).
  Walks through signup, API key setup, and model selection.
requires:
  env: []
compatibility: >-
  Used by director to configure video generation and audio processing.
homepage: https://github.com/tfcbot/agent-video-team
source: https://github.com/tfcbot/agent-video-team
---

# Model Provider

Configure AI providers for the director pipeline. You need a **video provider** + **model**, and **ElevenLabs** for audio (when speech is involved).

---

## Video Providers

Providers are the APIs you call. Models are what generate the video. One provider can host many models.

### Wavespeed (Recommended)

Aggregator API that hosts models from multiple vendors — Sora 2, Seedance 2, Kling 3.0, Veo 3, and more. If the user has no preference, recommend **Wavespeed**.

1. Go to [https://wavespeed.ai/accesskey](https://wavespeed.ai/accesskey)
2. Create an account and generate an API key
3. Set the environment variable:

```bash
export WAVESPEED_API_KEY=your_key_here
```

**API base:** `https://api.wavespeed.ai/api/v3`

### KIE

Alternative provider. Hosts Kling models and Sora 2.

1. Go to [https://docs.kie.ai/](https://docs.kie.ai/)
2. Create an account and generate an API key
3. Set the environment variable:

```bash
export KIE_API_KEY=your_key_here
```

---

## Video Models

Three supported models. All available through **Wavespeed**. Kling and Sora 2 also available through **KIE** as a fallback.

| Model | Provider(s) | Best for | Notes |
|-------|-------------|----------|-------|
| **Sora 2** | Wavespeed, KIE | All formats | High quality, strong motion understanding |
| **Seedance 2** | Wavespeed | All formats | Strong cinematic quality, good prompt adherence |
| **Kling 3.0** | Wavespeed, KIE | All formats | Reliable workhorse, fewer retries |

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
- **Ask the user which video model they prefer.** Default to Sora 2 via Wavespeed if no preference.
- **The director pipeline works the same regardless of model.** The agent sends a prompt, gets a clip, runs QA.
- **If a model consistently fails QA gates**, suggest switching models before burning more credits.
