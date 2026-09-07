# Cloudflare R2 Storage

## Buckets
Recommended:
- vibe-production-assets
- vibe-production-uploads

## Object structure
events/{event-slug}/hero/
events/{event-slug}/zones/
events/{event-slug}/experiences/
events/{event-slug}/rewards/
events/{event-slug}/achievements/
events/{event-slug}/sponsors/
users/avatars/

## Database metadata
Store:
- bucket
- object_key
- filename
- MIME type
- byte size
- event_id
- owner
- created_at

## Upload flow
1. Authorized server creates signed upload URL.
2. Browser uploads directly to R2.
3. Server records media metadata.
4. UI uses CDN URL.

Do not proxy large uploads through Next.js.

## Limits
Set reasonable per-file limits. Example:
- avatar: 5 MB
- image: 10 MB
- video: 250 MB

Adjust according to event needs.

## Security
Validate MIME/type/size. Use random object keys. Do not allow users to choose arbitrary bucket paths.
