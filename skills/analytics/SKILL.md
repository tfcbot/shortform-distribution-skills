---
name: sfd-analytics
description: Pull performance data across managed accounts. Content audit, engagement report, and growth trends.
requires:
  env:
    - VIDJUTSU_API_KEY
compatibility: Requires vidjutsu-api skill for endpoint reference. Accounts must have at least 7 days of posting data.
homepage: https://github.com/tfcbot/shortform-distribution-skills
source: https://github.com/tfcbot/shortform-distribution-skills
---

# Analytics

Pull performance data across managed accounts and generate reports.

## Report Types

### Content Audit

Review all posted content and identify what's working and what isn't.

1. Pull video-level analytics:

```
GET /v1/analytics/videos?accountId=acc_xxx
```

2. Rank videos by engagement (views, likes, shares, comments).
3. Identify patterns in top-performing content:
   - Which hooks got the most views?
   - Which formats drove the most shares?
   - Which CTAs drove the most profile visits?
4. Flag underperforming content and recommend what to stop doing.

**Output:** Ranked list of videos with performance data and pattern analysis.

### Engagement Report

Account-level health check across all managed accounts.

1. Pull account-level analytics:

```
GET /v1/analytics?accountId=acc_xxx
```

2. For each account, report:
   - Follower count and growth rate
   - Average engagement rate (likes + comments / views)
   - Post frequency vs. target cadence
   - Any account restrictions or warnings

3. Compare accounts against each other if running multiple channels.

**Output:** Per-account health dashboard with trends over time.

### Growth Trends

Week-over-week and month-over-month growth analysis.

1. Pull analytics for the reporting period.
2. Calculate:
   - Follower growth rate (this week vs. last week)
   - View trends (increasing, flat, declining)
   - Engagement trend (improving or dropping)
   - Best performing day of week
3. Project next 30 days based on current trajectory.

**Output:** Growth summary with trajectory projection and recommended adjustments.

## Key Behaviors

- **Run a content audit after the first 7 days of posting.** Earlier data is too noisy.
- **Engagement reports should be weekly.** Growth trends monthly.
- **Always compare against the channel strategy** — is the content matching the spec?
- **If engagement is declining**, recommend format or hook changes before scaling back posting.
- **Don't over-index on follower count.** Profile visits and link clicks matter more for conversion.
