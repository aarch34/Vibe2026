# Analytics Engine

## Event names
- registration
- login
- qr_scan
- experience_view
- experience_unlock
- experience_complete
- coin_earned
- coin_spent
- zone_visit
- quest_complete
- achievement_unlock
- reward_view
- reward_redeem
- leaderboard_view

## Rules
Analytics must never be required for the core transaction to succeed. If analytics insertion fails, gameplay should continue.

## Storage
Store compact rows with event_name and relevant IDs. Avoid huge JSON blobs.

## Aggregation
Admin dashboards should use aggregate queries/views rather than loading all raw events into the browser.

## Privacy
Do not collect unnecessary personal data. Avoid storing precise location unless a future feature explicitly requires it.

## Reporting
Useful KPIs:
- registered
- active
- unique zones visited
- experiences completed
- Coins spent/earned
- rewards redeemed
- sponsor interactions
- peak interaction time
