
# Square Payment Integration Guide

This guide explains how to set up and use Square payments in the Jagabans LA food ordering app.

## Overview

The app integrates Square Checkout for secure payment processing. Square handles all payment data, ensuring PCI-DSS compliance and bank-level encryption.

## Features

- **Secure Payment Processing**: All payment data is handled by Square's secure infrastructure
- **Multiple Payment Options**: 
  - Saved card payments (using tokenized cards)
  - Web checkout (redirect to Square's hosted checkout page)
- **Payment Tracking**: All transactions are stored in the database for record-keeping
- **Receipt Generation**: Square provides receipt URLs for each transaction
- **Sandbox Testing**: Test payments in sandbox mode before going live

## Setup Instructions

### 1. Create a Square Developer Account

1. Go to [Square Developer Portal](https://developer.squareup.com/)
2. Sign up for a developer account
3. Create a new application

### 2. Get Your API Credentials

From your Square application dashboard, you'll need:

- **Application ID**: Found in the application settings
- **Access Token**: 
  - Sandbox Access Token (for testing)
  - Production Access Token (for live payments)
- **Location ID**: The ID of your Square business location

### 3. Configure Environment Variables

Add the following environment variables to your Supabase Edge Functions:

```bash
# Square Configuration
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_LOCATION_ID=your_square_location_id
SQUARE_ENVIRONMENT=sandbox  # or 'production' for live payments
```

To set these in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to Edge Functions → Secrets
3. Add each secret with its corresponding value

### 4. Test in Sandbox Mode

Square provides test card numbers for sandbox testing:

**Successful Payment:**
- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiration: Any future date
- Postal Code: Any valid postal code

**Test Nonce (for API testing):**
- Source ID: `cnon:card-nonce-ok`

### 5. Go Live

When ready for production:

1. Complete Square's application review process
2. Update `SQUARE_ENVIRONMENT` to `production`
3. Replace sandbox access token with production access token
4. Test thoroughly with real payment methods

## Payment Flow

### Saved Card Payment

1. User selects a saved payment method
2. App calls `process-square-payment` Edge Function
3. Edge Function creates payment with Square API
4. Payment record is stored in `square_payments` table
5. Order is created and linked to payment
6. User receives confirmation

### Web Checkout Payment

1. User selects "Web Checkout" option
2. App calls `create-square-checkout` Edge Function
3. Edge Function creates a Square payment link
4. User is redirected to Square's hosted checkout page
5. After payment, user is redirected back to the app
6. Webhook (optional) confirms payment completion

## Database Schema

### square_payments Table

```sql
CREATE TABLE square_payments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id),
  order_id UUID REFERENCES orders(id),
  square_payment_id TEXT NOT NULL,
  square_order_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  payment_method TEXT,
  receipt_url TEXT,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Edge Functions

### process-square-payment

Processes a payment using Square's Payments API.

**Request:**
```json
{
  "sourceId": "cnon:card-nonce-ok",
  "amount": 25.50,
  "currency": "USD",
  "orderId": "uuid-of-order",
  "note": "Order for customer"
}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "square-payment-id",
    "status": "COMPLETED",
    "amount": 25.50,
    "currency": "USD",
    "receipt_url": "https://squareup.com/receipt/...",
    "payment_record_id": "uuid"
  }
}
```

### create-square-checkout

Creates a Square payment link for web checkout.

**Request:**
```json
{
  "items": [
    {
      "name": "Jollof Rice",
      "quantity": 2,
      "price": 12.99
    }
  ],
  "deliveryAddress": "123 Main St",
  "pickupNotes": "Ring doorbell",
  "redirectUrl": "https://yourapp.com/order-confirmation"
}
```

**Response:**
```json
{
  "success": true,
  "checkout": {
    "id": "checkout-id",
    "url": "https://squareup.com/checkout/...",
    "order_id": "square-order-id",
    "total": 28.25
  }
}
```

## Security Best Practices

1. **Never store Square API keys in the app**: Always use Edge Functions
2. **Use HTTPS**: All API calls must use HTTPS
3. **Validate amounts**: Always verify payment amounts on the server
4. **Implement idempotency**: Use unique idempotency keys for each payment
5. **Handle errors gracefully**: Provide clear error messages to users
6. **Log transactions**: Keep detailed logs for debugging and auditing

## Testing Checklist

- [ ] Test successful payment with sandbox card
- [ ] Test declined payment
- [ ] Test insufficient funds
- [ ] Test network errors
- [ ] Test payment with points discount
- [ ] Test web checkout flow
- [ ] Verify payment records are created correctly
- [ ] Verify orders are linked to payments
- [ ] Test receipt URL generation
- [ ] Test refund process (if implemented)

## Troubleshooting

### Common Issues

**Error: "Square configuration is missing"**
- Ensure `SQUARE_ACCESS_TOKEN` and `SQUARE_LOCATION_ID` are set in Edge Function secrets

**Error: "Payment failed"**
- Check Square API logs in the developer dashboard
- Verify the access token is valid and not expired
- Ensure you're using the correct environment (sandbox vs production)

**Error: "Unauthorized"**
- Verify the user is authenticated
- Check that the authorization header is being passed correctly

### Support Resources

- [Square Developer Documentation](https://developer.squareup.com/docs)
- [Square API Reference](https://developer.squareup.com/reference/square)
- [Square Community Forum](https://developer.squareup.com/forums)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)

## Future Enhancements

Potential improvements to consider:

1. **Webhooks**: Implement Square webhooks for real-time payment updates
2. **Refunds**: Add refund functionality through the admin panel
3. **Saved Cards**: Implement proper card tokenization with Square Web Payments SDK
4. **Apple Pay / Google Pay**: Add digital wallet support
5. **Recurring Payments**: Support subscription-based orders
6. **Payment Analytics**: Track payment success rates and trends
7. **Multi-currency**: Support international payments

## Compliance

This integration follows:
- PCI-DSS compliance standards
- Square's security best practices
- GDPR data protection requirements
- Industry-standard encryption protocols

All sensitive payment data is handled exclusively by Square's secure infrastructure.
