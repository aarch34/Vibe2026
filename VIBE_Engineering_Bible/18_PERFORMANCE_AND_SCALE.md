# Performance & Scale Plan

## Target
2,000+ simultaneous active attendees with bursty traffic.

## Principle
Keep the hot path tiny.

### Hot path
QR scan → preview → complete → wallet/XP update.

### Avoid
- loading all users
- loading all analytics
- global realtime subscriptions
- client-side joins of large datasets
- huge JavaScript bundles

## Database
Use indexes for every hot-path lookup. Keep transaction tables append-only. Paginate history.

## Realtime
Realtime is for a few shared streams, not every event.

## Leaderboard
Options:
1. indexed query with cached top-N
2. materialized/aggregate view
3. periodic server refresh

For 2,000 users, start simple and measure.

## Rate limiting
Protect:
- scan
- completion
- redemption
- admin mutations

## Caching
Cache public event content. Do not cache private balances.

## Images
R2 + CDN + responsive sizes. Prefer WebP/AVIF where supported.

## JS
Keep client components small. Avoid large UI/animation packages.

## Load test scenarios
- 2,000 users open Home within 60 seconds.
- 1,000 QR scans within 2 minutes.
- 500 simultaneous experience completions.
- 200 reward redemptions around a popular item.
- leaderboard read spike.

## Success criteria
No duplicate completion, no negative balance, no negative stock, acceptable p95 latency and no sustained error spike.
