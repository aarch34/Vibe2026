# Supabase RLS Policies

## Principle
RLS is defense in depth. Server-side authorization remains mandatory.

## Identity
The Clerk JWT must expose a stable user identifier that maps to profiles.clerk_user_id.

## Attendee policies
Attendees can select:
- their own profile
- their own wallet
- their own wallet transactions
- their own completions
- their own quest progress
- their own achievements
- their own redemptions
- public event content for events they are members of

Attendees cannot:
- update wallet balance
- insert arbitrary wallet transactions
- change role
- change event membership
- edit experiences
- edit rewards

## Staff policies
Staff can read/write operational records only for assigned zones and permitted actions.

## Admin policies
Admins can manage their event. Super Admin can manage platform-level configuration.

## Recommended mutation model
For high-value operations, expose SQL RPC/functions or server-side operations that validate:
- auth identity
- event membership
- role
- balance
- eligibility
- idempotency
- inventory

The client should never receive permission to directly update balance.

## RLS helper functions
Implement helpers such as:
- current_clerk_user_id()
- current_profile_id()
- has_event_role(event_id, role)
- is_event_member(event_id)

Keep policies readable and testable.

## Security tests
Attempt cross-user reads/writes with:
- attendee token
- staff token
- admin token
- unauthenticated request
- invalid event id
