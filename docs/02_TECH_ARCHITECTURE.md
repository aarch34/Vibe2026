# Technical Architecture

## Stack
- Next.js App Router + TypeScript
- Clerk Authentication
- Supabase PostgreSQL
- Supabase Realtime
- Cloudflare R2
- Tailwind CSS
- shadcn/ui
- Zod
- React Hook Form
- Recharts
- QR scanner/generator library
- Cloudflare deployment

## High-level architecture

Browser
→ Next.js UI
→ Clerk session
→ Server Actions / Route Handlers
→ domain services
→ Supabase
→ R2 for media

## Responsibilities

### Clerk
Identity, sessions, authentication and user lifecycle.

### Supabase
Profiles, event content, wallet ledger, progression, rewards, analytics metadata and realtime feeds.

### R2
Large binary objects. PostgreSQL stores object metadata only.

### Next.js
UI, authorization boundary, domain orchestration and server-side mutations.

## Rendering
- Static/cacheable content for event configuration.
- Server-render user-specific pages where appropriate.
- Client components only for interactive controls.
- Avoid making the whole application a client component.

## Realtime strategy
Use realtime selectively:
- leaderboard updates
- admin operational counters
- zone activity feed

Do not broadcast every analytics event to every attendee.

For leaderboard, consider a periodically refreshed aggregate/query rather than row-level fanout.

## Concurrency
2,000 attendees does not mean 2,000 permanent websocket streams are required. Keep realtime narrow and database writes efficient.

Critical writes:
- wallet spend
- reward redemption
- experience completion

must use database-side atomicity.

## Caching
Cache event configuration, zones and public experience metadata where safe. Never cache private wallet state publicly.

## Failure philosophy
If realtime fails, core gameplay must continue. The attendee can refresh and the server remains authoritative.

## Multi-event
All event-owned records include event_id. Never assume a single event in application code.
