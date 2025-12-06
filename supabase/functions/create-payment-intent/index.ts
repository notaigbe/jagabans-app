
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

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
    // Get Stripe secret key from environment
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { orderId, amount, currency = 'usd', metadata = {} } = await req.json();

    if (!orderId || !amount) {
      throw new Error('Missing required fields: orderId and amount');
    }

    // Validate amount (must be positive integer in cents)
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Invalid amount');
    }

    console.log('Creating PaymentIntent for order:', orderId, 'amount:', amount);

    // Get user profile for customer info
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('name, email')
      .eq('user_id', user.id)
      .single();

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Ensure it's an integer
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId,
        userId: user.id,
        ...metadata,
      },
      description: `Order #${orderId}`,
      receipt_email: profile?.email || undefined,
    });

    console.log('PaymentIntent created:', paymentIntent.id);

    // Store initial payment record in Supabase
    const { error: insertError } = await supabase
      .from('stripe_payments')
      .insert({
        user_id: user.id,
        order_id: orderId,
        stripe_payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'pending',
        metadata: metadata,
      });

    if (insertError) {
      console.error('Error inserting payment record:', insertError);
      // Don't throw - payment intent was created successfully
    }

    // Update order with payment intent ID
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({ 
        payment_id: paymentIntent.id,
        payment_status: 'pending'
      })
      .eq('id', orderId);

    if (orderUpdateError) {
      console.error('Error updating order:', orderUpdateError);
    }

    // Return client secret
    return new Response(
      JSON.stringify({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to create payment intent',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
