# Development Roadmap

## Phase 0 — Foundation
- repository
- Next.js
- TypeScript
- Tailwind
- Clerk
- Supabase
- R2
- environments
- linting/testing

## Phase 1 — Identity/Event
- profile
- event membership
- roles
- event selector

## Phase 2 — Wallet
- wallet
- ledger
- atomic spend/earn
- idempotency
- tests

## Phase 3 — Gameplay
- zones
- SVG map
- experiences
- QR
- completion

## Phase 4 — Progression
- XP
- levels
- Passport
- quests
- achievements

## Phase 5 — Competition
- leaderboard
- realtime/refresh strategy

## Phase 6 — Rewards
- store
- stock
- redemption codes
- fulfilment

## Phase 7 — Operations
- admin
- staff
- sponsor analytics
- audit logs

## Phase 8 — Hardening
- load test
- RLS test
- security test
- mobile QA
- PWA
- deployment

## Recommended build order
Do not build all screens first. Build one complete vertical slice:
Login → profile → QR → experience → wallet → XP → success.
Then expand.
