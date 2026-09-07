# Reward Engine

## Reward data
- name
- description
- image
- sponsor
- Coin cost
- stock
- redemption limit
- active period

## Redemption transaction
1. authenticate
2. load reward
3. lock/check stock
4. check active window
5. check user redemption limit
6. lock wallet
7. check balance
8. deduct Coins
9. insert wallet transaction
10. create redemption code
11. decrement stock
12. commit

## Redemption code
Opaque, unique and non-sequential.

## Fulfilment
MVP may show a QR/code to staff. Status can be:
- pending
- claimed
- cancelled
- expired

## Inventory
Stock must never become negative.
