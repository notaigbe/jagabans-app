
# Stripe Configuration Checklist

Use this checklist to ensure Stripe is properly configured in your app.

## Pre-Setup

- [ ] Stripe account created
- [ ] Stripe account verified
- [ ] Supabase project access confirmed
- [ ] Development environment ready

## Stripe Dashboard Configuration

### API Keys

- [ ] Logged into Stripe Dashboard
- [ ] Navigated to Developers → API keys
- [ ] Copied Publishable key (pk_test_...)
- [ ] Copied Secret key (sk_test_...)
- [ ] Stored keys securely (not in version control)

### Webhook Configuration

- [ ] Navigated to Developers → Webhooks
- [ ] Clicked "Add endpoint"
- [ ] Entered webhook URL: `https://vpunvfkmlmqbfiggqrkn.supabase.co/functions/v1/stripe-webhook`
- [ ] Selected event: `payment_intent.succeeded`
- [ ] Selected event: `payment_intent.payment_failed`
- [ ] Selected event: `payment_intent.canceled`
- [ ] Selected event: `payment_intent.processing`
- [ ] Saved webhook endpoint
- [ ] Copied Signing secret (whsec_...)

## Supabase Configuration

### Environment Variables

- [ ] Opened Supabase Dashboard
- [ ] Navigated to Project Settings → Edge Functions → Secrets
- [ ] Added secret: `STRIPE_SECRET_KEY` = `sk_test_...`
- [ ] Added secret: `STRIPE_WEBHOOK_SECRET` = `whsec_...`
- [ ] Verified secrets are saved

### Database Migration

- [ ] Opened SQL Editor in Supabase Dashboard
- [ ] Ran migration: `create_stripe_payments_table.sql`
- [ ] Verified `stripe_payments` table exists
- [ ] Verified `orders` table has `payment_status` column
- [ ] Verified `orders` table has `payment_id` column
- [ ] Verified realtime is enabled on `orders` table
- [ ] Checked RLS policies are created

### Edge Functions

- [ ] Deployed `create-payment-intent` function
- [ ] Deployed `stripe-webhook` function
- [ ] Verified functions appear in Supabase Dashboard
- [ ] Checked function logs for any errors

## Mobile App Configuration

### Code Updates

- [ ] Opened `app/checkout.tsx`
- [ ] Updated `STRIPE_PUBLISHABLE_KEY` constant (line 32)
- [ ] Replaced placeholder with actual publishable key
- [ ] Saved file
- [ ] Verified no syntax errors

### Dependencies

- [ ] Verified `@stripe/stripe-react-native` is in package.json
- [ ] Version is ^0.57.0 or higher
- [ ] Ran `npm install` or `yarn install`
- [ ] No dependency conflicts

## Testing

### Test Payment Flow

- [ ] Started app in development mode
- [ ] Logged in as test user
- [ ] Added items to cart
- [ ] Navigated to checkout
- [ ] Selected delivery or pickup
- [ ] Entered delivery address (if applicable)
- [ ] Tapped "Pay $XX.XX" button
- [ ] Payment sheet opened successfully
- [ ] Entered test card: 4242 4242 4242 4242
- [ ] Entered expiry: 12/34
- [ ] Entered CVC: 123
- [ ] Entered ZIP: 12345
- [ ] Completed payment
- [ ] Saw "Processing payment..." message
- [ ] Received "Order Confirmed" alert
- [ ] Cart was cleared
- [ ] Points were awarded
- [ ] Order appears in order history

### Verify Database Updates

- [ ] Checked `stripe_payments` table for new record
- [ ] Verified payment status is "succeeded"
- [ ] Checked `orders` table for updated order
- [ ] Verified order status is "preparing"
- [ ] Verified payment_status is "succeeded"
- [ ] Verified payment_id contains Stripe PaymentIntent ID

### Verify Webhook Processing

- [ ] Opened Stripe Dashboard → Webhooks
- [ ] Clicked on webhook endpoint
- [ ] Viewed recent events
- [ ] Verified `payment_intent.succeeded` event was sent
- [ ] Verified response was 200 OK
- [ ] Checked Supabase edge function logs
- [ ] Verified webhook was processed successfully

### Test Failed Payment

- [ ] Started new checkout flow
- [ ] Used decline test card: 4000 0000 0000 0002
- [ ] Completed payment attempt
- [ ] Verified payment failed
- [ ] Checked error message displayed
- [ ] Verified order status is "cancelled"
- [ ] Verified payment_status is "failed"
- [ ] Verified user received notification

### Test Realtime Updates

- [ ] Started checkout flow
- [ ] Completed payment
- [ ] Verified app received realtime update
- [ ] Verified alert appeared without manual refresh
- [ ] Checked console logs for realtime messages

## Production Readiness

### Security

- [ ] Secret keys are not in version control
- [ ] Environment variables are properly set
- [ ] RLS policies are enabled on all tables
- [ ] Webhook signature validation is working
- [ ] HTTPS is used for all API calls

### Monitoring

- [ ] Stripe Dashboard notifications enabled
- [ ] Email alerts configured for failed payments
- [ ] Supabase edge function monitoring enabled
- [ ] Database query performance checked
- [ ] Error logging is working

### Documentation

- [ ] Team members trained on new payment flow
- [ ] Customer support documentation updated
- [ ] Refund process documented
- [ ] Troubleshooting guide reviewed
- [ ] Rollback plan prepared

## Going Live

### Pre-Launch

- [ ] All test mode checks passed
- [ ] Obtained live Stripe API keys
- [ ] Created live webhook endpoint
- [ ] Updated environment variables with live keys
- [ ] Updated mobile app with live publishable key
- [ ] Tested with real payment method
- [ ] Verified live webhook is working
- [ ] Reviewed Stripe account settings
- [ ] Configured Stripe Radar (fraud prevention)
- [ ] Set up Stripe billing alerts

### Launch

- [ ] Deployed updated app to production
- [ ] Monitored first few transactions
- [ ] Verified payments are processing
- [ ] Checked webhook events are received
- [ ] Confirmed orders are updating correctly
- [ ] Verified notifications are sent
- [ ] Monitored error rates

### Post-Launch

- [ ] Collected user feedback
- [ ] Monitored payment success rate
- [ ] Reviewed failed payment reasons
- [ ] Checked customer support tickets
- [ ] Analyzed payment metrics
- [ ] Optimized based on data

## Troubleshooting Checklist

If issues occur, check:

- [ ] Stripe publishable key is correct
- [ ] Stripe secret key is set in Supabase
- [ ] Webhook signing secret is correct
- [ ] Webhook endpoint URL is correct
- [ ] Edge functions are deployed
- [ ] Database migration was applied
- [ ] Realtime is enabled on orders table
- [ ] User is authenticated
- [ ] Network connectivity is working
- [ ] Console logs for error messages
- [ ] Stripe Dashboard for payment details
- [ ] Supabase logs for edge function errors

## Support Resources

- [ ] Bookmarked Stripe Documentation
- [ ] Bookmarked Supabase Documentation
- [ ] Saved Stripe Dashboard URL
- [ ] Saved Supabase Dashboard URL
- [ ] Noted support contact information
- [ ] Reviewed troubleshooting guide

## Sign-Off

### Development Team

- [ ] Developer: Configuration complete
- [ ] QA: Testing passed
- [ ] DevOps: Deployment successful

### Stakeholders

- [ ] Product Manager: Approved for launch
- [ ] Finance: Payment processing verified
- [ ] Customer Support: Trained and ready

---

**Configuration Status**: 

- [ ] Not Started
- [ ] In Progress
- [ ] Complete
- [ ] Production Ready

**Completed By**: ________________

**Date**: ________________

**Notes**: 
_______________________________________
_______________________________________
_______________________________________
