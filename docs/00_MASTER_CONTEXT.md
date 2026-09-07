# VIBE — Master Context

## Product
VIBE is a mobile-first gamified event platform. The initial event is the Rotaract District 3192 Freshers Party.

## Product principle
**Don't just attend VIBE. Experience it.**

The physical venue becomes the game board:
- Zones become levels.
- Experience centers become missions.
- QR codes become checkpoints.
- VIBE Coins become closed-loop event currency.
- XP becomes progression.
- Passport becomes collection.
- Leaderboard becomes competition.
- Rewards become achievements.

## Primary outcome
Increase movement, participation, sponsor interaction and measurable engagement.

## Users
1. Attendee
2. Zone Staff / Volunteer
3. Admin
4. Super Admin

## Non-negotiables
- Mobile first.
- Lightweight.
- 2,000+ simultaneous active attendees.
- Clerk owns authentication.
- Supabase owns relational application data.
- Cloudflare R2 owns large media.
- Never trust client wallet values.
- Wallet mutations are atomic.
- Use RLS.
- Avoid unnecessary realtime.
- Build multi-event capability into the schema.

## Default event configuration
- Starting Coins: 500
- XP ranking: descending XP
- Levels: Newbie, Explorer, Seeker, Rider, Legend
- Leaderboard: configurable by event

## Product loop
Earn → Explore → Spend → Unlock → Complete → Earn XP → Level Up → Collect → Redeem.

## Source alignment
The original concept specifies registration with an initial Coin balance, zones, experiences, QR interaction, Passport, quests, leaderboard, achievements, rewards, sponsors and admin/zone dashboards. This engineering bible converts those concepts into implementation requirements.
