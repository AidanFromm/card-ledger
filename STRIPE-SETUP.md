# Stripe Setup Guide for CardLedger

## When the LLC is ready, follow these steps:

### 1. Create Stripe Account
- Go to https://dashboard.stripe.com/register
- Complete business verification with LLC details

### 2. Create Products & Prices in Stripe Dashboard
Go to Products → Add Product:

**Product 1: CardLedger Pro Monthly**
- Name: CardLedger Pro
- Price: $7.99/month (recurring)
- Copy the Price ID (starts with `price_`)

**Product 2: CardLedger Pro Annual**  
- Name: CardLedger Pro Annual
- Price: $59.99/year (recurring)
- Copy the Price ID

**Product 3: CardLedger Lifetime**
- Name: CardLedger Lifetime
- Price: $149.00 (one-time)
- Copy the Price ID

### 3. Get API Keys
- Dashboard → Developers → API Keys
- Copy: Publishable key (`pk_live_...`) and Secret key (`sk_live_...`)

### 4. Set Up Webhook
- Dashboard → Developers → Webhooks → Add endpoint
- URL: `https://vbedydaozlvujkpcojct.supabase.co/functions/v1/stripe-webhook`
- Events to listen for:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- Copy the Webhook Signing Secret (`whsec_...`)

### 5. Add Environment Variables

**In `.env` (local):**
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_PRICE_PRO_MONTHLY=price_...
VITE_STRIPE_PRICE_PRO_ANNUAL=price_...
VITE_STRIPE_PRICE_LIFETIME=price_...
```

**In Vercel (production):**
Same variables as above in Project Settings → Environment Variables

**In Supabase (Edge Functions):**
Dashboard → Edge Functions → Secrets:
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 6. Run Database Migration
In Supabase SQL Editor, run:
`supabase/migrations/20260220_subscriptions.sql`

### 7. Deploy Edge Functions
```bash
supabase functions deploy stripe-checkout --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy stripe-portal --no-verify-jwt
```

### 8. Test
1. Use Stripe test mode first (`pk_test_...`, `sk_test_...`)
2. Use test card: 4242 4242 4242 4242
3. Verify subscription shows up in Supabase
4. Switch to live keys when ready

## Files Created
- `src/lib/stripe.ts` — Plans config, checkout, portal, feature gating
- `src/hooks/useSubscription.ts` — React hook for subscription state
- `supabase/functions/stripe-checkout/index.ts` — Creates checkout sessions
- `supabase/functions/stripe-webhook/index.ts` — Handles Stripe events
- `supabase/functions/stripe-portal/index.ts` — Customer portal
- `supabase/migrations/20260220_subscriptions.sql` — Database table

## Revenue Projections
- 100 Pro Monthly users = $799/mo
- 50 Pro Annual users = $3,000/yr
- 20 Lifetime users = $2,980 one-time
- **Break-even at ~15 Pro Monthly users** (covers Supabase + Vercel costs)
