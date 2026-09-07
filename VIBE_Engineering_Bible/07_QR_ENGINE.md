# QR Engine

## QR design
QR contains a non-sensitive opaque code or route token.

Example:
`https://event.example/scan/<opaque-code>`

Never encode:
- Coin amount
- user ID
- private data
- authorization role

## Scan flow
1. Read QR.
2. Validate format.
3. Resolve QR.
4. Validate active status.
5. Validate event.
6. Validate experience.
7. Validate time window.
8. Return preview.
9. User confirms.
10. Server performs completion.

## Replay prevention
A completed experience must not be completed again unless max_attempts explicitly permits it.

## Optional controls
- QR versioning
- expiry
- rotation
- staff-assisted verification

## QR generation
Admin generates QR from the server. Store code metadata in Supabase and render/download SVG/PNG.

## Rate limiting
Rate limit scan and completion endpoints per user/IP/device fingerprint where appropriate. Rate limiting must not lock out legitimate attendees too aggressively.
