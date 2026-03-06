# Feature Specification: AIA-Music Payment Integration

> **Template Version**: 1.0 | Based on [Spec Kit](https://speckit.org) methodology

---

**Feature Number**: 008  
**Created**: 2026-02-26  
**Status**: Draft — Awaiting Scott Review  
**Author**: Rav (Product Manager)  
**Platform**: AIA-Music  

---

## Overview

### Problem Statement

Scott currently pays for all Suno music generation credits out of pocket. Every song any user generates costs Scott money. This doesn't scale — every new user is a direct cost center with no revenue.

### Proposed Solution

Users pay for their own music generation. Stripe handles payment processing. AIA takes a margin on credits sold.

---

## Pricing Model Evaluation

### Option A: BYOK (Bring Your Own Key)

User enters their own Suno API key. AIA passes through to Suno, charges nothing for generation.

| Pros | Cons |
|------|------|
| Zero cost to AIA | Terrible UX — users must create Suno account, get API key |
| Simple to implement | No revenue for AIA |
| | Users see Suno pricing, may go direct |
| | Support burden when Suno keys break |

**Verdict: Reject.** No revenue, poor UX, no moat.

### Option B: Credit Resale (Per-Song Pricing)

AIA buys Suno credits in bulk (Premier plan: 10,000 credits/mo = $30 = $0.003/credit). Users buy AIA credit packs. AIA charges a markup.

| Pack | Credits | Songs (~5 credits each) | Price | Cost to AIA | Margin |
|------|---------|------------------------|-------|-------------|--------|
| Starter | 25 credits | ~5 songs | $4.99 | $0.075 | 98.5% |
| Creator | 100 credits | ~20 songs | $14.99 | $0.30 | 98% |
| Pro | 500 credits | ~100 songs | $49.99 | $1.50 | 97% |

**Verdict: Strong option.** High margin, simple mental model ("buy credits, make songs"). Risk: Suno pricing changes break our model.

### Option C: Subscription Tiers

Monthly subscription with credit allowance. Unused credits expire.

| Tier | Monthly | Credits | Songs | Overage |
|------|---------|---------|-------|---------|
| Free | $0 | 10 credits | ~2 songs | Blocked (upgrade to continue) |
| Hobby | $9.99/mo | 100 credits | ~20 songs | $0.15/credit |
| Creator | $24.99/mo | 500 credits | ~100 songs | $0.10/credit |

**Verdict: Best option.** Recurring revenue, predictable costs, familiar model. Free tier drives adoption.

### Recommendation: Option C (Subscription) + Option B (Credit Packs) as Add-Ons

- **Subscriptions** for predictable recurring revenue
- **Credit packs** as one-time top-ups for users who exceed their monthly allowance
- **Free tier** (2 songs/month) to drive adoption and trial

---

## User Scenarios

### User Story 1 — New User Signs Up (Free Tier) (Priority: P1) — MVP

**Acceptance Scenarios:**

1. **Given** a new user visits AIA-Music  
   **When** they create an account (email + password or Google OAuth)  
   **Then** they receive 10 free credits (~2 songs)  
   **And** see their credit balance in the header  
   **And** can immediately generate music

2. **Given** a free user has exhausted their 10 monthly credits  
   **When** they try to generate another song  
   **Then** they see: "You've used your free credits this month. Upgrade to Hobby ($9.99/mo) for 100 credits."  
   **And** can purchase a credit pack as a one-time alternative

### User Story 2 — User Subscribes to Paid Tier (Priority: P1) — MVP

**Acceptance Scenarios:**

1. **Given** a user clicks "Upgrade to Hobby"  
   **When** they're redirected to Stripe Checkout  
   **Then** they see: "Hobby Plan — $9.99/month — 100 credits (~20 songs)"  
   **And** can enter payment info  
   **And** on successful payment, credits are immediately available

2. **Given** a user is on the Hobby plan  
   **When** the next billing cycle starts  
   **Then** Stripe charges $9.99  
   **And** credits reset to 100  
   **And** unused credits from previous month expire

3. **Given** a user wants to upgrade from Hobby to Creator  
   **When** they change plans mid-cycle  
   **Then** Stripe prorates the charge  
   **And** credits are immediately updated to Creator level (500)

4. **Given** a user wants to cancel  
   **When** they cancel via account settings  
   **Then** subscription ends at period end (not immediately)  
   **And** remaining credits are usable until period ends  
   **And** after period ends, account reverts to Free tier

### User Story 3 — User Buys Credit Pack (Priority: P1) — MVP

**Acceptance Scenarios:**

1. **Given** a Hobby user has 5 credits remaining  
   **When** they click "Buy More Credits"  
   **Then** they see credit pack options (Starter $4.99 / Creator $14.99 / Pro $49.99)  
   **And** can purchase via Stripe Checkout (one-time payment)

2. **Given** a user buys a Creator pack (100 credits)  
   **When** payment succeeds  
   **Then** 100 credits are added to their balance immediately  
   **And** pack credits do NOT expire at month end (only subscription credits expire)

### User Story 4 — Credit Tracking and Usage (Priority: P1) — MVP

**Acceptance Scenarios:**

1. **Given** a user generates a song (costs ~5 credits)  
   **When** generation completes  
   **Then** credits are deducted from balance  
   **And** balance shown in UI updates in real-time  
   **And** if user has both subscription and pack credits, subscription credits are consumed first

2. **Given** a user has 3 credits remaining and generation costs 5  
   **When** they attempt to generate  
   **Then** they see: "Not enough credits (3 remaining, 5 needed). Buy more or upgrade your plan."

3. **Given** a user wants to see their usage  
   **When** they open Account → Usage  
   **Then** they see: songs generated this month, credits used, credits remaining, billing date, usage history

### User Story 5 — Overage Handling (Priority: P2)

**Acceptance Scenarios:**

1. **Given** a Creator user has exceeded 500 monthly credits  
   **When** they try to generate  
   **Then** overage credits are charged at $0.10/credit  
   **And** user is notified: "You've exceeded your monthly credits. Overage rate: $0.10/credit. Continue?"  
   **And** overage charges are added to next invoice

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Stripe payment fails (card declined) | User sees error. Credits not added. Retry option. |
| Suno API is down during generation | Credits NOT deducted. User sees "Generation service temporarily unavailable." |
| Suno generation fails (bad prompt, content policy) | Credits deducted only on successful generation. Failed attempts are free. |
| User disputes Stripe charge | Handle via Stripe's dispute flow. Suspend account if fraudulent. |
| User has negative credit balance (race condition) | Prevent via atomic DB operation. Check balance before deducting. |
| Multiple simultaneous generation requests | Queue with credit reservation. Reserve credits on submit, deduct on completion, release on failure. |
| Free tier abuse (multiple accounts) | Rate limit by IP + email domain. Flag suspicious patterns. v2: phone verification. |
| Suno changes pricing | Our credit packs insulate users. Adjust internal cost basis, not user-facing prices. |
| User cancels mid-generation | Generation completes (can't cancel Suno API call). Credits deducted. |

---

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-001 | Stripe Checkout for subscriptions (3 tiers) | MUST |
| FR-002 | Stripe Checkout for one-time credit packs (3 sizes) | MUST |
| FR-003 | Credit balance tracking per user | MUST |
| FR-004 | Credit deduction on successful generation only | MUST |
| FR-005 | Monthly credit reset for subscription users | MUST |
| FR-006 | Pack credits don't expire | MUST |
| FR-007 | Subscription upgrade/downgrade with proration | MUST |
| FR-008 | Subscription cancellation (end of period) | MUST |
| FR-009 | Usage dashboard (songs, credits, billing) | SHOULD |
| FR-010 | Overage billing for paid tiers | SHOULD |
| FR-011 | Credit reservation on generation submit | MUST |
| FR-012 | Free tier with 10 credits/month | MUST |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-001 | Payment processing latency | < 3 seconds (Stripe handles) |
| NFR-002 | Credit balance accuracy | 100% (atomic operations) |
| NFR-003 | Stripe webhook processing | < 5 seconds |

---

## Data Model

```sql
-- User accounts (passwordless — no password_hash column)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    auth_provider VARCHAR(20),               -- microsoft, google, apple, magic_link
    auth_provider_id VARCHAR(255),           -- SSO subject ID (null for magic link)
    stripe_customer_id VARCHAR(100),
    current_plan VARCHAR(20) DEFAULT 'free',  -- free, hobby, creator
    created_at TIMESTAMP DEFAULT NOW()
);

-- Credit balances
CREATE TABLE credit_balances (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    subscription_credits INT DEFAULT 0,      -- expire monthly
    pack_credits INT DEFAULT 0,              -- never expire
    credits_used_this_month INT DEFAULT 0,
    billing_cycle_start TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Credit transactions (audit log)
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(30) NOT NULL,               -- subscription_grant, pack_purchase, generation_deduct, overage
    amount INT NOT NULL,                     -- positive = credit, negative = debit
    balance_after INT NOT NULL,
    reference_id VARCHAR(100),               -- stripe payment ID or generation ID
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_ct_user ON credit_transactions(user_id, created_at);

-- Stripe subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    stripe_subscription_id VARCHAR(100) NOT NULL,
    plan VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,             -- active, canceled, past_due
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Stripe Integration

### Products & Prices (create in Stripe Dashboard)

| Product | Price ID | Type | Amount |
|---------|----------|------|--------|
| Hobby Plan | `price_hobby_monthly` | Recurring/monthly | $9.99 |
| Creator Plan | `price_creator_monthly` | Recurring/monthly | $24.99 |
| Starter Pack | `price_pack_starter` | One-time | $4.99 |
| Creator Pack | `price_pack_creator` | One-time | $14.99 |
| Pro Pack | `price_pack_pro` | One-time | $49.99 |

### Webhooks from Stripe

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activate subscription or add pack credits |
| `invoice.paid` | Reset monthly credits on renewal |
| `customer.subscription.updated` | Handle plan changes |
| `customer.subscription.deleted` | Revert to free tier |
| `invoice.payment_failed` | Notify user, grace period |

### API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/checkout/subscription` | Create Stripe Checkout session for subscription |
| POST | `/api/checkout/credits` | Create Stripe Checkout session for credit pack |
| POST | `/api/webhooks/stripe` | Stripe webhook handler |
| GET | `/api/user/credits` | Get current credit balance |
| GET | `/api/user/usage` | Get usage history |
| POST | `/api/user/cancel` | Cancel subscription |

---

## Marketing Hold (Standing Order)

**DO NOT loop in Cy or any marketing until:**
1. Emet gives a clean quality gate (SOP-013 passed)
2. App is 100% stable and reliable
3. Scott explicitly approves go-to-market

Quality first, marketing second. No customer service costs from a half-baked product.

---

## Out of Scope

- Refunds (handle manually via Stripe Dashboard for v1) — v2
- Annual billing — v2
- Team/organization accounts — v2
- Gift credits — v2
- Referral program — v2
- Revenue sharing with artists — not planned

---

## Success Criteria

| ID | Metric | Target |
|----|--------|--------|
| SC-001 | Free → paid conversion rate | > 5% within 30 days |
| SC-002 | Monthly recurring revenue | > $500 within 90 days of launch |
| SC-003 | Payment failure rate | < 2% |
| SC-004 | Credit accounting accuracy | 100% |

---

## Open Questions

| # | Question | Status |
|---|----------|--------|
| 1 | Does Suno have a bulk/reseller API or do we use individual API calls? | Open |
| 2 | Stripe Connect or direct Stripe account? | Open — suggest direct for v1 |
| 3 | Tax handling (sales tax, VAT)? | Open — Stripe Tax can automate this |
| 4 | Should free tier require credit card? | Open — suggest no (reduces friction) |

---

*"The laborer is worthy of his wages." — 1 Timothy 5:18*
