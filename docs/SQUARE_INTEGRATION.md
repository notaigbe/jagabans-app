
# Square Payment Integration Guide

This guide explains how to set up and use Square payments in the Jagabans LA food ordering app.

## Overview

The app integrates Square Checkout for secure payment processing. Square handles all payment data, ensuring PCI-DSS compliance and bank-level encryption.

**✅ IMPORTANT: All Square API calls are made from the backend (Supabase Edge Functions), NOT from the frontend. This ensures your API keys remain secure.**

## Features

- **Secure Payment Processing**: All payment data is handled by Square's secure infrastructure
- **Backend-Only API Calls**: Square API credentials never exposed to the frontend
- **Multiple Payment Options**: 
  - Saved card payments (using tokenized cards)
  - Web checkout (redirect to Square's hosted checkout page)
- **Payment Tracking**: All transactions are stored in the database for record-keeping
- **Receipt Generation**: Square provides receipt URLs for each transaction
- **Sandbox Testing**: Test payments in sandbox mode before going live
- **Comprehensive Logging**: Detailed logs for debugging authentication and payment issues

## Architecture

### Backend (Supabase Edge Functions)

The app uses two Edge Functions to handle Square payments:

1. **`create-square-checkout`**: Creates a Square payment link for web-based checkout
2. **`process-square-payment`**: Processes payments using Square's Payments API

Both functions:
- Run on Supabase's secure backend infrastructure
- Verify user authentication before processing
- Store payment records in the database
- Never expose Square API credentials to the frontend

### Frontend (React Native App)

The frontend (`app/checkout.tsx`):
- Collects order and delivery information
- Authenticates the user with Supabase
- Calls the Edge Functions with the user's auth token
- Displays payment results to the user

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

**⚠️ CRITICAL**: These secrets must be set in Supabase. The Edge Functions will not work without them.

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
2. Frontend gets fresh Supabase auth session
3. Frontend calls `process-square-payment` Edge Function with auth token
4. Edge Function verifies user authentication
5. Edge Function creates payment with Square API
6. Payment record is stored in `square_payments` table
7. Order is created and linked to payment
8. User receives confirmation

### Web Checkout Payment

1. User selects "Web Checkout" option
2. Frontend gets fresh Supabase auth session
3. Frontend calls `create-square-checkout` Edge Function with auth token
4. Edge Function verifies user authentication
5. Edge Function creates a Square payment link
6. User is redirected to Square's hosted checkout page
7. After payment, user is redirected back to the app
8. Webhook (optional) confirms payment completion

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

1. **Never store Square API keys in the app**: Always use Edge Functions ✅
2. **Use HTTPS**: All API calls must use HTTPS ✅
3. **Validate amounts**: Always verify payment amounts on the server ✅
4. **Implement idempotency**: Use unique idempotency keys for each payment ✅
5. **Handle errors gracefully**: Provide clear error messages to users ✅
6. **Log transactions**: Keep detailed logs for debugging and auditing ✅
7. **Verify authentication**: Always check user auth before processing payments ✅

## Troubleshooting

### Common Issues

#### Error: "Not authenticated"

**Cause**: The user's Supabase session is invalid or expired.

**Solutions**:
1. Check that the user is logged in
2. Verify the auth token is being passed correctly in the Authorization header
3. Try logging out and logging back in
4. Check the Edge Function logs for more details

**How to check**:
```typescript
// In your frontend code
const { data: { session }, error } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('Error:', error);
```

#### Error: "Square configuration is missing"

**Cause**: `SQUARE_ACCESS_TOKEN` or `SQUARE_LOCATION_ID` environment variables are not set in Supabase.

**Solutions**:
1. Go to Supabase Dashboard → Edge Functions → Secrets
2. Add `SQUARE_ACCESS_TOKEN` with your Square access token
3. Add `SQUARE_LOCATION_ID` with your Square location ID
4. Add `SQUARE_ENVIRONMENT` with either `sandbox` or `production`

#### Error: "Payment failed"

**Cause**: Square API rejected the payment.

**Solutions**:
1. Check Square API logs in the developer dashboard
2. Verify the access token is valid and not expired
3. Ensure you're using the correct environment (sandbox vs production)
4. Check that the source ID (card nonce) is valid
5. Verify the location ID is correct

#### Error: "Unauthorized"

**Cause**: The authorization header is missing or invalid.

**Solutions**:
1. Verify the user is authenticated
2. Check that the authorization header is being passed correctly
3. Ensure the session hasn't expired
4. Try refreshing the session

### Debugging Steps

1. **Check Frontend Logs**:
   - Open the app's console
   - Look for authentication and API call logs
   - Verify the session is valid

2. **Check Edge Function Logs**:
   - Go to Supabase Dashboard → Edge Functions
   - Select the function (create-square-checkout or process-square-payment)
   - View the logs for detailed error messages

3. **Check Square Dashboard**:
   - Go to Square Developer Dashboard
   - View API logs for your application
   - Check for any rejected requests

4. **Test Authentication**:
   ```typescript
   const { data: { session } } = await supabase.auth.getSession();
   console.log('Session valid:', !!session);
   console.log('Access token:', session?.access_token?.substring(0, 20) + '...');
   ```

5. **Test Edge Function Directly**:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/create-square-checkout \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"items":[{"name":"Test","quantity":1,"price":10}],"deliveryAddress":"123 Test St"}'
   ```

### Support Resources

- [Square Developer Documentation](https://developer.squareup.com/docs)
- [Square API Reference](https://developer.squareup.com/reference/square)
- [Square Community Forum](https://developer.squareup.com/forums)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)

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
- [ ] Test authentication error handling
- [ ] Test expired session handling
- [ ] Verify Edge Function logs show detailed information

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

All sensitive payment data is handled exclusively by Square's secure infrastructure. API credentials are stored securely in Supabase Edge Function secrets and never exposed to the frontend.
