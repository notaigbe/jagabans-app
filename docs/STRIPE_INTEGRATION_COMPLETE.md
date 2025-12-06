
# Stripe Integration Complete Guide

This guide covers the complete Stripe payment integration for the Jagabans LA mobile app.

## Overview

The app now uses **Stripe** for mobile payments while keeping **Square** for website payments. This provides a native, seamless payment experience on iOS and Android.

## Architecture

### Mobile App Responsibilities
- Display Stripe Payment Sheet
- Collect payment information (card, Apple Pay, Google Pay)
- Trigger payment confirmation
- Listen for realtime order updates
- Update UI after payment success/failure

### Backend Responsibilities (Supabase Edge Functions)
- Create Stripe PaymentIntents
- Store payment records in database
- Process Stripe webhooks
- Update order and payment status
- Send notifications to users

## Setup Instructions

### 1. Stripe Account Setup

1. **Create a Stripe Account**
   - Go to https://stripe.com
   - Sign up for a new account or log in
   - Complete account verification

2. **Get API Keys**
   - Navigate to: https://dashboard.stripe.com/apikeys
   - Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)
   - **IMPORTANT**: Never commit secret keys to version control!

3. **Configure Webhook**
   - Go to: https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - Set URL to: `https://vpunvfkmlmqbfiggqrkn.supabase.co/functions/v1/stripe-webhook`
   - Select events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payment_intent.canceled`
     - `payment_intent.processing`
   - Copy the **Webhook Signing Secret** (starts with `whsec_`)

### 2. Configure Supabase Environment Variables

Set these environment variables in your Supabase project:

```bash
# In Supabase Dashboard > Project Settings > Edge Functions > Secrets
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

Or use the Supabase CLI:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

### 3. Update Mobile App Configuration

Edit `app/checkout.tsx` and replace the placeholder:

```typescript
// Line 32
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY';
```

Replace `pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY` with your actual Stripe publishable key.

### 4. Apply Database Migration

The `stripe_payments` table needs to be created. Run the migration:

```bash
# Using Supabase CLI
supabase db push

# Or apply manually in Supabase Dashboard > SQL Editor
# Run the contents of: supabase/migrations/create_stripe_payments_table.sql
```

This migration:
- Creates the `stripe_payments` table
- Enables Row Level Security (RLS)
- Sets up RLS policies for users and admins
- Creates indexes for performance
- Enables realtime on the `orders` table
- Adds `payment_status` and `payment_id` columns to orders

### 5. Deploy Edge Functions

Deploy the Stripe edge functions:

```bash
# Deploy create-payment-intent function
supabase functions deploy create-payment-intent

# Deploy stripe-webhook function
supabase functions deploy stripe-webhook
```

### 6. Test the Integration

#### Test Mode (Recommended First)

Use Stripe test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`
- Use any future expiry date (e.g., 12/34)
- Use any 3-digit CVC (e.g., 123)
- Use any ZIP code (e.g., 12345)

Full list: https://stripe.com/docs/testing

#### Testing Workflow

1. Add items to cart
2. Navigate to checkout
3. Select delivery or pickup
4. Enter delivery address (if delivery)
5. Tap "Pay $XX.XX"
6. Stripe Payment Sheet opens
7. Enter test card details
8. Complete payment
9. Wait for realtime update
10. See "Order Confirmed" alert

## Database Schema

### stripe_payments Table

```sql
CREATE TABLE stripe_payments (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  stripe_payment_intent_id TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL, -- pending, processing, succeeded, failed, canceled
  payment_method TEXT,
  receipt_url TEXT,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### orders Table Updates

Added columns:
- `payment_status`: Tracks payment state (pending, processing, succeeded, failed, canceled)
- `payment_id`: Stores Stripe PaymentIntent ID

## Operational Workflow

### 1. Customer Places Order

```
Customer selects items → Taps "Place Order"
```

### 2. Order Creation

```
App creates order in Supabase
  ↓
Order status: pending
Payment status: pending
```

### 3. Payment Intent Creation

```
App calls create-payment-intent edge function
  ↓
Edge function creates Stripe PaymentIntent
  ↓
Stores record in stripe_payments table
  ↓
Returns clientSecret to app
```

### 4. Payment Collection

```
App initializes Stripe Payment Sheet
  ↓
Customer enters payment details
  ↓
Customer confirms payment
  ↓
Stripe processes payment
```

### 5. Webhook Processing

```
Stripe sends webhook to stripe-webhook edge function
  ↓
Edge function validates signature
  ↓
Updates stripe_payments table
  ↓
Updates orders table (status + payment_status)
  ↓
Creates notification for user
```

### 6. Realtime Update

```
App listens to orders table via Supabase Realtime
  ↓
Receives payment_status update
  ↓
Shows "Order Confirmed" alert
  ↓
Clears cart
  ↓
Awards points to user
```

## Edge Functions

### create-payment-intent

**Endpoint**: `/functions/v1/create-payment-intent`

**Request**:
```json
{
  "orderId": "uuid",
  "amount": 1000,
  "currency": "usd",
  "metadata": {
    "orderType": "delivery",
    "itemCount": 3
  }
}
```

**Response**:
```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

### stripe-webhook

**Endpoint**: `/functions/v1/stripe-webhook`

**Events Handled**:
- `payment_intent.succeeded` → Order status: preparing, Payment status: succeeded
- `payment_intent.payment_failed` → Order status: cancelled, Payment status: failed
- `payment_intent.canceled` → Order status: cancelled, Payment status: canceled
- `payment_intent.processing` → Payment status: processing

## Security

### Row Level Security (RLS)

All tables have RLS enabled:

**stripe_payments**:
- Users can view their own payments
- Users can insert their own payments
- Admins can view all payments

**orders**:
- Users can view their own orders
- Users can insert their own orders
- Admins can view all orders

### API Security

- All edge function calls require authentication
- Stripe webhook signature validation prevents unauthorized requests
- Sensitive keys stored as environment variables
- Client only receives publishable key (safe to expose)

## Monitoring & Debugging

### Stripe Dashboard

Monitor payments in real-time:
- https://dashboard.stripe.com/payments
- View successful payments
- See failed payment reasons
- Access customer receipts

### Supabase Logs

View edge function logs:
```bash
supabase functions logs create-payment-intent
supabase functions logs stripe-webhook
```

Or in Supabase Dashboard:
- Edge Functions → Select function → Logs

### Database Queries

Check payment status:
```sql
-- Recent payments
SELECT * FROM stripe_payments 
ORDER BY created_at DESC 
LIMIT 10;

-- Failed payments
SELECT * FROM stripe_payments 
WHERE status = 'failed' 
ORDER BY created_at DESC;

-- Orders with payment status
SELECT 
  o.id,
  o.total,
  o.status,
  o.payment_status,
  sp.stripe_payment_intent_id,
  sp.status as stripe_status
FROM orders o
LEFT JOIN stripe_payments sp ON sp.order_id = o.id
ORDER BY o.created_at DESC
LIMIT 10;
```

## Troubleshooting

### Payment Sheet Not Opening

**Issue**: Payment sheet doesn't appear after tapping "Pay"

**Solutions**:
1. Check Stripe publishable key is correct
2. Verify edge function is deployed
3. Check console logs for errors
4. Ensure user is authenticated

### Payment Succeeds But Order Not Updated

**Issue**: Payment completes but order stays "pending"

**Solutions**:
1. Check webhook is configured correctly
2. Verify webhook signing secret is set
3. Check edge function logs for errors
4. Ensure realtime is enabled on orders table

### Address Validation Failing

**Issue**: Address validation not working

**Solutions**:
1. Verify verify-address edge function exists
2. Check Google Maps API key is configured
3. Test with a known valid address

### Realtime Updates Not Working

**Issue**: App doesn't receive order updates

**Solutions**:
1. Verify realtime is enabled: `ALTER PUBLICATION supabase_realtime ADD TABLE orders;`
2. Check Supabase project settings → API → Realtime is enabled
3. Ensure app is subscribed to correct channel
4. Check for network connectivity issues

## Going Live

### Pre-Launch Checklist

- [ ] Replace test Stripe keys with live keys
- [ ] Update webhook endpoint to use live mode
- [ ] Test with real payment methods
- [ ] Verify webhook is receiving events
- [ ] Test full order flow end-to-end
- [ ] Set up Stripe email receipts
- [ ] Configure Stripe radar rules (fraud prevention)
- [ ] Set up Stripe billing alerts
- [ ] Review and test refund process
- [ ] Document customer support procedures

### Live Mode Configuration

1. **Get Live API Keys**
   - Go to: https://dashboard.stripe.com/apikeys
   - Toggle to "Live mode"
   - Copy live publishable key (`pk_live_`)
   - Copy live secret key (`sk_live_`)

2. **Update Environment Variables**
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
   ```

3. **Update Mobile App**
   ```typescript
   const STRIPE_PUBLISHABLE_KEY = 'pk_live_YOUR_LIVE_PUBLISHABLE_KEY';
   ```

4. **Configure Live Webhook**
   - Create new webhook endpoint in live mode
   - Use same URL: `https://vpunvfkmlmqbfiggqrkn.supabase.co/functions/v1/stripe-webhook`
   - Copy new webhook signing secret
   - Update environment variable:
     ```bash
     supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET
     ```

## Support

### Stripe Support
- Documentation: https://stripe.com/docs
- Support: https://support.stripe.com

### Supabase Support
- Documentation: https://supabase.com/docs
- Discord: https://discord.supabase.com

## Additional Resources

- [Stripe Payment Intents API](https://stripe.com/docs/payments/payment-intents)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe React Native SDK](https://stripe.com/docs/payments/accept-a-payment?platform=react-native)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

## Notes

- Square payments are still used for website orders
- Mobile app exclusively uses Stripe
- Both payment systems write to separate tables (stripe_payments vs square_payments)
- Orders table tracks which payment system was used via payment_id format
- Points are awarded after successful payment confirmation
- Failed payments automatically cancel the order
- Customers receive notifications for payment success/failure
