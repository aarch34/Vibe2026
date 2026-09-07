# Clerk Authentication + Supabase

## Identity model
Clerk is the source of truth for authentication.

Supabase stores application profile data and references the Clerk user ID.

## Flow
1. User authenticates with Clerk.
2. Next.js obtains Clerk session.
3. Server resolves Clerk user ID.
4. Server finds/creates profiles row.
5. Event membership is resolved.
6. Application uses profile ID internally.

## User provisioning
Use an idempotent sync operation. It must be safe to execute repeatedly.

## Roles
Do not trust a role supplied by the browser. Resolve role from event_members/staff tables or trusted Clerk claims.

## Protected routes
- /app/* attendee
- /staff/* staff
- /admin/* admin
- /api/* server validation

## Logout/session expiry
Show a friendly session-expired state and allow reauthentication.

## Webhook events
Optionally consume Clerk user-created/user-updated/user-deleted events for profile lifecycle. Webhooks must be verified and idempotent.

## Important
Do not store Clerk passwords or authentication secrets in Supabase.
