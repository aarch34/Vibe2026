# Deployment Guide

## Environments
- local
- staging
- production

Each environment should have separate credentials/data.

## Environment variables
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY (server only)
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET
R2_PUBLIC_BASE_URL
NEXT_PUBLIC_APP_URL

## Deployment order
1. Create Supabase project.
2. Apply migrations.
3. Configure Clerk.
4. Configure Clerk/Supabase JWT integration.
5. Create R2 bucket.
6. Configure R2 CORS and public/CDN delivery.
7. Set secrets.
8. Deploy staging.
9. Run smoke tests.
10. Run load/security tests.
11. Deploy production.

## Production checks
- HTTPS
- custom domain
- Clerk callbacks
- RLS enabled
- service role unavailable to client
- R2 upload policy
- error monitoring
- backups
- rate limits
