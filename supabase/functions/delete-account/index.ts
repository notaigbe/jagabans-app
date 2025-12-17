
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client with user's token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Deleting account for user:', user.id);

    // Create admin client for operations that require elevated permissions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Get user profile data before deletion (for audit log)
    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    // Step 2: Anonymize orders - replace user_id with null and update delivery_address
    const { error: ordersError } = await supabaseAdmin
      .from('orders')
      .update({
        user_id: null,
        delivery_address: null,
        pickup_notes: null,
      })
      .eq('user_id', user.id);

    if (ordersError) {
      console.error('Error anonymizing orders:', ordersError);
      throw new Error('Failed to anonymize orders');
    }

    // Step 3: Anonymize gift cards (sent)
    const { error: giftCardsSentError } = await supabaseAdmin
      .from('gift_cards')
      .update({
        sender_id: null,
      })
      .eq('sender_id', user.id);

    if (giftCardsSentError) {
      console.error('Error anonymizing sent gift cards:', giftCardsSentError);
    }

    // Step 4: Anonymize gift cards (received)
    const { error: giftCardsReceivedError } = await supabaseAdmin
      .from('gift_cards')
      .update({
        recipient_id: null,
        recipient_email: null,
        recipient_name: 'Deleted User',
      })
      .eq('recipient_id', user.id);

    if (giftCardsReceivedError) {
      console.error('Error anonymizing received gift cards:', giftCardsReceivedError);
    }

    // Step 5: Anonymize merch redemptions
    const { error: merchError } = await supabaseAdmin
      .from('merch_redemptions')
      .update({
        user_id: null,
        delivery_address: null,
        pickup_notes: null,
      })
      .eq('user_id', user.id);

    if (merchError) {
      console.error('Error anonymizing merch redemptions:', merchError);
    }

    // Step 6: Anonymize stripe payments
    const { error: stripePaymentsError } = await supabaseAdmin
      .from('stripe_payments')
      .update({
        user_id: null,
      })
      .eq('user_id', user.id);

    if (stripePaymentsError) {
      console.error('Error anonymizing stripe payments:', stripePaymentsError);
    }

    // Step 7: Delete payment methods
    const { error: paymentMethodsError } = await supabaseAdmin
      .from('stripe_payment_methods')
      .delete()
      .eq('user_id', user.id);

    if (paymentMethodsError) {
      console.error('Error deleting payment methods:', paymentMethodsError);
    }

    // Step 8: Delete event RSVPs
    const { error: rsvpsError } = await supabaseAdmin
      .from('event_rsvps')
      .delete()
      .eq('user_id', user.id);

    if (rsvpsError) {
      console.error('Error deleting event RSVPs:', rsvpsError);
    }

    // Step 9: Delete event bans
    const { error: bansError } = await supabaseAdmin
      .from('event_bans')
      .delete()
      .eq('user_id', user.id);

    if (bansError) {
      console.error('Error deleting event bans:', bansError);
    }

    // Step 10: Delete notifications
    const { error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', user.id);

    if (notificationsError) {
      console.error('Error deleting notifications:', notificationsError);
    }

    // Step 11: Delete theme settings
    const { error: themeError } = await supabaseAdmin
      .from('theme_settings')
      .delete()
      .eq('user_id', user.id);

    if (themeError) {
      console.error('Error deleting theme settings:', themeError);
    }

    // Step 12: Log the deletion event (without personal data)
    const { error: auditError } = await supabaseAdmin
      .from('account_deletion_audit')
      .insert({
        user_id: user.id,
        deleted_at: new Date().toISOString(),
        reason: 'user_requested',
      });

    if (auditError) {
      console.error('Error logging deletion audit:', auditError);
      // Don't throw error here, continue with deletion
    }

    // Step 13: Delete user profile
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', user.id);

    if (profileError) {
      console.error('Error deleting user profile:', profileError);
      throw new Error('Failed to delete user profile');
    }

    // Step 14: Delete user from auth (this will cascade delete related auth data)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id
    );

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      throw new Error('Failed to delete authentication data');
    }

    console.log('Account deletion completed for user:', user.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account deleted successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in delete-account function:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred while deleting account',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
