# Environment & Local Setup

## Required accounts
- Clerk
- Supabase
- Cloudflare

## Local
Create `.env.local` with:
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=
NEXT_PUBLIC_APP_URL=

## Rules
Only NEXT_PUBLIC variables may be exposed to browser code. Service-role and R2 secret credentials are server-only.

## Local development
1. install dependencies
2. configure env
3. run Supabase migrations
4. seed a development event
5. configure Clerk callback
6. start Next.js
7. run tests
8. test QR on a mobile device

## Seed data
Create:
- one event
- seven zones
- sample experiences
- five levels
- sample quests
- sample achievements
- sample rewards
- one sponsor
- staff assignment
