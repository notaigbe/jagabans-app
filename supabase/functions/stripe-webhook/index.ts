
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Stripe keys from environment
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeSecretKey || !stripeWebhookSecret) {
      throw new Error('Stripe keys not configured');
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

    // Get the signature from headers
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No stripe signature found');
    }

    // Get raw body
    const body = await req.text();

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: 'Webhook signature verification failed' }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('Webhook event received:', event.type);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent succeeded:', paymentIntent.id);

        const orderId = paymentIntent.metadata.orderId;
        const userId = paymentIntent.metadata.userId;

        if (!orderId || !userId) {
          console.error('Missing orderId or userId in metadata');
          break;
        }

        // Update stripe_payments table
        const { error: paymentUpdateError } = await supabase
          .from('stripe_payments')
          .update({
            status: 'succeeded',
            payment_method: paymentIntent.payment_method as string,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (paymentUpdateError) {
          console.error('Error updating stripe_payments:', paymentUpdateError);
        }

        // Update orders table
        const { error: orderUpdateError } = await supabase
          .from('orders')
          .update({
            status: 'preparing',
            payment_status: 'succeeded',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        if (orderUpdateError) {
          console.error('Error updating order:', orderUpdateError);
        }

        // Send notification to user
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            title: 'Payment Successful',
            message: 'Your payment has been processed successfully. Your order is being prepared!',
            type: 'order',
            read: false,
          });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        }

        console.log('Payment succeeded and order updated');
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent failed:', paymentIntent.id);

        const orderId = paymentIntent.metadata.orderId;
        const userId = paymentIntent.metadata.userId;
        const errorMessage = paymentIntent.last_payment_error?.message || 'Payment failed';

        if (!orderId || !userId) {
          console.error('Missing orderId or userId in metadata');
          break;
        }

        // Update stripe_payments table
        const { error: paymentUpdateError } = await supabase
          .from('stripe_payments')
          .update({
            status: 'failed',
            error_message: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (paymentUpdateError) {
          console.error('Error updating stripe_payments:', paymentUpdateError);
        }

        // Update orders table
        const { error: orderUpdateError } = await supabase
          .from('orders')
          .update({
            status: 'cancelled',
            payment_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        if (orderUpdateError) {
          console.error('Error updating order:', orderUpdateError);
        }

        // Send notification to user
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            title: 'Payment Failed',
            message: `Your payment could not be processed: ${errorMessage}. Please try again.`,
            type: 'order',
            read: false,
          });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        }

        console.log('Payment failed and order cancelled');
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent canceled:', paymentIntent.id);

        const orderId = paymentIntent.metadata.orderId;

        if (!orderId) {
          console.error('Missing orderId in metadata');
          break;
        }

        // Update stripe_payments table
        const { error: paymentUpdateError } = await supabase
          .from('stripe_payments')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (paymentUpdateError) {
          console.error('Error updating stripe_payments:', paymentUpdateError);
        }

        // Update orders table
        const { error: orderUpdateError } = await supabase
          .from('orders')
          .update({
            status: 'cancelled',
            payment_status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        if (orderUpdateError) {
          console.error('Error updating order:', orderUpdateError);
        }

        console.log('Payment canceled and order cancelled');
        break;
      }

      case 'payment_intent.processing': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent processing:', paymentIntent.id);

        // Update stripe_payments table
        const { error: paymentUpdateError } = await supabase
          .from('stripe_payments')
          .update({
            status: 'processing',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (paymentUpdateError) {
          console.error('Error updating stripe_payments:', paymentUpdateError);
        }

        // Update orders table
        const orderId = paymentIntent.metadata.orderId;
        if (orderId) {
          const { error: orderUpdateError } = await supabase
            .from('orders')
            .update({
              payment_status: 'processing',
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);

          if (orderUpdateError) {
            console.error('Error updating order:', orderUpdateError);
          }
        }

        console.log('Payment processing status updated');
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success response
    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Webhook processing failed',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
