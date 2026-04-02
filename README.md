<h1 align="center">Shortform Distribution Skills</h1>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg" alt="License"></a>
</p>

Agent skills for distributing shortform video content at scale.

## Install

```bash
npx skills add tfcbot/shortform-distribution-skills
```

## Skills

Each skill does one thing well. Compose them to build your pipeline.

### Plan

| Skill | What it does |
|-------|-------------|
| [channel-strategy](skills/channel-strategy/) | Create a one-page channel spec — character, handle, format, niche, and 30-day content calendar. |
| [niche-research](skills/niche-research/) | Scrape top-performing accounts and analyze winning hooks and formats. |

### Produce

| Skill | What it does |
|-------|-------------|
| [model-provider](skills/model-provider/) | Configure video generation (KIE, Wavespeed, Fal, Replicate) and audio (ElevenLabs). |
| [video-director](skills/video-director/) | Multi-scene AI video production with per-scene QA, frame chaining, and voice swap. |
| [media-critic](skills/media-critic/) | Critic, verify, and breakdown modes for video QA. |

### Distribute

| Skill | What it does |
|-------|-------------|
| [account-management](skills/account-management/) | Provision rapid-scale growth accounts via VidJutsu. Warming, posting, link-in-bio. |
| [schedule-posts](skills/schedule-posts/) | Schedule content to managed accounts with optimized timing and captions. |

### Reporting

| Skill | What it does |
|-------|-------------|
| [analytics](skills/analytics/) | Pull performance data across accounts — content audit, engagement report, growth trends. |

## Managed accounts

Managed accounts are not your personal accounts. They are rapid-scale growth channels — provisioned, warmed up, and posting within 7 days. You don't log into them or manage them directly. This protects your main presence from shadowbans and algorithm penalties that come with aggressive posting schedules.

Account provisioning powered by [VidJutsu](https://docs.vidjutsu.ai).

## License

Apache 2.0
