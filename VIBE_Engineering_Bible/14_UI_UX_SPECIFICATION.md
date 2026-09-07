# UI/UX Specification

## Attendee navigation
Bottom navigation:
1. Home
2. Map
3. Quests
4. Leaderboard
5. Profile

Secondary:
- Scan
- Experience
- Passport
- Rewards
- Achievements

## Mobile-first
Base design at 360–390px width. Scale upward.

## Home
Hero greeting, Coin card, XP progress, quest progress, zone progress, featured experiences.

## Map
Use a lightweight SVG venue map. Tap zone → zone sheet/page → experiences.

## Experience
Show artwork, title, description, cost, XP, requirements and primary CTA.

## Completion
Show:
- XP earned
- Coins earned
- new level if applicable
- achievements
- quest progress

Keep celebration under a few seconds and skippable.

## Profile
VIBE ID, avatar, wallet, level, achievements, passport, history.

## Visual language
Black/deep navy base, electric/royal blue, white. Use glow sparingly.

## Typography
Montserrat or another locally hosted/optimized sans-serif. Avoid loading many font weights.

## Accessibility
- WCAG-conscious contrast
- 44px minimum touch targets
- keyboard support for admin
- reduced-motion preference
- clear non-color status indicators

## Performance UX
Avoid giant background videos. Use compressed images and SVG. Lazy-load below-fold content.
