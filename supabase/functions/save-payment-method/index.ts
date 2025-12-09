
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { paymentMethodId, setAsDefault } = await req.json();

    if (!paymentMethodId) {
      throw new Error('Payment method ID is required');
    }

    // Get user profile with Stripe customer ID
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!profile || !profile.stripe_customer_id) {
      throw new Error('Stripe customer not found');
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: profile.stripe_customer_id,
    });

    console.log('Payment method attached:', paymentMethodId);

    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // If setAsDefault, update customer's default payment method
    if (setAsDefault) {
      await stripe.customers.update(profile.stripe_customer_id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Set all existing payment methods to non-default
      await supabase
        .from('stripe_payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    // Save payment method to database
    const { error: insertError } = await supabase
      .from('stripe_payment_methods')
      .insert({
        user_id: user.id,
        stripe_customer_id: profile.stripe_customer_id,
        stripe_payment_method_id: paymentMethodId,
        type: paymentMethod.type,
        card_brand: paymentMethod.card?.brand || '',
        card_last4: paymentMethod.card?.last4 || '',
        card_exp_month: paymentMethod.card?.exp_month || 0,
        card_exp_year: paymentMethod.card?.exp_year || 0,
        is_default: setAsDefault || false,
      });

    if (insertError) {
      console.error('Error saving payment method:', insertError);
      throw new Error('Failed to save payment method');
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentMethodId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error saving payment method:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to save payment method',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
