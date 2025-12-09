
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

    const { paymentMethodId } = await req.json();

    if (!paymentMethodId) {
      throw new Error('Payment method ID is required');
    }

    // Verify payment method belongs to user
    const { data: paymentMethodRecord } = await supabase
      .from('stripe_payment_methods')
      .select('*')
      .eq('stripe_payment_method_id', paymentMethodId)
      .eq('user_id', user.id)
      .single();

    if (!paymentMethodRecord) {
      throw new Error('Payment method not found or unauthorized');
    }

    // Detach from Stripe
    await stripe.paymentMethods.detach(paymentMethodId);

    console.log('Payment method detached:', paymentMethodId);

    // Delete from database
    const { error: deleteError } = await supabase
      .from('stripe_payment_methods')
      .delete()
      .eq('stripe_payment_method_id', paymentMethodId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting payment method:', deleteError);
      throw new Error('Failed to delete payment method');
    }

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error detaching payment method:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to detach payment method',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
