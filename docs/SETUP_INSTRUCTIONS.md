
# Setup Instructions for Square Payments Integration

## Critical Issues Fixed

The following errors have been resolved:

1. ✅ **Square SDK Initialization Failure** - Added platform checks and graceful fallbacks
2. ✅ **Missing square_cards Table** - Migration SQL provided below
3. ✅ **Card Entry Flow Failure** - Added proper error handling and platform detection

## Step 1: Create the square_cards Database Table

You need to manually run this SQL migration in your Supabase SQL Editor:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/vpunvfkmlmqbfiggqrkn
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the following SQL:

```sql
-- Migration: Create square_cards table for storing tokenized card information
-- This table stores card metadata from Square for saved payment methods

-- Create square_cards table to store tokenized card information from Square
CREATE TABLE IF NOT EXISTS square_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  square_customer_id text NOT NULL,
  square_card_id text NOT NULL,
  card_brand text NOT NULL,
  last_4 text NOT NULL,
  exp_month integer NOT NULL,
  exp_year integer NOT NULL,
  cardholder_name text,
  billing_address jsonb,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

-- Enable RLS
ALTER TABLE square_cards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own cards"
  ON square_cards
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own cards"
  ON square_cards
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own cards"
  ON square_cards
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own cards"
  ON square_cards
  FOR DELETE
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_square_cards_user_id ON square_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_square_cards_square_customer_id ON square_cards(square_customer_id);
CREATE INDEX IF NOT EXISTS idx_square_cards_is_default ON square_cards(user_id, is_default);

-- Create function to ensure only one default card per user
CREATE OR REPLACE FUNCTION ensure_single_default_card()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE square_cards
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single default card
DROP TRIGGER IF EXISTS trigger_ensure_single_default_card ON square_cards;
CREATE TRIGGER trigger_ensure_single_default_card
  BEFORE INSERT OR UPDATE ON square_cards
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_card();

-- Add comment to table
COMMENT ON TABLE square_cards IS 'Stores tokenized card information from Square for saved payment methods';
```

5. Click "Run" to execute the migration
6. Verify the table was created by checking the "Table Editor" in Supabase

## Step 2: Configure Square Application ID

The Square In-App Payments SDK requires an Application ID to function. Follow these steps:

### Get Your Square Application ID

1. Go to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Sign in with your Square account
3. Select your application (or create a new one)
4. Click on "Credentials" in the left sidebar
5. Copy your Application ID:
   - **For Testing**: Use the "Sandbox Application ID" (starts with `sandbox-sq0idb-`)
   - **For Production**: Use the "Production Application ID" (starts with `sq0idp-`)

### Update the Code

Open `app/checkout.tsx` and find this line (around line 143):

```typescript
const applicationId = 'sandbox-sq0idb-YOUR_APP_ID_HERE';
```

Replace `'sandbox-sq0idb-YOUR_APP_ID_HERE'` with your actual Square Application ID:

```typescript
// For sandbox testing:
const applicationId = 'sandbox-sq0idb-abc123xyz';

// For production:
const applicationId = 'sq0idp-abc123xyz';
```

## Step 3: Test the Integration

### On Mobile (iOS/Android)

1. Build and run the app on a physical device or emulator
2. Add items to cart
3. Go to checkout
4. You should see:
   - "New Card" option (if Square SDK is available)
   - Any saved cards (if you have them)
5. Try adding a new card using test card numbers:
   - Visa: `4111 1111 1111 1111`
   - Mastercard: `5105 1051 0510 5100`
   - Amex: `3782 822463 10005`

### On Web

The Square In-App Payments SDK is **not available on web**. Users will see:
- Saved cards only (if they have any)
- A message indicating card entry is not available
- Instructions to contact support

This is expected behavior. For web payments, you would need to implement the Square Web Payments SDK separately.

## Step 4: Verify Everything Works

### Check Database

1. After adding a card with "Save card" enabled
2. Go to Supabase Dashboard > Table Editor > square_cards
3. You should see a new row with:
   - user_id
   - square_customer_id
   - square_card_id
   - card_brand
   - last_4
   - exp_month
   - exp_year

### Check Payments

1. Complete a test order
2. Go to [Square Dashboard](https://squareup.com/dashboard)
3. Check "Payments" to see the transaction
4. Verify the amount matches

## Troubleshooting

### Error: "Square SDK not available"

**Cause**: Running on web or SDK not properly installed

**Solution**: 
- On web: This is expected. Use saved cards only.
- On mobile: Reinstall dependencies and rebuild:
  ```bash
  npm install
  # For iOS:
  cd ios && pod install && cd ..
  # Rebuild the app
  ```

### Error: "Could not find the table 'public.square_cards'"

**Cause**: Migration not applied

**Solution**: Run the SQL migration from Step 1 above

### Error: "Payment system not configured"

**Cause**: Square Application ID not set

**Solution**: Follow Step 2 to configure your Application ID

### Card Entry Not Working

**Checklist**:
- ✅ Running on iOS or Android (not web)
- ✅ Square Application ID is configured
- ✅ Application ID is correct (no typos)
- ✅ Using correct environment (sandbox vs production)
- ✅ App has been rebuilt after configuration

## Platform Support

| Platform | Card Entry | Saved Cards | Notes |
|----------|-----------|-------------|-------|
| iOS | ✅ Yes | ✅ Yes | Fully supported |
| Android | ✅ Yes | ✅ Yes | Fully supported |
| Web | ❌ No | ✅ Yes | Use saved cards only |

## Security Notes

- ✅ Application IDs are safe to expose in client code
- ✅ Card data never touches your servers
- ✅ Only tokenized references are stored
- ❌ Never expose Access Tokens in client code
- ❌ Never commit sensitive credentials to Git

## Next Steps

1. ✅ Run the database migration
2. ✅ Configure Square Application ID
3. ✅ Test on mobile devices
4. ✅ Verify payments in Square Dashboard
5. ✅ Test saved card functionality
6. 🔄 When ready for production:
   - Update to Production Application ID
   - Update backend to use Production Access Token
   - Test with real cards (small amounts)
   - Monitor for errors

## Support

If you continue to experience issues:

1. Check the console logs for detailed error messages
2. Verify all steps above have been completed
3. Review the Square Developer documentation
4. Contact Square Support if payment processing fails

## Additional Resources

- [Square Developer Dashboard](https://developer.squareup.com/apps)
- [Square In-App Payments SDK Docs](https://developer.squareup.com/docs/in-app-payments-sdk/overview)
- [Square API Reference](https://developer.squareup.com/reference/square)
- [Supabase Dashboard](https://supabase.com/dashboard/project/vpunvfkmlmqbfiggqrkn)
