
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

    // Get payment method details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (!paymentMethod.customer) {
      throw new Error('Payment method must be attached to a customer');
    }

    const customerId = paymentMethod.customer as string;

    // If setAsDefault, update customer's default payment method
    if (setAsDefault) {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Set all existing payment methods to non-default
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    // Save payment method to database
    const { error: insertError } = await supabase
      .from('payment_methods')
      .insert({
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_payment_method_id: paymentMethodId,
        type: paymentMethod.type === 'card' ? 'credit' : 'debit',
        cardholder_name: paymentMethod.billing_details?.name || 'Card Holder',
        expiry_date: `${paymentMethod.card?.exp_month}/${paymentMethod.card?.exp_year}`,
        brand: paymentMethod.card?.brand || '',
        last4: paymentMethod.card?.last4 || '',
        exp_month: paymentMethod.card?.exp_month || 0,
        exp_year: paymentMethod.card?.exp_year || 0,
        is_default: setAsDefault || false,
      });

    if (insertError) {
      console.error('Error saving payment method:', insertError);
      throw new Error('Failed to save payment method');
    }

    console.log('Payment method saved successfully:', paymentMethodId);

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
