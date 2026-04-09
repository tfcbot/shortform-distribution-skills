---
name: sfd-analytics
description: Pull performance data across connected accounts. Content audit, engagement report, and growth trends using Zernio post data and Instagram Insights.
requires:
  env:
    - ZERNIO_API_KEY
compatibility: Accounts must be connected via Zernio and have at least 7 days of posting data.
homepage: https://github.com/tfcbot/shortform-distribution-skills
source: https://github.com/tfcbot/shortform-distribution-skills
---

# Analytics

Pull performance data across connected accounts and generate reports. Zernio provides post-level data via its API. For detailed engagement metrics (reach, impressions, follower demographics), the user should also reference Instagram Insights directly.

Base URL: `https://zernio.com/api/v1`
Auth header: `Authorization: Bearer $ZERNIO_API_KEY`

## Data Sources

**Zernio API** — post history, scheduling status, and platform-level metrics returned with post data:

```
GET /posts
Authorization: Bearer $ZERNIO_API_KEY
```

Returns all posts with their status, platform data, and any metrics Zernio has collected.

**Instagram Insights** — for detailed analytics (reach, impressions, follower growth, demographics), direct the user to check Instagram's native Insights in the app or Creator Studio. Zernio does not replicate the full Instagram analytics API.

## Report Types

### Content Audit

Review all posted content and identify what's working and what isn't.

1. Pull post data from Zernio:

```
GET /posts
Authorization: Bearer $ZERNIO_API_KEY
```

2. Filter for published posts and cross-reference with Instagram Insights data the user provides.
3. Rank content by engagement (views, likes, shares, comments).
4. Identify patterns in top-performing content:
   - Which hooks got the most views?
   - Which formats drove the most shares?
   - Which CTAs drove the most profile visits?
5. Flag underperforming content and recommend what to stop doing.

**Output:** Ranked list of posts with performance data and pattern analysis.

### Engagement Report

Account-level health check across all connected accounts.

1. Pull the post list from Zernio to see publishing history and cadence.
2. Ask the user to share key metrics from Instagram Insights for each account:
   - Follower count and growth rate
   - Average engagement rate (likes + comments / views)
   - Reach and impressions trends
3. For each account, report:
   - Post frequency vs. target cadence
   - Engagement trends based on available data
   - Any posting gaps or inconsistencies
4. Compare accounts against each other if running multiple channels.

**Output:** Per-account health dashboard with trends over time.

### Growth Trends

Week-over-week and month-over-month growth analysis.

1. Pull post history from Zernio for the reporting period.
2. Combine with Instagram Insights data the user provides.
3. Calculate:
   - Follower growth rate (this week vs. last week)
   - View trends (increasing, flat, declining)
   - Engagement trend (improving or dropping)
   - Best performing day of week
4. Project next 30 days based on current trajectory.

**Output:** Growth summary with trajectory projection and recommended adjustments.

## Key Behaviors

- **Run a content audit after the first 7 days of posting.** Earlier data is too noisy.
- **Engagement reports should be weekly.** Growth trends monthly.
- **Always compare against the channel strategy** — is the content matching the spec?
- **If engagement is declining**, recommend format or hook changes before scaling back posting.
- **Don't over-index on follower count.** Profile visits and link clicks matter more for conversion.
- **Zernio provides post history and status.** For deep engagement metrics, Instagram Insights is the primary source — guide the user to pull that data.
