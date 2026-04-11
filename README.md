<h1 align="center">Agent Video Team</h1>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg" alt="License"></a>
</p>

Claude Code skills for AI video production. Install the team, write prompts, generate videos, QA your output, and publish — all through slash commands.

## Install

```bash
npx skills add tfcbot/agent-video-team
```

## Skills

### Direct

| Skill | What it does |
|-------|-------------|
| [prompt-writer](skills/prompt-writer/) | Turn a video idea into model-ready shot-by-shot prompts. Model-specific structure for Seedance 2, Sora 2, and Kling 3.0. |
| [director](skills/director/) | Orchestrate the full production pipeline — chains frame gen, clip gen, QA, and post-production. |
| [director-frame-gen](skills/director-frame-gen/) | Generate start/end frames for scenes with character identity lock. |
| [director-clip-gen](skills/director-clip-gen/) | Generate video clips from frames using Sora 2, Seedance 2, or Kling 3.0. |

### QA

| Skill | What it does |
|-------|-------------|
| [director-qa](skills/director-qa/) | Run QA gates — anatomy check, visual critic, speech verification. Auto-retry failed scenes. |
| [critic](skills/critic/) | Evaluate video/image quality via VidJutsu `/v1/watch`. Score, verify, and deep analyze. |

### Edit

| Skill | What it does |
|-------|-------------|
| [editor-post-production](skills/editor-post-production/) | Concat, loudnorm, STS voice swap, overlay, music, resize, upload. |
| [editor-overlay](skills/editor-overlay/) | Burn text overlays onto videos via VidJutsu API. TikTok-safe zones. |
| [editor-captions](skills/editor-captions/) | Add animated captions via ZapCap API. |

### Plan

| Skill | What it does |
|-------|-------------|
| [researcher](skills/researcher/) | Scrape top-performing content on Instagram and TikTok. Build a research brief. |
| [strategist](skills/strategist/) | Create a channel spec — character, handle, format, and 30-day content calendar. |

### Publish

| Skill | What it does |
|-------|-------------|
| [publisher](skills/publisher/) | Schedule content to connected accounts via Zernio. |
| [publisher-analytics](skills/publisher-analytics/) | Pull performance data — content audit, engagement report, growth trends. |

### Config

| Skill | What it does |
|-------|-------------|
| [model-provider](skills/model-provider/) | Configure video generation (Sora 2, Seedance 2, Kling 3.0) and audio (ElevenLabs). |

## License

Apache 2.0
