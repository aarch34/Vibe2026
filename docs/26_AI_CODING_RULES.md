# AI Coding Rules

1. Never invent environment variables.
2. Never expose service-role secrets.
3. Never trust client Coin/XP values.
4. Never write direct wallet updates from client code.
5. Never bypass RLS to make a UI feature easier.
6. Never use a hardcoded admin role in frontend logic.
7. Never create a second authentication system.
8. Never store large media in PostgreSQL.
9. Never add a heavy dependency without a reason.
10. Never remove tests to make builds pass.
11. Never silently change database semantics.
12. Every schema change requires a migration.
13. Every critical mutation needs idempotency.
14. Every admin mutation needs authorization and audit logging.
15. Prefer server components by default.
16. Use client components only for interactivity.
17. Keep mobile bundle small.
18. Use pagination for potentially large lists.
19. Avoid N+1 queries.
20. Document non-obvious security decisions.
