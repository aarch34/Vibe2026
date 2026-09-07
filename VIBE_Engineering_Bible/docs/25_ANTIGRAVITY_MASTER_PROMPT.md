# VIBE — Antigravity Master Build Prompt

You are the lead staff engineer and product engineer. Build VIBE as a production-ready mobile-first PWA.

## Read first
Before writing application code, read all files in `/docs`, especially:
00_MASTER_CONTEXT.md
01_PRD.md
02_TECH_ARCHITECTURE.md
03_DATABASE_SCHEMA.md
04_RLS_POLICIES.md
05_AUTH_SYSTEM.md
06_WALLET_ENGINE.md
07_QR_ENGINE.md
08_QUEST_ENGINE.md
09_ACHIEVEMENT_ENGINE.md
10_REWARD_ENGINE.md
11_ANALYTICS_ENGINE.md
12_ADMIN_DASHBOARD.md
13_ZONE_DASHBOARD.md
14_UI_UX_SPECIFICATION.md
15_COMPONENT_LIBRARY.md
16_API_SPEC.md
17_STORAGE_R2.md
18_PERFORMANCE_AND_SCALE.md
19_SECURITY.md
20_TESTING.md
21_DEPLOYMENT.md
22_FOLDER_STRUCTURE.md
23_DEVELOPMENT_ROADMAP.md
24_SUPABASE_SCHEMA.sql

Do not replace these requirements with a simpler interpretation.

## Mission
Build a reusable multi-event gamified event platform. Initial event: VIBE / Rotaract District 3192 Freshers Party.

## Stack
- Next.js App Router
- TypeScript strict mode
- Clerk
- Supabase PostgreSQL
- Supabase Realtime selectively
- Cloudflare R2
- Tailwind CSS
- shadcn/ui
- Zod
- React Hook Form
- Recharts
- Playwright
- Vitest/Jest equivalent

## Mobile-first
The attendee application is designed for 360px+ mobile widths first. Desktop is secondary for attendees and primary for admin.

Use:
- bottom navigation
- thumb-friendly controls
- minimal network payloads
- lazy-loaded media
- SVG venue map
- no heavy full-screen video backgrounds
- reduced-motion support

## Scalability
Design for 2,000+ simultaneous active users and burst traffic.

Do NOT:
- subscribe every user to every realtime table
- send analytics events through a global websocket
- load all attendees to calculate a leaderboard in the browser
- proxy large media through Next.js
- put all pages behind client-side rendering
- introduce unnecessary Redis/microservices unless a measured bottleneck requires it

Use indexes, pagination, caching and narrow realtime channels.

## Authentication
Clerk owns authentication. Map Clerk user ID to profiles.clerk_user_id. Never trust a client-supplied profile ID or role.

## Wallet
This is the highest-risk subsystem.

Never mutate Coins from the browser.

All spend/earn/refund/redemption operations must be server-authorized and atomic.

Every mutation:
- validates session
- resolves current profile
- validates event membership
- reads configured reward values from database
- checks balance
- uses idempotency
- writes wallet ledger
- updates balance atomically

No negative balances.

## QR
QR codes are opaque identifiers. Scan is a preview; completion is a server-authorized mutation.

Prevent duplicate completion and replay.

## Game engines
Implement reusable rule evaluation for quests and achievements. Do not hardcode individual quest names into UI logic.

## Storage
Large media uploads go directly to Cloudflare R2 using authorized signed upload URLs. Supabase stores metadata.

## Admin
Build a usable desktop dashboard with CRUD, filters, analytics and audit logs.

## Staff
Zone-scoped permissions only.

## Design
Use VIBE visual direction:
- black/deep navy
- electric/royal blue
- white
- premium but lightweight
- subtle glow
- clear typography
- restrained animation

The attendee app must feel like an event/game, not a generic SaaS dashboard.

## Build strategy
Do not generate the entire codebase blindly in one pass.

First:
1. inspect repo
2. create architecture
3. create database migration
4. configure auth abstraction
5. build a vertical slice
6. test it
7. expand module by module

## Required vertical slice
Clerk login
→ profile
→ wallet
→ event
→ zone
→ QR
→ experience
→ atomic spend
→ XP
→ success state

Once that works, implement quests, achievements, Passport, leaderboard, rewards, admin and staff.

## Engineering standards
- strict TypeScript
- Zod validation
- no any unless justified
- server/client boundaries are explicit
- no secret in client bundle
- reusable components
- no duplicated business logic
- meaningful error codes
- tests for critical flows
- migration-based DB changes

## Completion definition
Do not call the project complete until:
- all MVP flows work against real Supabase
- Clerk auth works
- RLS is tested
- wallet race conditions are tested
- QR replay is prevented
- reward stock cannot go negative
- 2,000-user load scenarios are tested
- R2 media flow works
- mobile UI is responsive
- PWA installs
- admin/staff permissions are verified
- production environment variables are documented

When uncertain, choose the simpler architecture that satisfies the requirement and document the decision in `/docs/DECISIONS.md`.
