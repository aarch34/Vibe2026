# Security Requirements

## Threats
- client manipulation
- double spending
- QR replay
- privilege escalation
- IDOR
- stolen session
- mass request abuse
- malicious uploads

## Controls
- Clerk authentication
- Supabase RLS
- server authorization
- atomic DB transactions
- idempotency keys
- rate limiting
- audit logs
- signed R2 URLs
- input validation
- safe file validation

## IDOR prevention
Never authorize based only on an ID in the URL. Resolve current user from trusted session and check ownership/event membership.

## Admin
Use least privilege. Super Admin should be rare.

## Audit
Log:
- actor
- action
- entity
- before/after
- timestamp
- reason for manual balance changes

## Secrets
Never commit:
- Clerk secret key
- Supabase service role key
- R2 secret
- database password

Use environment secrets.

## Incident response
Provide a way to deactivate:
- experience
- QR
- reward
- user
without deleting historical records.
