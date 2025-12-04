
# Square Payments Implementation Guide

This document describes the Square Payments integration in the Jagabans LA food ordering app.

## Overview

The app uses Square's Payments API to process credit card payments securely. All payment processing happens on the backend via Supabase Edge Functions to keep sensitive data secure.

## Architecture

### Frontend (React Native)
- **Checkout Screen** (`app/checkout.tsx`): Handles the checkout UI and initiates payment requests
- **Payment Methods**: Supports both saved cards and web checkout
- **Address Validation**: Validates delivery addresses before payment

### Backend (Supabase Edge Functions)
- **process-square-payment**: Processes payments using Square's Payments API
- **create-square-checkout**: Creates Square web checkout sessions (for web-based payments)

### Database Tables
- **square_payments**: Stores payment records from Square
- **orders**: Stores order information linked to payments
- **order_items**: Stores individual items in each order
- **user_profiles**: Updated with earned points after successful orders

## Payment Flow

### 1. User Initiates Checkout
```typescript
// User fills in delivery address and selects payment method
// Address is validated using Google's Address Validation API
```

### 2. Payment Processing (Saved Card)
```typescript
// Frontend calls process-square-payment edge function
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/process-square-payment`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      sourceId: 'cnon:card-nonce-ok', // Square test nonce (sandbox)
      amount: amountInCents,
      currency: 'USD',
      customer: {
        name: userProfile.name,
        email: userProfile.email,
        phone: userProfile.phone,
        address: addressParts.address,
        city: addressParts.city,
        state: addressParts.state,
        zip: addressParts.zip,
      },
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    }),
  }
);
```

### 3. Backend Processing
The `process-square-payment` edge function:

1. **Authenticates the user** using the JWT token
2. **Validates request data** (sourceId, amount, customer, items)
3. **Calls Square Payments API** to process the payment
4. **Creates database records**:
   - `square_payments` record with payment details
   - `orders` record with order information
   - `order_items` records for each item
5. **Updates user points** using the `increment_user_points` function
6. **Creates notification** for the user
7. **Returns success response** with order and payment details

### 4. Success Handling
```typescript
// Clear cart
clearCart();

// Reload user profile to get updated points and orders
await loadUserProfile();

// Show success message
Alert.alert(
  'Order Placed!',
  `Your order has been placed successfully!
  
Order #${orderNumber}
Payment ID: ${paymentId}

You earned ${pointsEarned} points!`
);
```

## Square API Configuration

### Environment Variables (Supabase)
Set these in your Supabase project settings:

```bash
SQUARE_ACCESS_TOKEN=<your-square-access-token>
SQUARE_ENVIRONMENT=sandbox  # or "production"
```

### Square Sandbox vs Production

**Sandbox (Testing)**:
- Base URL: `https://connect.squareupsandbox.com`
- Test card nonce: `cnon:card-nonce-ok`
- No real money is charged

**Production**:
- Base URL: `https://connect.squareup.com`
- Real card tokenization required
- Real money is charged

## Database Schema

### square_payments Table
```sql
CREATE TABLE square_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id),
  order_id uuid REFERENCES orders(id),
  square_payment_id text NOT NULL,
  square_order_id text,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  status text CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  payment_method text,
  receipt_url text,
  error_message text,
  metadata jsonb,
  created_at timestamptz DEFAULT timezone('utc', now()),
  updated_at timestamptz DEFAULT timezone('utc', now())
);
```

### Helper Functions
```sql
-- Increment user points
CREATE OR REPLACE FUNCTION increment_user_points(user_id_param uuid, points_to_add integer)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET points = points + points_to_add
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Testing

### Test Card Nonces (Sandbox)
Square provides test nonces for different scenarios:

- **Success**: `cnon:card-nonce-ok`
- **Declined**: `cnon:card-nonce-declined`
- **CVV Failure**: `cnon:card-nonce-rejected-cvv`
- **Postal Code Failure**: `cnon:card-nonce-rejected-postalcode`

### Testing Flow
1. Add items to cart
2. Go to checkout
3. Enter delivery address
4. Select "Saved Card" payment method
5. Click "Pay $X.XX"
6. Payment is processed with test nonce
7. Order is created and points are awarded

## Production Considerations

### Card Tokenization
In production, you need to:

1. **Integrate Square Web Payments SDK** in your frontend
2. **Tokenize card details** before sending to backend
3. **Use real card tokens** instead of test nonces

Example:
```typescript
// Initialize Square Web Payments SDK
const payments = Square.payments(applicationId, locationId);
const card = await payments.card();
await card.attach('#card-container');

// Tokenize card
const tokenResult = await card.tokenize();
if (tokenResult.status === 'OK') {
  const sourceId = tokenResult.token;
  // Send sourceId to backend
}
```

### Security Best Practices
- ✅ Never store raw card numbers
- ✅ Always use HTTPS
- ✅ Validate all inputs on backend
- ✅ Use Square's tokenization
- ✅ Implement idempotency keys
- ✅ Log all payment attempts
- ✅ Handle errors gracefully

### Error Handling
The edge function handles various error scenarios:

- **Authentication errors**: Returns 401
- **Validation errors**: Returns 400
- **Square API errors**: Returns 400 with Square error details
- **Database errors**: Returns 500 with warning to contact support
- **Server errors**: Returns 500 with error message

## Points System

### Points Calculation
```typescript
const pointsEarned = Math.floor(totalAmount);
// $1.00 = 1 point
// $15.50 = 15 points
```

### Points Redemption
Users can use points for discounts:
```typescript
const pointsDiscount = usePoints 
  ? Math.min(availablePoints * 0.01, subtotal * 0.2) 
  : 0;
// 1 point = $0.01
// Maximum 20% discount
```

## Monitoring & Debugging

### Logs
Check Supabase Edge Function logs:
```bash
supabase functions logs process-square-payment
```

### Common Issues

**Issue**: "Payment service not configured"
- **Solution**: Set `SQUARE_ACCESS_TOKEN` environment variable

**Issue**: "Unauthorized"
- **Solution**: Ensure user is logged in and JWT is valid

**Issue**: "Payment processed but order save failed"
- **Solution**: Check database permissions and RLS policies

**Issue**: "Address could not be verified"
- **Solution**: Ensure Google Maps API key is configured for address validation

## Future Enhancements

- [ ] Support for Apple Pay / Google Pay
- [ ] Saved card management (add/remove cards)
- [ ] Refund processing
- [ ] Subscription payments
- [ ] Gift card payments
- [ ] Split payments
- [ ] Tip functionality
- [ ] Receipt email generation

## Support

For Square API documentation:
- [Square Payments API](https://developer.squareup.com/docs/payments-api/overview)
- [Square Web Payments SDK](https://developer.squareup.com/docs/web-payments/overview)
- [Square Testing](https://developer.squareup.com/docs/testing/test-values)

For Supabase Edge Functions:
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
