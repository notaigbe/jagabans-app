
# Stripe Integration Guide

This guide explains how to set up and use Stripe payments in the Jagabans LA mobile app.

## Overview

The app uses Stripe for payment processing with the following architecture:

- **Mobile App**: Handles payment UI (Payment Sheet, Apple Pay, Google Pay)
- **Supabase Edge Functions**: Handle PaymentIntent creation and webhook processing
- **Stripe**: Processes payments and sends webhooks

## Setup Instructions

### 1. Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create an account or log in
3. Navigate to **Developers** → **API keys**
4. Copy your **Publishable key** (starts with `pk_test_` for test mode)
5. Copy your **Secret key** (starts with `sk_test_` for test mode)

### 2. Configure Stripe Keys in Supabase

Set the following environment variables in your Supabase project:

```bash
# In Supabase Dashboard → Project Settings → Edge Functions → Secrets
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 3. Configure Stripe Publishable Key in App

Update the `STRIPE_PUBLISHABLE_KEY` in `app/checkout.tsx`:

```typescript
const STRIPE_PUBLISHABLE_KEY = 'pk_test_your_publishable_key_here';
```

### 4. Set Up Stripe Webhook

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Enter your webhook URL:
   ```
   https://vpunvfkmlmqbfiggqrkn.supabase.co/functions/v1/stripe-webhook
   ```
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `payment_intent.processing`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add it to Supabase environment variables as `STRIPE_WEBHOOK_SECRET`

### 5. Create Database Tables

Run the following SQL in Supabase SQL Editor:

```sql
-- Create stripe_payments table
CREATE TABLE IF NOT EXISTS stripe_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled')),
  payment_method TEXT,
  receipt_url TEXT,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE stripe_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own stripe payments"
  ON stripe_payments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stripe payments"
  ON stripe_payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all stripe payments
CREATE POLICY "Admins can view all stripe payments"
  ON stripe_payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role IN ('admin', 'super_admin')
    )
  );

-- Create indexes
CREATE INDEX idx_stripe_payments_user_id ON stripe_payments(user_id);
CREATE INDEX idx_stripe_payments_order_id ON stripe_payments(order_id);
CREATE INDEX idx_stripe_payments_stripe_payment_intent_id ON stripe_payments(stripe_payment_intent_id);
CREATE INDEX idx_stripe_payments_status ON stripe_payments(status);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_stripe_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stripe_payments_updated_at
  BEFORE UPDATE ON stripe_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_stripe_payments_updated_at();

-- Enable realtime on orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Add payment_status column to orders if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending' 
      CHECK (payment_status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled'));
  END IF;
END $$;
```

### 6. Deploy Edge Functions

Deploy the Stripe edge functions to Supabase:

```bash
# Deploy create-payment-intent function
supabase functions deploy create-payment-intent

# Deploy stripe-webhook function
supabase functions deploy stripe-webhook
```

## Payment Flow

### Customer Journey

1. **Customer selects menu items** → Adds items to cart
2. **Customer taps "Place Order"** → Navigates to checkout
3. **App creates order in Supabase** → Order record created with status "pending"
4. **App calls create-payment-intent** → Edge function creates Stripe PaymentIntent
5. **Stripe Payment Sheet opens** → Customer enters payment details
6. **Customer completes payment** → Stripe processes payment
7. **Stripe sends webhook** → Webhook updates order status
8. **App receives realtime update** → Customer sees "Order Confirmed"
9. **Kitchen dashboard updates** → New paid order appears

### Technical Flow

```
Mobile App
    ↓
Create Order (Supabase)
    ↓
Call create-payment-intent Edge Function
    ↓
Stripe creates PaymentIntent
    ↓
Return clientSecret to app
    ↓
App presents Payment Sheet
    ↓
Customer completes payment
    ↓
Stripe processes payment
    ↓
Stripe sends webhook to stripe-webhook Edge Function
    ↓
Edge Function updates orders & stripe_payments tables
    ↓
Realtime subscription notifies app
    ↓
App shows success message
```

## Edge Functions

### create-payment-intent

**Purpose**: Creates a Stripe PaymentIntent and stores initial payment record

**Input**:
```json
{
  "orderId": "uuid",
  "amount": 1000,
  "currency": "usd",
  "metadata": {}
}
```

**Output**:
```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

### stripe-webhook

**Purpose**: Handles Stripe webhook events and updates database

**Events Handled**:
- `payment_intent.succeeded` → Updates order to "preparing", payment to "succeeded"
- `payment_intent.payment_failed` → Updates order to "cancelled", payment to "failed"
- `payment_intent.canceled` → Updates order to "cancelled", payment to "canceled"
- `payment_intent.processing` → Updates payment to "processing"

## Testing

### Test Mode

Use Stripe test cards for testing:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

Use any future expiry date, any 3-digit CVC, and any ZIP code.

### Test Webhooks Locally

1. Install Stripe CLI:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhooks to local Supabase:
   ```bash
   stripe listen --forward-to https://vpunvfkmlmqbfiggqrkn.supabase.co/functions/v1/stripe-webhook
   ```

## Production Checklist

Before going live:

- [ ] Replace test keys with live keys (`pk_live_` and `sk_live_`)
- [ ] Update webhook endpoint to use live mode
- [ ] Test with real payment methods
- [ ] Set up proper error monitoring
- [ ] Configure webhook retry logic
- [ ] Set up Stripe Dashboard alerts
- [ ] Review and adjust payment flow timeouts
- [ ] Test Apple Pay and Google Pay
- [ ] Verify refund flow works correctly
- [ ] Set up proper logging and monitoring

## Troubleshooting

### Payment Sheet Not Opening

- Check that `STRIPE_PUBLISHABLE_KEY` is set correctly
- Verify the PaymentIntent was created successfully
- Check console logs for initialization errors

### Webhook Not Receiving Events

- Verify webhook URL is correct
- Check that `STRIPE_WEBHOOK_SECRET` is set
- Test webhook signature verification
- Check Supabase Edge Function logs

### Order Not Updating After Payment

- Verify realtime is enabled on orders table
- Check that webhook is processing correctly
- Verify order ID is in PaymentIntent metadata
- Check Supabase logs for errors

### Payment Succeeds But Order Shows Pending

- Check webhook delivery in Stripe Dashboard
- Verify webhook signature is valid
- Check Edge Function logs for errors
- Ensure database permissions are correct

## Support

For issues:
1. Check Stripe Dashboard → Developers → Logs
2. Check Supabase Dashboard → Edge Functions → Logs
3. Check app console logs
4. Review this documentation

For Stripe-specific questions, visit [Stripe Documentation](https://stripe.com/docs)
