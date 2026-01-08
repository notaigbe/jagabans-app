
# Order Email Notifications Setup Guide

## Overview

This feature sends email notifications to predefined admin recipients after an order has been successfully paid and placed. The email contains complete order details including customer information, items ordered, and payment summary.

## Implementation Details

### 1. Email Service Utility (`utils/emailService.ts`)

The email service provides a simple interface to send order confirmation emails:

```typescript
sendOrderConfirmationEmail(orderData: OrderEmailData): Promise<boolean>
```

This function is called after successful payment and triggers the backend Edge Function.

### 2. Supabase Edge Function (`supabase/functions/send-order-confirmation-email/index.ts`)

The Edge Function handles:
- Authentication verification
- Email content generation (HTML and plain text)
- Sending emails to admin recipients
- Audit trail logging

### 3. Stripe Webhook Integration (`supabase/functions/stripe-webhook/index.ts`)

The webhook automatically triggers email notifications when:
- Payment succeeds (`payment_intent.succeeded`)
- Order is created and confirmed
- User profile information is available

## Environment Variables Required

### Supabase Edge Function Secrets

Set these in your Supabase project dashboard under Settings > Edge Functions:

```bash
# Admin email recipients (comma-separated)
ADMIN_EMAIL_RECIPIENTS=admin@jagabansla.com,orders@jagabansla.com,manager@jagabansla.com

# Email service configuration (using Resend API - recommended)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# SMTP configuration (alternative to Resend)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=orders@jagabansla.com
```

### Setting Environment Variables

Using Supabase CLI:

```bash
# Set admin email recipients
supabase secrets set ADMIN_EMAIL_RECIPIENTS="admin@jagabansla.com,orders@jagabansla.com"

# Set Resend API key (recommended)
supabase secrets set RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxx"

# Or set SMTP credentials (alternative)
supabase secrets set SMTP_HOST="smtp.gmail.com"
supabase secrets set SMTP_PORT="587"
supabase secrets set SMTP_USER="your-email@gmail.com"
supabase secrets set SMTP_PASSWORD="your-app-password"
supabase secrets set SMTP_FROM="orders@jagabansla.com"
```

## Email Service Options

### Option 1: Resend API (Recommended)

Resend is a modern email API that's simple to use and reliable.

1. Sign up at https://resend.com
2. Get your API key from the dashboard
3. Set the `RESEND_API_KEY` environment variable
4. Verify your sending domain (optional but recommended for production)

**Pricing**: Free tier includes 100 emails/day, 3,000 emails/month

### Option 2: SMTP (Gmail, SendGrid, etc.)

Use traditional SMTP for sending emails.

**Gmail Setup**:
1. Enable 2-factor authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password as `SMTP_PASSWORD`

**SendGrid Setup**:
1. Sign up at https://sendgrid.com
2. Create an API key
3. Use SMTP settings:
   - Host: smtp.sendgrid.net
   - Port: 587
   - User: apikey
   - Password: Your SendGrid API key

## Database Migration

Create the `email_notifications` table for audit trail:

```sql
-- Create email_notifications table for audit trail
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  recipient_emails TEXT[] NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_notifications_order_id ON email_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_sent_at ON email_notifications(sent_at DESC);

-- Enable RLS
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can view email notifications"
  ON email_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Service role can insert email notifications"
  ON email_notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);
```

Run this migration in your Supabase SQL Editor or using the Supabase CLI:

```bash
supabase db push
```

## Deployment

### 1. Deploy the Edge Function

```bash
# Deploy the send-order-confirmation-email function
supabase functions deploy send-order-confirmation-email

# Verify deployment
supabase functions list
```

### 2. Update the Stripe Webhook

The Stripe webhook has been updated to automatically send emails after successful payment. Redeploy it:

```bash
supabase functions deploy stripe-webhook
```

### 3. Test the Integration

1. Place a test order through the app
2. Complete payment with Stripe test card: `4242 4242 4242 4242`
3. Check that:
   - Order status updates to "preparing"
   - Payment status is "succeeded"
   - Email is sent to admin recipients
   - Email notification is logged in `email_notifications` table

## Email Content

The email includes:

### Header
- Jagabans LA branding with gradient background
- "New Order Received" title

### Order Details Section
- Order ID
- Order Type (Delivery/Pickup)
- Date and time

### Customer Information Section
- Customer name
- Email address
- Phone number (if provided)
- Delivery address (for delivery orders)
- Pickup notes (for pickup orders)

### Order Items Table
- Item name
- Quantity
- Unit price
- Total price per item

### Payment Summary
- Subtotal
- Tax
- Total paid

### Action Required Notice
- Alert to prepare the order
- Link to admin dashboard

## Monitoring

### Check Email Logs

Query the `email_notifications` table to see sent emails:

```sql
SELECT 
  en.*,
  o.order_number,
  o.status,
  o.total
FROM email_notifications en
JOIN orders o ON o.id = en.order_id
ORDER BY en.sent_at DESC
LIMIT 50;
```

### Check for Failed Emails

```sql
SELECT *
FROM email_notifications
WHERE status = 'failed'
ORDER BY sent_at DESC;
```

### View Edge Function Logs

```bash
# View logs for send-order-confirmation-email function
supabase functions logs send-order-confirmation-email

# View logs for stripe-webhook function
supabase functions logs stripe-webhook
```

## Troubleshooting

### Emails Not Being Sent

1. **Check environment variables**:
   ```bash
   supabase secrets list
   ```

2. **Verify Edge Function deployment**:
   ```bash
   supabase functions list
   ```

3. **Check Edge Function logs**:
   ```bash
   supabase functions logs send-order-confirmation-email --tail
   ```

4. **Test the Edge Function directly**:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/send-order-confirmation-email \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "orderId": "test-order-id",
       "customerName": "Test Customer",
       "customerEmail": "test@example.com",
       "items": [{"name": "Test Item", "quantity": 1, "price": 10.00}],
       "subtotal": 10.00,
       "tax": 0.98,
       "total": 10.98,
       "orderType": "pickup",
       "timestamp": "2024-01-01T00:00:00Z"
     }'
   ```

### Email Delivery Issues

1. **Check spam folder**: Emails might be marked as spam
2. **Verify sender domain**: Set up SPF, DKIM, and DMARC records
3. **Use Resend**: More reliable than SMTP for transactional emails
4. **Check recipient email addresses**: Ensure they're valid

### Database Connection Timeout

If you see "Connection terminated due to connection timeout" when running migrations:

1. Run the migration directly in Supabase SQL Editor
2. Or use the Supabase CLI with retry:
   ```bash
   supabase db push --include-all
   ```

## Security Considerations

1. **Environment Variables**: Never commit API keys or passwords to version control
2. **RLS Policies**: Only admins can view email notification logs
3. **Service Role**: Edge Functions use service role to bypass RLS for inserting logs
4. **Email Content**: Sensitive customer data is only sent to verified admin recipients

## Future Enhancements

Potential improvements:

1. **Customer Confirmation Emails**: Send order confirmation to customers
2. **Order Status Updates**: Email admins when order status changes
3. **Email Templates**: Use a template engine for more flexible email designs
4. **Attachment Support**: Attach PDF receipts or invoices
5. **SMS Notifications**: Add SMS alerts for urgent orders
6. **Webhook Retry Logic**: Implement retry mechanism for failed email sends
7. **Email Analytics**: Track open rates and click-through rates

## Support

For issues or questions:
- Check Supabase Edge Function logs
- Review the `email_notifications` table for audit trail
- Contact Jagabans LA technical support
