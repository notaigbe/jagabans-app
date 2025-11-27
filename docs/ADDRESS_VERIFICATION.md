
# Address Verification Guide

This guide explains how address verification works in the Jagabans LA app and how to configure it.

## Overview

The app uses Google's Address Validation API to verify delivery addresses in real-time during checkout. This ensures that customers enter valid, deliverable addresses, reducing failed deliveries and improving customer satisfaction.

## Features

### Real-time Validation
- Addresses are validated as users type (with 1-second debounce)
- Visual feedback shows validation status with color-coded indicators
- Validation happens automatically in the background

### Validation Confidence Levels

**High Confidence (Green)**
- Address is fully verified and deliverable
- All components are confirmed
- Safe to proceed with order

**Medium Confidence (Orange)**
- Address is partially verified
- Some components may be inferred
- User should review before proceeding

**Low Confidence (Red)**
- Address could not be verified
- User must correct the address
- Order cannot be placed until fixed

### Address Suggestions
- When a better formatted address is found, the app suggests it
- Users can accept the suggestion with one tap
- Formatted addresses follow postal standards

### Fallback Validation
- If Google API is unavailable or not configured, basic validation is used
- Basic validation checks for:
  - Minimum length (10 characters)
  - Presence of numbers (street address)
  - Multiple address components (street, city, etc.)
  - Common address patterns

## Setup

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Address Validation API**
4. Create an API key:
   - Go to "Credentials"
   - Click "Create Credentials" → "API Key"
   - Restrict the key to "Address Validation API" only
5. Copy your API key

### 2. Configure Supabase Environment Variable

Add your Google Maps API key to Supabase:

```bash
# Using Supabase CLI
supabase secrets set GOOGLE_MAPS_API_KEY=your_api_key_here

# Or via Supabase Dashboard
# 1. Go to Project Settings → Edge Functions
# 2. Add secret: GOOGLE_MAPS_API_KEY
# 3. Value: your_api_key_here
```

### 3. Test the Integration

1. Open the app and add items to cart
2. Go to checkout
3. Enter a test address:
   - Valid: "1600 Amphitheatre Parkway, Mountain View, CA 94043"
   - Invalid: "123 Fake Street"
4. Observe the validation feedback

## API Usage

### Edge Function: `verify-address`

**Endpoint:** `POST /functions/v1/verify-address`

**Request:**
```json
{
  "address": "1600 Amphitheatre Parkway, Mountain View, CA 94043"
}
```

**Response:**
```json
{
  "success": true,
  "isValid": true,
  "formattedAddress": "1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA",
  "addressComponents": {
    "streetNumber": "1600",
    "street": "Amphitheatre Parkway",
    "city": "Mountain View",
    "state": "California",
    "postalCode": "94043",
    "country": "United States"
  },
  "confidence": "high"
}
```

### Frontend Integration

The checkout screen automatically validates addresses:

```typescript
// Address validation is triggered automatically
// when user types in the address field

// Manual validation can be triggered:
const validateAddress = async (address: string) => {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/verify-address`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ address }),
    }
  );
  
  const result = await response.json();
  return result;
};
```

## User Experience

### Visual Indicators

**Validating**
- Hourglass icon
- Gray color
- "Validating address..." message

**Valid (High Confidence)**
- Green checkmark icon
- Green color
- "Address verified ✓" message

**Valid (Medium Confidence)**
- Orange warning icon
- Orange color
- "Address partially verified. Please review." message

**Invalid**
- Red X icon
- Red color
- "Address could not be verified. Please check for errors." message

### Order Placement Flow

1. User enters address
2. Address is validated automatically
3. If invalid:
   - User sees error message
   - Cannot place order until fixed
4. If low confidence:
   - User sees warning
   - Must confirm to continue
5. If valid:
   - Order proceeds normally
   - Validated address is used

## Cost Considerations

### Google Address Validation API Pricing

- **Free tier:** 100 requests per month
- **Paid tier:** $0.005 per request (after free tier)
- **Estimated cost:** For 1,000 orders/month = ~$4.50/month

### Optimization Tips

1. **Debouncing:** Already implemented (1-second delay)
2. **Caching:** Consider caching validated addresses
3. **Batch validation:** Validate only on checkout, not on every keystroke
4. **Fallback:** Basic validation works without API costs

## Troubleshooting

### Address Validation Not Working

**Check API Key:**
```bash
# Verify secret is set
supabase secrets list
```

**Check Edge Function Logs:**
```bash
# View logs
supabase functions logs verify-address
```

**Common Issues:**

1. **"Google Maps API key not configured"**
   - Solution: Set `GOOGLE_MAPS_API_KEY` environment variable

2. **"Address Validation API has not been used"**
   - Solution: Enable the API in Google Cloud Console

3. **"API key not valid"**
   - Solution: Check API key restrictions and permissions

4. **Validation always returns low confidence**
   - Solution: Check if API is enabled and key is correct
   - Fallback validation is being used

### Testing Without API Key

The app will work without a Google API key by using basic validation:

- Checks address format
- Validates minimum requirements
- Lower accuracy but no API costs
- Good for development/testing

## Security

### API Key Protection

- API key is stored in Supabase environment variables
- Never exposed to client-side code
- All validation happens server-side
- Edge Function verifies user authentication

### Best Practices

1. **Restrict API Key:**
   - Limit to Address Validation API only
   - Set HTTP referrer restrictions
   - Monitor usage in Google Cloud Console

2. **Rate Limiting:**
   - Consider implementing rate limits
   - Prevent abuse of validation endpoint

3. **User Authentication:**
   - Only authenticated users can validate addresses
   - JWT verification in Edge Function

## Future Enhancements

### Potential Improvements

1. **Address Autocomplete:**
   - Use Google Places Autocomplete
   - Suggest addresses as user types

2. **Geocoding:**
   - Store latitude/longitude
   - Enable delivery radius checks
   - Calculate delivery fees by distance

3. **Address Book:**
   - Save validated addresses
   - Quick selection for repeat orders

4. **International Support:**
   - Support addresses in multiple countries
   - Localized validation rules

5. **Delivery Zones:**
   - Check if address is in delivery area
   - Show estimated delivery time

## Support

For issues or questions:
- Check Supabase Edge Function logs
- Review Google Cloud Console for API errors
- Test with known valid addresses
- Verify environment variables are set correctly

## References

- [Google Address Validation API Documentation](https://developers.google.com/maps/documentation/address-validation)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Address Validation Best Practices](https://developers.google.com/maps/documentation/address-validation/best-practices)
