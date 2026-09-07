# Release Acceptance Checklist

## Attendee
- [ ] Register/login
- [ ] Profile created
- [ ] VIBE ID generated
- [ ] Starting Coins credited exactly once
- [ ] Home loads quickly
- [ ] Map works on mobile
- [ ] QR scanner works
- [ ] Experience preview works
- [ ] Spend is atomic
- [ ] Completion cannot be replayed
- [ ] XP awarded correctly
- [ ] Quest progress updates
- [ ] Achievement unlocks
- [ ] Passport updates
- [ ] Leaderboard works
- [ ] Reward redemption works

## Admin
- [ ] Event CRUD
- [ ] Zone CRUD
- [ ] Experience CRUD
- [ ] QR generation
- [ ] Quest CRUD
- [ ] Achievement CRUD
- [ ] Reward CRUD
- [ ] Sponsor CRUD
- [ ] Staff assignment
- [ ] Analytics
- [ ] Audit log

## Security
- [ ] RLS enabled
- [ ] Cross-user read denied
- [ ] Cross-user write denied
- [ ] Role escalation denied
- [ ] Wallet direct update denied
- [ ] QR replay denied
- [ ] Reward stock race tested
- [ ] Secrets absent from client

## Scale
- [ ] 2,000-user load scenario
- [ ] QR burst scenario
- [ ] leaderboard burst scenario
- [ ] p95 measured
- [ ] error rate measured

## Production
- [ ] Clerk production config
- [ ] Supabase production project
- [ ] R2 production bucket
- [ ] custom domain
- [ ] HTTPS
- [ ] monitoring
- [ ] backups
- [ ] rollback plan
