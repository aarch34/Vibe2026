# VIBE — Product Requirements Document

## 1. Executive summary
VIBE is an interactive, gamified digital layer for a physical event. Each registered attendee gets a digital identity, Coins, XP and progression. Attendees explore zones, scan QR codes, unlock experiences, complete challenges, earn rewards and compete on a leaderboard.

## 2. Problem
Attendees may remain in existing groups, miss zones and have little incentive to interact with stalls. Organizers and sponsors lack detailed interaction data. VIBE addresses both through gamification and measurable events.

## 3. Goals
- Drive venue exploration.
- Increase experience completion.
- Give sponsors measurable interactions.
- Make the event memorable.
- Provide real-time operational visibility.
- Create a reusable platform for future events.

## 4. Non-goals for MVP
- Real-money payments.
- Public social network.
- Complex chat.
- Full geolocation tracking.
- Heavy 3D venue rendering.
- Offline financial transactions.

## 5. Functional requirements

### Authentication
- Clerk authentication.
- OTP and/or email/social according to configured provider.
- Protected attendee, staff and admin routes.
- User identity mapped to a Supabase profile.

### Attendee profile
Display name, avatar, VIBE ID, Coin balance, XP, level, zone progress, achievements, quests and redemption history.

### Wallet
Starting balance is configurable. Every mutation produces an immutable ledger entry. Spend and earn operations must be atomic.

### Zones
Event-specific zones have name, description, image, order, map coordinates/path and active status.

### Experiences
Experience has zone, title, description, media, Coin cost, XP reward, Coin reward, attempt limit, time window, sponsor and QR.

### QR
Each experience may have a unique QR. Scan must validate event, experience, status, time window, attempts and user eligibility.

### Passport
Passport shows zone completion state. Completion of configured zones can trigger an achievement/reward.

### Quests
Quests support conditions such as number of zones visited, number of experiences completed, specific experience completed and time-window objectives.

### Achievements
Achievements are automatically evaluated after relevant events.

### Leaderboard
Default ranking is XP descending. Tie-breaking is deterministic and configurable.

### Rewards
Reward store supports stock, Coin cost, redemption limits and sponsor attribution.

### Sponsor experiences
Sponsor interactions are attributed to sponsor and experience.

### Admin
CRUD for event content, QR generation, users, zones, experiences, quests, achievements, rewards, sponsors and staff. Analytics and audit logs are available.

### Staff
Zone-scoped dashboard. Staff only sees assigned zones.

## 6. UX requirements
- Mobile-first attendee experience.
- Primary actions reachable within two taps.
- Large touch targets.
- Bottom navigation.
- Low-bandwidth friendly.
- Clear success/failure states.
- No critical flow hidden behind heavy animation.

## 7. Performance requirements
Target 2,000+ simultaneous attendees. Design for bursts around registration, stage announcements and QR scans. Keep attendee pages cacheable where possible. Do not open a realtime subscription for every metric.

## 8. Acceptance criteria
A release is MVP-complete when attendees can register, receive Coins, scan QR, complete experiences, earn XP, complete quests, unlock achievements, view Passport/leaderboard and redeem rewards; admins can configure all content; staff can operate assigned zones; and wallet/permission/security tests pass.
