# Testing Strategy

## Unit tests
- wallet arithmetic
- level calculation
- quest conditions
- achievement conditions
- reward eligibility
- QR validation

## Integration
- Clerk identity → profile
- QR → experience
- experience → wallet
- experience → quest
- experience → achievement
- reward → wallet

## Security
Test unauthorized cross-user access, role escalation, direct mutation attempts and replayed idempotency keys.

## E2E
Use Playwright for:
- login
- attendee home
- map
- scan
- experience completion
- rewards
- admin CRUD
- staff permissions

## Load
Use k6 or equivalent.

Scenarios:
- registration burst
- home burst
- QR scan burst
- completion burst
- leaderboard burst

## Release gate
No release if:
- wallet race test fails
- RLS test fails
- duplicate completion test fails
- reward stock can go negative
