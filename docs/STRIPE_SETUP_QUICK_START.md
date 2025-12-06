
# Stripe Setup Quick Start

Follow these steps to get Stripe payments working in your app.

## Prerequisites

- Stripe account (sign up at https://stripe.com)
- Supabase project access
- Supabase CLI installed (optional but recommended)

## Step-by-Step Setup

### Step 1: Get Stripe API Keys (5 minutes)

1. Log in to Stripe Dashboard: https://dashboard.stripe.com
2. Go to Developers → API keys: https://dashboard.stripe.com/apikeys
3. Copy these keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)
   - Keep these safe! Never commit secret key to git.

### Step 2: Configure Stripe Webhook (5 minutes)

1. Go to Developers → Webhooks: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter endpoint URL:
   ```
   https://vpunvfkmlmqbfiggqrkn.supabase.co/functions/v1/stripe-webhook
   ```
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `payment_intent.processing`
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_`)

### Step 3: Set Supabase Environment Variables (2 minutes)

#### Option A: Using Supabase Dashboard

1. Go to your Supabase project
2. Navigate to: Project Settings → Edge Functions → Secrets
3. Add these secrets:
   - Name: `STRIPE_SECRET_KEY`, Value: `sk_test_YOUR_SECRET_KEY`
   - Name: `STRIPE_WEBHOOK_SECRET`, Value: `whsec_YOUR_WEBHOOK_SECRET`

#### Option B: Using Supabase CLI

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

### Step 4: Update Mobile App Config (1 minute)

1. Open `app/checkout.tsx`
2. Find line 32:
   ```typescript
   const STRIPE_PUBLISHABLE_KEY = 'pk_test_51YOUR_STRIPE_PUBLISHABLE_KEY';
   ```
3. Replace with your actual publishable key:
   ```typescript
   const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_ACTUAL_KEY_HERE';
   ```

### Step 5: Apply Database Migration (2 minutes)

#### Option A: Using Supabase Dashboard

1. Go to SQL Editor in Supabase Dashboard
2. Open the file: `supabase/migrations/create_stripe_payments_table.sql`
3. Copy the entire contents
4. Paste into SQL Editor
5. Click "Run"

#### Option B: Using Supabase CLI

```bash
supabase db push
```

### Step 6: Deploy Edge Functions (3 minutes)

```bash
# Deploy create-payment-intent function
supabase functions deploy create-payment-intent

# Deploy stripe-webhook function
supabase functions deploy stripe-webhook
```

### Step 7: Test the Integration (5 minutes)

1. Run your app
2. Add items to cart
3. Go to checkout
4. Tap "Pay $XX.XX"
5. Use Stripe test card:
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
6. Complete payment
7. Wait for "Order Confirmed" alert

## Verification Checklist

After setup, verify everything works:

- [ ] Stripe publishable key is set in `app/checkout.tsx`
- [ ] Stripe secret key is set in Supabase environment variables
- [ ] Stripe webhook secret is set in Supabase environment variables
- [ ] Webhook endpoint is configured in Stripe Dashboard
- [ ] Database migration has been applied
- [ ] `stripe_payments` table exists in database
- [ ] Realtime is enabled on `orders` table
- [ ] Edge functions are deployed
- [ ] Test payment completes successfully
- [ ] Order status updates to "preparing"
- [ ] Payment status updates to "succeeded"
- [ ] User receives "Order Confirmed" alert
- [ ] Points are awarded to user
- [ ] Cart is cleared after successful payment

## Common Issues

### "Payment sheet not opening"
- Check that publishable key is correct
- Verify edge function is deployed
- Check console for errors

### "Payment succeeds but order not updated"
- Verify webhook is configured correctly
- Check webhook signing secret is set
- View edge function logs for errors

### "Realtime updates not working"
- Ensure realtime is enabled on orders table
- Check Supabase project settings → API → Realtime
- Verify app is subscribed to correct channel

## Test Cards

Use these Stripe test cards:

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Card declined |
| 4000 0025 0000 3155 | Requires authentication |
| 4000 0000 0000 9995 | Insufficient funds |

Full list: https://stripe.com/docs/testing

## Next Steps

Once everything is working:

1. Review the complete guide: `docs/STRIPE_INTEGRATION_COMPLETE.md`
2. Test different payment scenarios
3. Set up monitoring and alerts
4. Plan for going live with production keys

## Support

If you encounter issues:

1. Check the troubleshooting section in `STRIPE_INTEGRATION_COMPLETE.md`
2. Review Supabase edge function logs
3. Check Stripe Dashboard for payment details
4. Verify all environment variables are set correctly

## Going Live

When ready for production:

1. Get live Stripe API keys (start with `pk_live_` and `sk_live_`)
2. Create new webhook endpoint in live mode
3. Update all environment variables with live keys
4. Update mobile app with live publishable key
5. Test thoroughly with real payment methods
6. Monitor first few transactions closely

---

**Estimated Total Setup Time**: 20-25 minutes

**Need Help?** Check `docs/STRIPE_INTEGRATION_COMPLETE.md` for detailed documentation.
