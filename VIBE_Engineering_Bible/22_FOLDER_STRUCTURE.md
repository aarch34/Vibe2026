# Repository Structure

```text
vibe/
├─ app/
│  ├─ (marketing)/
│  ├─ (auth)/
│  ├─ app/
│  ├─ admin/
│  ├─ staff/
│  └─ api/
├─ actions/
│  ├─ wallet/
│  ├─ experiences/
│  ├─ rewards/
│  ├─ quests/
│  └─ admin/
├─ components/
│  ├─ ui/
│  ├─ attendee/
│  ├─ map/
│  ├─ wallet/
│  ├─ quests/
│  ├─ rewards/
│  └─ admin/
├─ lib/
│  ├─ auth/
│  ├─ db/
│  ├─ r2/
│  ├─ qr/
│  ├─ analytics/
│  └─ security/
├─ supabase/
│  ├─ migrations/
│  ├─ functions/
│  └─ seed/
├─ tests/
├─ public/
├─ types/
├─ hooks/
└─ docs/
```

## Rules
- UI never imports database internals.
- Actions call domain services.
- Domain services contain business rules.
- Database layer contains queries.
