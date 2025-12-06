
# Stripe Payment Integration

Welcome to the Stripe payment integration documentation for Jagabans LA mobile app.

## Quick Links

- **New to Stripe?** Start with [Quick Start Guide](STRIPE_SETUP_QUICK_START.md)
- **Need complete details?** Read [Complete Integration Guide](STRIPE_INTEGRATION_COMPLETE.md)
- **Ready to configure?** Use [Configuration Checklist](STRIPE_CONFIGURATION_CHECKLIST.md)
- **Want to understand the migration?** See [Migration Summary](STRIPE_MIGRATION_SUMMARY.md)
- **Comparing providers?** Check [Square vs Stripe Comparison](SQUARE_VS_STRIPE_COMPARISON.md)

## What's New

The mobile app now uses **Stripe** for payments instead of Square, providing:

✅ Native payment sheet UI
✅ Apple Pay & Google Pay support
✅ Faster checkout experience
✅ Better error handling
✅ Realtime order updates
✅ Automatic 3D Secure authentication

## Quick Setup (20 minutes)

1. **Get Stripe API keys** (5 min)
   - Sign up at https://stripe.com
   - Get publishable and secret keys

2. **Configure webhook** (5 min)
   - Add webhook endpoint in Stripe Dashboard
   - Get signing secret

3. **Set environment variables** (2 min)
   - Add keys to Supabase

4. **Update app config** (1 min)
   - Add publishable key to checkout.tsx

5. **Apply database migration** (2 min)
   - Run migration to create stripe_payments table

6. **Deploy edge functions** (3 min)
   - Deploy create-payment-intent and stripe-webhook

7. **Test** (5 min)
   - Complete test payment with test card

See [Quick Start Guide](STRIPE_SETUP_QUICK_START.md) for detailed steps.

## Architecture Overview

```
Mobile App → Supabase Edge Function → Stripe API
                ↓
         Create PaymentIntent
                ↓
         Return Client Secret
                ↓
    Mobile App Payment Sheet
                ↓
         Customer Pays
                ↓
         Stripe Webhook
                ↓
    Update Order Status
                ↓
    Realtime Update to App
```

## Key Files

### Mobile App
- `app/checkout.tsx` - Checkout screen with Stripe integration

### Edge Functions
- `supabase/functions/create-payment-intent/index.ts` - Creates PaymentIntent
- `supabase/functions/stripe-webhook/index.ts` - Processes webhooks

### Database
- `supabase/migrations/create_stripe_payments_table.sql` - Database schema

### Documentation
- `docs/STRIPE_INTEGRATION_COMPLETE.md` - Complete guide
- `docs/STRIPE_SETUP_QUICK_START.md` - Quick setup
- `docs/STRIPE_CONFIGURATION_CHECKLIST.md` - Configuration checklist
- `docs/STRIPE_MIGRATION_SUMMARY.md` - Migration overview
- `docs/SQUARE_VS_STRIPE_COMPARISON.md` - Provider comparison

## Testing

Use these Stripe test cards:

| Card | Scenario |
|------|----------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Decline |
| 4000 0025 0000 3155 | 3D Secure |

Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)

## Support

### Documentation
- Start with the [Quick Start Guide](STRIPE_SETUP_QUICK_START.md)
- For issues, check the troubleshooting section in [Complete Guide](STRIPE_INTEGRATION_COMPLETE.md)

### External Resources
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe React Native SDK](https://stripe.com/docs/payments/accept-a-payment?platform=react-native)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

### Getting Help
1. Check the troubleshooting section
2. Review Supabase edge function logs
3. Check Stripe Dashboard for payment details
4. Verify environment variables are set

## Status

✅ Implementation complete
✅ Documentation complete
✅ Edge functions ready
✅ Database migration ready
⏳ Awaiting setup (requires API keys)

## Next Steps

1. Follow the [Quick Start Guide](STRIPE_SETUP_QUICK_START.md)
2. Complete the [Configuration Checklist](STRIPE_CONFIGURATION_CHECKLIST.md)
3. Test thoroughly with test cards
4. Deploy to production

---

**Questions?** Start with the [Quick Start Guide](STRIPE_SETUP_QUICK_START.md) or read the [Complete Integration Guide](STRIPE_INTEGRATION_COMPLETE.md).
