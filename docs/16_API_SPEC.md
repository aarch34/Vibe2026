# API / Server Action Specification

## Public/read
GET /api/events/:slug
GET /api/zones
GET /api/experiences/:id
GET /api/leaderboard
GET /api/rewards

## Attendee
GET /api/me
GET /api/me/wallet
GET /api/me/wallet/transactions
GET /api/me/passport
GET /api/me/quests
GET /api/me/achievements
POST /api/qr/scan
POST /api/experiences/:id/complete
POST /api/rewards/:id/redeem

## Admin
CRUD /api/admin/events
CRUD /api/admin/zones
CRUD /api/admin/experiences
POST /api/admin/experiences/:id/qr
CRUD /api/admin/quests
CRUD /api/admin/achievements
CRUD /api/admin/rewards
CRUD /api/admin/sponsors
CRUD /api/admin/staff
GET /api/admin/analytics

## Server action contracts
All mutation inputs are Zod schemas.

Example complete experience input:
- experienceId
- qrCodeId
- idempotencyKey

Server determines:
- coin cost
- XP reward
- Coin reward
- event
- user
- eligibility

## Error format
```json
{
  "code":"INSUFFICIENT_COINS",
  "message":"You do not have enough VIBE Coins."
}
```

Never expose SQL errors or secrets.
