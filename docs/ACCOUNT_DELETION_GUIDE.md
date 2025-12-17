
# Account Deletion Guide

## Overview

The Jagabans LA app implements a secure, GDPR-compliant self-service account deletion feature that allows users to permanently delete their accounts while preserving anonymized business records for legal and audit purposes.

## User Flow

### 1. Accessing Account Deletion
- Navigate to **Profile** → **Delete Account**
- Only available to authenticated users

### 2. Three-Step Deletion Process

#### Step 1: Warning & Information
Users are presented with clear information about:
- **What will be deleted:**
  - Name, email, and phone number
  - Saved addresses and preferences
  - Authentication credentials
  - Active sessions and tokens
  - Points balance and rewards

- **What will be retained (anonymized):**
  - Order history (for business records)
  - Payment transaction records
  - Order totals and timestamps

#### Step 2: Confirmation
- Users must type "DELETE MY ACCOUNT" to confirm
- Prevents accidental deletions
- Clear, explicit consent

#### Step 3: Re-authentication
- Users must enter their password
- Verifies identity before deletion
- Prevents unauthorized account deletion

### 3. Deletion Execution
Once confirmed and authenticated:
1. User data is anonymized in all relevant tables
2. Personal information is permanently deleted
3. User is signed out automatically
4. Account cannot be recovered

## Technical Implementation

### Database Changes

#### Anonymization Strategy
The following tables have user data anonymized (not deleted):

**Orders Table:**
- `user_id` → `NULL`
- `delivery_address` → `NULL`
- `pickup_notes` → `NULL`
- Retained: `total`, `items`, `timestamps`, `status`

**Gift Cards Table:**
- `sender_id` → `NULL` (for sent cards)
- `recipient_id` → `NULL` (for received cards)
- `recipient_email` → `NULL`
- `recipient_name` → `"Deleted User"`

**Merch Redemptions Table:**
- `user_id` → `NULL`
- `delivery_address` → `NULL`
- `pickup_notes` → `NULL`

**Payment Records:**
- `user_id` → `NULL` in `stripe_payments` and `square_payments`
- Transaction details retained for financial compliance

#### Permanent Deletion
The following data is permanently deleted:

- User profile (`user_profiles` table)
- Payment methods (`stripe_payment_methods`, `square_cards`)
- Event RSVPs (`event_rsvps`)
- Event bans (`event_bans`)
- Notifications (`notifications`)
- Theme settings (`theme_settings`)
- Authentication data (via Supabase Auth)

#### Audit Trail
A new `account_deletion_audit` table logs:
- `user_id` (UUID only, cannot be linked back)
- `deleted_at` (timestamp)
- `reason` (e.g., "user_requested")

**RLS Policies:**
- Only admins can view audit logs
- System can insert audit logs

### Edge Function

**Location:** `supabase/functions/delete-account/index.ts`

**Process:**
1. Verify user authentication
2. Anonymize data in all relevant tables
3. Log deletion event to audit table
4. Delete user profile
5. Delete authentication data
6. Return success response

**Security:**
- Requires valid JWT token
- Uses service role key for admin operations
- Validates user identity before deletion

### Frontend Components

**Delete Account Screen:** `app/delete-account.tsx`
- Three-step wizard interface
- Clear information display
- Password re-authentication
- Haptic feedback on mobile
- Loading states and error handling

**Profile Screen Update:** `app/(tabs)/profile.tsx`
- Added "Delete Account" menu option
- Red warning color to indicate destructive action
- Icon: `person.crop.circle.badge.xmark`

## Compliance

### GDPR Compliance
✅ Right to erasure (Article 17)
✅ Data minimization (Article 5)
✅ Transparent processing (Article 12)
✅ Audit trail for accountability (Article 5)

### Google Play Requirements
✅ In-app account deletion option
✅ Clear information about data retention
✅ Irreversible deletion process
✅ No data re-association possible

### Business Continuity
✅ Financial records retained (anonymized)
✅ Order history preserved for analytics
✅ Transaction references maintained
✅ Audit trail for compliance

## Privacy Policy Updates

The privacy policy should be updated to include:

1. **Account Deletion Section:**
   - How to delete account
   - What data is deleted vs. retained
   - Anonymization process
   - Irreversibility of deletion

2. **Data Retention Section:**
   - Legal basis for retaining anonymized data
   - How long data is retained
   - Purpose of retention (financial, legal, audit)

3. **User Rights Section:**
   - Right to delete account
   - Right to data portability (before deletion)
   - Contact information for data requests

## Testing Checklist

### Functional Testing
- [ ] User can access delete account screen
- [ ] Warning step displays correct information
- [ ] Confirmation requires exact text match
- [ ] Re-authentication validates password
- [ ] Invalid password shows error
- [ ] Successful deletion signs out user
- [ ] Deleted user cannot log back in

### Data Verification
- [ ] User profile is deleted
- [ ] Orders are anonymized (user_id = NULL)
- [ ] Payment methods are deleted
- [ ] Event RSVPs are deleted
- [ ] Notifications are deleted
- [ ] Auth user is deleted
- [ ] Audit log entry is created

### Security Testing
- [ ] Requires authentication
- [ ] Requires password re-entry
- [ ] Cannot delete other users' accounts
- [ ] Edge function validates JWT token
- [ ] Service role key is not exposed

### UX Testing
- [ ] Clear warning messages
- [ ] Confirmation text is case-insensitive
- [ ] Loading states are shown
- [ ] Error messages are helpful
- [ ] Success dialog is displayed
- [ ] Haptic feedback works on mobile

## Admin Tools

Admins can view deletion audit logs through the database:

```sql
SELECT 
  user_id,
  deleted_at,
  reason,
  created_at
FROM account_deletion_audit
ORDER BY deleted_at DESC;
```

**Note:** The `user_id` in the audit log is just a UUID and cannot be linked back to any user data after deletion.

## Troubleshooting

### Common Issues

**Issue:** "Failed to delete account"
- **Cause:** Database error during anonymization
- **Solution:** Check edge function logs, verify database permissions

**Issue:** "Invalid password"
- **Cause:** User entered wrong password
- **Solution:** User should try again with correct password

**Issue:** "Session expired"
- **Cause:** User's session timed out
- **Solution:** User should sign in again and retry

### Edge Function Logs

View logs in Supabase Dashboard:
1. Go to Edge Functions
2. Select `delete-account`
3. View logs for errors

## Future Enhancements

Potential improvements:
- [ ] Email confirmation before deletion
- [ ] Grace period (e.g., 30 days) before permanent deletion
- [ ] Data export option before deletion
- [ ] Admin dashboard for viewing deletion requests
- [ ] Automated deletion reminders for inactive accounts

## Support

For issues or questions:
- Technical: Check edge function logs
- Legal: Consult with legal team
- User Support: Refer to privacy policy

---

**Last Updated:** 2024
**Version:** 1.0
