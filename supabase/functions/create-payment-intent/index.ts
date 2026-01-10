
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

    console.log('Creating payment intent for user:', user.id);

    // Parse request body
    const { 
      orderId, 
      amount, 
      currency = 'usd', 
      customerId,
      setupFutureUsage,
      metadata = {} 
    } = await req.json();

    if (!orderId || !amount) {
      throw new Error('Missing required fields: orderId and amount');
    }

    // Validate amount (must be positive integer in cents)
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Invalid amount');
    }

    console.log('Creating PaymentIntent for order:', orderId, 'amount:', amount, 'customer:', customerId);

    // Get user profile for customer info
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('name, email')
      .eq('user_id', user.id)
      .single();

    console.log('User profile:', profile);

    // Create payment intent configuration
    const paymentIntentConfig: any = {
      amount: Math.round(amount), // Ensure it's an integer
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never', // Disable redirects for better UX
      },
      metadata: {
        orderId,
        userId: user.id,
        ...metadata,
      },
      description: `Order #${orderId}`,
      receipt_email: profile?.email || undefined,
    };

    // Add customer if provided
    if (customerId) {
      console.log('Adding customer to payment intent:', customerId);
      paymentIntentConfig.customer = customerId;
    }

    // Add setup future usage if requested (for saving payment methods)
    if (setupFutureUsage) {
      console.log('Setting up future usage:', setupFutureUsage);
      paymentIntentConfig.setup_future_usage = setupFutureUsage;
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentConfig);

    console.log('✓ PaymentIntent created:', paymentIntent.id);

    // Create ephemeral key for customer (needed for Payment Sheet to show saved cards)
    let ephemeralKeySecret = null;
    if (customerId) {
      try {
        console.log('Creating ephemeral key for customer:', customerId);
        const ephemeralKey = await stripe.ephemeralKeys.create(
          { customer: customerId },
          { apiVersion: '2023-10-16' }
        );
        ephemeralKeySecret = ephemeralKey.secret;
        console.log('✓ Ephemeral key created successfully');
      } catch (ephemeralError) {
        console.error('Error creating ephemeral key:', ephemeralError);
        // Don't throw - payment intent was created successfully
        // But log the error so we know saved cards won't work
      }
    } else {
      console.warn('⚠️ No customer ID provided - saved cards will not be available');
    }

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

    // Return client secret and ephemeral key
    const response = {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerId: customerId,
      ephemeralKey: ephemeralKeySecret, // This is the key for showing saved cards
    };

    console.log('✓ Returning response with ephemeral key:', ephemeralKeySecret ? 'present' : 'missing');

    return new Response(
      JSON.stringify(response),
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
