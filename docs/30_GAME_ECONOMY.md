# 30. VIBE — Complete Game Economy Specification

> **Core Philosophy**:  
> *"Coins measure your choices. XP measures your journey."*  
> VIBE Coins are spent to access experiences and earned through participation.  
> VIBE XP represents a participant's overall engagement and determines their level and leaderboard position.  
> Therefore, spending coins never reduces XP or leaderboard ranking.

---

## 1. Starting Capital
Every registered attendee starts with:
- **🪙 500 VIBE Coins** (loaded automatically upon registration confirmation)
- **⭐ 0 XP**
- **🌱 Level 1 — VIBE Newbie**

Welcome notification:
> *"🎉 Welcome to VIBE! Your VIBE Wallet has been loaded with 500 VIBE Coins. Explore. Experience. Earn. Spend. Repeat."*

---

## 2. The Four Metrics of Every Participant
Every attendee profile displays four fundamental indicators:
1. **🪙 VIBE Coins**: Spendable event currency balance (e.g. `350 VIBE`).
2. **⭐ VIBE XP**: Overall progression score (e.g. `720 XP`). Never decreases.
3. **🗺️ VIBE Passport**: Physical exploration progress (e.g. `4 / 7 Zones`).
4. **🏆 Achievements / Badges**: Milestones and secret challenges unlocked (e.g. `5 Badges`).

---

## 3. How Attendees Earn Coins & XP

### A. Event Registration
- **+500 VIBE Coins**, **0 XP** (One-time starting capital).

### B. Zone Discovery (First-Time Visit)
When an attendee visits a zone for the first time:
- **+50 VIBE Coins**
- **+100 XP**
- **Passport Stamp Updated**
- *Anti-Exploit Rule*: Claimable exactly once per zone. Attendees cannot farm coins by re-scanning the same zone QR.

### C. Experience Tiers & Pricing

| Experience Tier | Example Activity | Coin Cost | XP Reward |
| :--- | :--- | :--- | :--- |
| **Quick Interaction** | Photo booth, quick check-in | 🪙 25 VIBE | ⭐ +40 XP |
| **Easy Challenge** | Mini quiz, reflex game | 🪙 50 VIBE | ⭐ +75 XP |
| **Standard Challenge** | Obstacle drill, dance challenge | 🪙 75 VIBE | ⭐ +125 XP |
| **Major Experience** | VR Arena, escape room stage | 🪙 100 VIBE | ⭐ +175 XP |
| **Premium Experience** | VIP 360 camera, laser tag finale | 🪙 150 VIBE | ⭐ +250 XP |
| **Secret / Mystery QR** | Concealed vault cipher challenge | 🪙 0–100 VIBE | ⭐ +300–500 XP |

### D. Milestone Bonuses & Quests
- **The Explorer**: Visit 3 different zones → **+150 VIBE**, **+200 XP**
- **Social Butterfly**: Complete experiences at 5 different stalls → **+200 VIBE**, **+250 XP**
- **Challenge Accepted**: Complete 5 challenges → **+150 VIBE**, **+300 XP**
- **District Grand Tour / VIBE Master**: Visit all 7 zones → **+500 VIBE**, **+500 XP**, 🏆 *VIBE EXPLORER* badge
- **Mystery QR**: Find hidden venue QR → **+250 VIBE**, **+300 XP**, 🏆 *Secret Badge*

---

## 4. Experience Types & Volunteer Verification

1. **TYPE 1 — CHECK-IN**: Scan QR for simple zone discovery.
2. **TYPE 2 — CHALLENGE**: Physical challenge observed by a volunteer who taps `[APPROVE]`.
3. **TYPE 3 — QUIZ**: Digital multi-question challenge automatically evaluated.
4. **TYPE 4 — PHOTO**: Media photo booth verified by staff.
5. **TYPE 5 — SPONSOR**: Engagement at sponsor booth unlocking rewards/coupons.
6. **TYPE 6 — MYSTERY**: Hidden location QR code.

---

## 5. What Deducts Coins vs What NEVER Deducts Coins

### Legitimate Coin Spending:
- Entering an experience or physical challenge (-25 to -150 VIBE)
- Redeeming items at the Rewards Store (-100 to -750 VIBE)
- Optional VIP activities

### Actions That MUST NEVER Deduct Coins:
- ❌ Viewing the map or zone info
- ❌ Viewing the leaderboard
- ❌ Opening an experience preview
- ❌ Scanning a QR code just to view details before confirming

---

## 6. Insufficient Balance UX
When a user attempts to enter an experience costing more than their balance:
```
🪙 Not enough VIBE Coins
You need 50 VIBE to unlock this experience.
Your balance: 30 VIBE

💡 Complete another challenge or discover new zones to earn more coins.
[ FIND ANOTHER EXPERIENCE ]
```

---

## 7. The 6-Tier Level Progression

| Level | XP Required | Title & Badge |
| :---: | :---: | :--- |
| **1** | 0 XP | 🌱 VIBE Newbie |
| **2** | 250 XP | ✨ VIBE Explorer |
| **3** | 600 XP | 🔥 VIBE Seeker |
| **4** | 1,000 XP | ⚡ VIBE Rider |
| **5** | 1,500 XP | 💫 VIBE Addict |
| **6** | 2,500 XP | 👑 VIBE Legend |

---

## 8. Reward Store Pricing

| Item | Cost | Details |
| :--- | :---: | :--- |
| **Official Sticker Pack** | 🪙 100 VIBE | High-gloss vinyl event stickers |
| **Commemorative Enamel Pin** | 🪙 150 VIBE | Rotaract District 3192 Collector Pin |
| **Sponsor Food/Beverage Coupon** | 🪙 250 VIBE | 20% off partner food stalls |
| **Mystery Gift Box** | 🪙 300 VIBE | Curated merchandise surprise |
| **Limited VIBE T-Shirt** | 🪙 500 VIBE | Official festival streetwear |
| **VIP All-Access Pass** | 🪙 750 VIBE | Backstage & VIP photo lounge access |

---

## 9. Leaderboard Ranking & 3-Tier Tie-Breaker Rules

Rankings are strictly determined by **XP descending** (not remaining coins).

### Official Tie-Breaker Criteria:
1. **Primary**: Highest accumulated XP.
2. **Tie-Breaker 1**: Most venue zones completed (Passport stamps count).
3. **Tie-Breaker 2**: Most total experiences completed.
4. **Tie-Breaker 3**: Earliest timestamp to achieve the final XP total.

---

## 10. Event Freeze Mode
When the event reaches its scheduled conclusion (e.g. 8:30 PM):
- Coin earning and experience completions are frozen.
- The leaderboard is locked.
- The attendee app switches to **"🏆 VIBE HAS ENDED — Final Leaderboard"** celebrating the winners.

---

## 11. Admin Financial Controls & Ledger Transparency
- Admins cannot arbitrarily overwrite coin balances.
- Any manual balance change must be submitted as an **Admin Adjustment** with an explicit signed amount (+/-) and mandatory audit reason.
- Every attendee has a full transaction history displaying `Amount`, `Type`, `Source`, `Timestamp`, and `Transaction ID`.
