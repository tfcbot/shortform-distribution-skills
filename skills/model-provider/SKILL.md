---
name: sfd-model-provider
description: >-
  Help the user configure AI providers for the video-director pipeline. Covers video generation
  (KIE, Wavespeed, Fal, Replicate) and audio (ElevenLabs). Walks through signup, API key setup,
  and model selection.
requires:
  env: []
compatibility: >-
  Used by video-director to configure video generation and audio processing.
  Works with any format skill.
homepage: https://github.com/tfcbot/shortform-distribution-skills
source: https://github.com/tfcbot/shortform-distribution-skills
---

# Model Provider

Configure AI providers for the video-director pipeline. You need **ElevenLabs** for audio (required) and one **video generation** provider.

---

## Video Generation Providers

Pick one. Ask the user which they prefer. If no preference, recommend **KIE**.

### KIE (Recommended)

Most reliable for talking-head content. Fewer retries, cleaner audio.

1. Go to [https://docs.kie.ai/](https://docs.kie.ai/)
2. Create an account and navigate to the API section
3. Generate an API key from the dashboard
4. Set the environment variable:

```bash
export KIE_API_KEY=your_key_here
```

**Models:**

| Model | Best for | Notes |
|-------|----------|-------|
| **Kling 3.0 Pro** | Talking-head, product demos | Most reliable for speech, fewer retries |
| **Veo 3.1** | Cinematic, lifestyle b-roll | Better visual quality, less reliable for speech |

Default to **Kling 3.0 Pro** unless the format is b-roll or lifestyle content.

---

### Wavespeed

Good for fast turnaround and async workflows with webhook callbacks.

1. Go to [https://wavespeed.ai/dashboard](https://wavespeed.ai/dashboard)
2. Create an account
3. Navigate to API Keys in the dashboard
4. Generate a new API key
5. Set the environment variable:

```bash
export WAVESPEED_API_KEY=your_key_here
```

**Models:**

| Model | Best for | Notes |
|-------|----------|-------|
| **Veo 3.1 Fast** | Quick iterations, testing | Faster but lower quality than KIE |
| **Kling 2.1** | Budget-friendly talking-head | Older model, acceptable quality |

---

### Fal

Wide model selection, serverless infrastructure, pay-per-second pricing.

1. Go to [https://fal.ai](https://fal.ai)
2. Sign up and navigate to Keys in the dashboard
3. Create a new API key
4. Set the environment variable:

```bash
export FAL_KEY=your_key_here
```

**Models:** Check available models at [fal.ai/models](https://fal.ai/models). Filter by "video generation". Model availability changes frequently — the agent should check what's currently available.

---

### Replicate

Access to open-source and community models. Pay-per-second pricing.

1. Go to [https://replicate.com](https://replicate.com)
2. Sign up and navigate to Account Settings
3. Copy your API token
4. Set the environment variable:

```bash
export REPLICATE_API_TOKEN=your_key_here
```

**Models:** Check available models at [replicate.com/collections/video-generation](https://replicate.com/collections/video-generation). Community models vary in quality — test with a single scene before committing to a full production run.

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

## Verify

After setting keys, verify:

```bash
echo $ELEVENLABS_API_KEY    # required
echo $KIE_API_KEY           # or whichever video provider was chosen
```

If a variable is empty, add it to `~/.zshrc`, `~/.bashrc`, or a `.env` file in the project root.

---

## Key Behaviors

- **ElevenLabs is always required.** It handles STT verification and voice swap — no alternative.
- **Ask the user which video provider they prefer.** Don't assume.
- **KIE is the default recommendation** — most reliable for speech-heavy content.
- **Wavespeed** is a good alternative for async workflows with webhook support.
- **Fal and Replicate** give access to more models but require the agent to handle model-specific parameters.
- **The video-director pipeline works the same regardless of video provider.** The agent sends a prompt, gets a clip, runs QA.
- **If a provider consistently fails QA gates**, suggest switching providers or models before burning more credits.
