# Architecture Decisions

## ADR-001 — Clerk instead of Supabase Auth
Clerk owns authentication because the product benefits from a dedicated identity/session layer. Supabase remains the application database.

## ADR-002 — R2 for large files
Large event media is separated from relational data and delivered through object storage/CDN.

## ADR-003 — Next.js as application backend
A separate Node microservice is unnecessary for the initial scale. Server Actions/Route Handlers keep the system lightweight.

## ADR-004 — Multi-event schema
Event IDs are included throughout the model so the product can become reusable without redesigning the database.

## ADR-005 — Atomic wallet
Coins behave like a ledger. Atomicity is mandatory because concurrent scans can otherwise cause incorrect balances.

## ADR-006 — Selective realtime
Realtime is used for user-visible shared state, not every telemetry event. This reduces connection and fanout overhead.
