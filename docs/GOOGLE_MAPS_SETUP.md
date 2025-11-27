
# Google Maps API Setup Guide

Quick guide to set up Google Maps API for address verification in the Jagabans LA app.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "Jagabans LA"
4. Click "Create"

## Step 2: Enable Address Validation API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Address Validation API"
3. Click on "Address Validation API"
4. Click "Enable"

## Step 3: Create API Key

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the API key (you'll need this later)
4. Click "Restrict Key" (recommended)

## Step 4: Restrict API Key (Recommended)

### API Restrictions
1. Select "Restrict key"
2. Choose "Address Validation API" from the dropdown
3. Click "Save"

### Application Restrictions (Optional)
For production, consider adding:
- HTTP referrer restrictions
- IP address restrictions

## Step 5: Add API Key to Supabase

### Option A: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref vpunvfkmlmqbfiggqrkn

# Set the secret
supabase secrets set GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Option B: Using Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: "Jagabans LA"
3. Go to "Project Settings" → "Edge Functions"
4. Scroll to "Secrets"
5. Click "Add new secret"
6. Name: `GOOGLE_MAPS_API_KEY`
7. Value: Paste your API key
8. Click "Save"

## Step 6: Verify Setup

### Test the Edge Function

```bash
# Using curl
curl -X POST https://vpunvfkmlmqbfiggqrkn.supabase.co/functions/v1/verify-address \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"address": "1600 Amphitheatre Parkway, Mountain View, CA 94043"}'
```

### Test in the App

1. Open the app
2. Add items to cart
3. Go to checkout
4. Enter a test address:
   - **Valid**: "1600 Amphitheatre Parkway, Mountain View, CA 94043"
   - **Invalid**: "123 Fake Street"
5. Check for validation feedback

## Troubleshooting

### "API key not valid"
- Check that you copied the entire API key
- Verify the key is not restricted to wrong APIs
- Make sure Address Validation API is enabled

### "Address Validation API has not been used"
- Wait a few minutes after enabling the API
- Try again after 5-10 minutes
- Check billing is enabled (required after free tier)

### "GOOGLE_MAPS_API_KEY not found"
- Verify the secret name is exactly: `GOOGLE_MAPS_API_KEY`
- Check you're setting it for the correct project
- Redeploy the Edge Function after setting the secret

### Validation always returns "low confidence"
- This means the fallback validation is being used
- Check Edge Function logs: `supabase functions logs verify-address`
- Verify API key is set correctly

## Cost Management

### Monitor Usage

1. Go to Google Cloud Console
2. Navigate to "APIs & Services" → "Dashboard"
3. Click on "Address Validation API"
4. View usage metrics

### Set Budget Alerts

1. Go to "Billing" → "Budgets & alerts"
2. Click "Create Budget"
3. Set monthly budget (e.g., $10)
4. Configure alert thresholds (50%, 90%, 100%)
5. Add email notifications

### Optimize Costs

- **Debouncing**: Already implemented (1-second delay)
- **Caching**: Cache validated addresses in database
- **Batch validation**: Only validate on checkout
- **Fallback**: Use basic validation for development

## Security Best Practices

### 1. Restrict API Key
✅ Limit to Address Validation API only
✅ Set application restrictions
✅ Rotate keys periodically

### 2. Monitor Usage
✅ Set up billing alerts
✅ Review usage regularly
✅ Watch for unusual spikes

### 3. Protect Secrets
✅ Never commit API keys to git
✅ Use environment variables
✅ Limit access to Supabase project

### 4. Rate Limiting
Consider implementing:
- Per-user rate limits
- IP-based throttling
- Abuse detection

## Production Checklist

Before going live:

- [ ] API key is restricted to Address Validation API
- [ ] Billing is enabled in Google Cloud
- [ ] Budget alerts are configured
- [ ] API key is stored in Supabase secrets
- [ ] Edge Function is deployed
- [ ] Address validation is tested
- [ ] Fallback validation works
- [ ] Error handling is in place
- [ ] Monitoring is set up

## Support Resources

- [Google Address Validation API Docs](https://developers.google.com/maps/documentation/address-validation)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Supabase Dashboard](https://supabase.com/dashboard)

## Quick Commands Reference

```bash
# Check if secret is set
supabase secrets list

# Update secret
supabase secrets set GOOGLE_MAPS_API_KEY=new_key_here

# View Edge Function logs
supabase functions logs verify-address

# Deploy Edge Function
supabase functions deploy verify-address

# Test locally
supabase functions serve verify-address
```

## Need Help?

If you encounter issues:
1. Check Edge Function logs
2. Verify API key in Google Cloud Console
3. Test with known valid addresses
4. Review Supabase secrets configuration
5. Check Google Cloud billing status

For additional support, refer to the main documentation in `docs/ADDRESS_VERIFICATION.md`.
