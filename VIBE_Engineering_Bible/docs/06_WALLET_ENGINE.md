# Wallet Engine

## Purpose
VIBE Coins are closed-loop event currency with no cash value.

## Invariants
1. Balance cannot become negative.
2. Every balance mutation has a ledger transaction.
3. Ledger amount and before/after balances reconcile.
4. Client cannot choose arbitrary amount/reward.
5. Every mutation is idempotent.
6. Concurrent spends cannot overspend.

## Spend flow
Request:
- experience_id
- qr_code_id
- idempotency_key

Server:
1. authenticate
2. load profile/event
3. lock wallet row
4. validate experience
5. validate QR
6. validate attempts
7. validate time window
8. validate balance
9. calculate server-side amount
10. update wallet
11. insert ledger row
12. insert completion
13. award XP/reward
14. evaluate quest/achievement triggers
15. commit

## Earn flow
Never accept xp_reward or coin_reward from the client. Read configured values from database.

## Refund
Admin/system-only operation with audit trail and explicit reason.

## Idempotency
For every critical mutation, accept an idempotency key. Store it with a unique constraint scoped to operation/user/event.

## Double-spend protection
Use database transaction and row-level locking or an atomic conditional update. Do not rely on a client-side balance check.

## Reconciliation
Provide an admin job/query:
opening balance + credits - debits = current balance.

## Wallet history
Paginated newest-first.
