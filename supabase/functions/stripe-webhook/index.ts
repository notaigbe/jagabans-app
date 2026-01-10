
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('=== Stripe Webhook Request Received ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);

  try {
    // Get Stripe keys from environment
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    console.log('Stripe Secret Key exists:', !!stripeSecretKey);
    console.log('Stripe Webhook Secret exists:', !!stripeWebhookSecret);
    
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Stripe secret key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!stripeWebhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Stripe webhook secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get Supabase client with service role key (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the signature from headers
    const signature = req.headers.get('stripe-signature');
    console.log('Stripe signature exists:', !!signature);
    
    if (!signature) {
      console.error('No stripe-signature header found');
      return new Response(
        JSON.stringify({ error: 'No stripe signature found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get raw body
    const body = await req.text();
    console.log('Body length:', body.length);

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
      console.log('✓ Webhook signature verified successfully');
    } catch (err: any) {
      console.error('✗ Webhook signature verification failed:', err.message);
      console.error('Error details:', err);
      return new Response(
        JSON.stringify({ error: 'Webhook signature verification failed', details: err.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('=== Webhook Event Details ===');
    console.log('Event type:', event.type);
    console.log('Event ID:', event.id);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent succeeded:', paymentIntent.id);
        console.log('Metadata:', paymentIntent.metadata);

        const orderId = paymentIntent.metadata.orderId;
        const userId = paymentIntent.metadata.userId;

        if (!orderId || !userId) {
          console.error('Missing orderId or userId in metadata');
          console.error('Available metadata:', paymentIntent.metadata);
          break;
        }

        console.log('Processing payment success for order:', orderId, 'user:', userId);

        // Update stripe_payments table - use payment_id instead of stripe_payment_intent_id
        const { error: paymentUpdateError } = await supabase
          .from('stripe_payments')
          .update({
            status: 'succeeded',
            payment_method: paymentIntent.payment_method as string,
            updated_at: new Date().toISOString(),
          })
          .eq('payment_id', paymentIntent.id);

        if (paymentUpdateError) {
          console.error('Error updating stripe_payments:', paymentUpdateError);
        } else {
          console.log('✓ stripe_payments table updated');
        }

        // Get order details to check if it's a delivery order
        const { data: orderData, error: orderFetchError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              name,
              price,
              quantity
            )
          `)
          .eq('id', orderId)
          .single();

        if (orderFetchError) {
          console.error('Error fetching order:', orderFetchError);
        }

        // Get user profile for email
        const { data: userProfile, error: userFetchError } = await supabase
          .from('user_profiles')
          .select('name, email, phone')
          .eq('id', userId)
          .single();

        if (userFetchError) {
          console.error('Error fetching user profile:', userFetchError);
        }

        // CRITICAL FIX: Set cancellation_deadline to 5 minutes from NOW (when payment succeeds)
        // This ensures the 5-minute window starts when the order is confirmed, not when it was created
        const cancellationDeadline = new Date(Date.now() + 5 * 60 * 1000).toISOString();

        // Update orders table with payment success and cancellation deadline
        const { error: orderUpdateError } = await supabase
          .from('orders')
          .update({
            status: 'preparing',
            payment_status: 'succeeded',
            cancellation_deadline: cancellationDeadline,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        if (orderUpdateError) {
          console.error('Error updating order:', orderUpdateError);
        } else {
          console.log('✓ orders table updated with cancellation_deadline:', cancellationDeadline);
        }

        // Award points to user (points_earned is already calculated in checkout)
        if (orderData?.points_earned) {
          const { error: pointsError } = await supabase.rpc('increment_user_points', {
            user_id_param: userId,
            points_to_add: orderData.points_earned,
          });

          if (pointsError) {
            console.error('Error awarding points:', pointsError);
            // Try direct update as fallback
            const { data: userData } = await supabase
              .from('user_profiles')
              .select('points')
              .eq('id', userId)
              .single();

            if (userData) {
              await supabase
                .from('user_profiles')
                .update({ points: (userData.points || 0) + orderData.points_earned })
                .eq('id', userId);
              console.log('✓ Points awarded via direct update');
            }
          } else {
            console.log('✓ Points awarded to user');
          }
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
        } else {
          console.log('✓ Notification created');
        }

        // Send order confirmation email to admin recipients
        if (orderData && userProfile) {
          console.log('Sending order confirmation email to admins...');
          
          try {
            // Calculate subtotal (before discount and tax)
            const subtotal = orderData.order_items?.reduce((sum: number, item: any) => 
              sum + (item.price * item.quantity), 0) || 0;
            
            // Calculate tax from total (assuming 9.75% tax rate)
            const taxRate = 0.0975;
            const tax = orderData.total * (taxRate / (1 + taxRate));
            
            const emailData = {
              orderId: orderData.id,
              customerName: userProfile.name,
              customerEmail: userProfile.email,
              customerPhone: userProfile.phone,
              items: orderData.order_items?.map((item: any) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
              })) || [],
              subtotal: subtotal,
              tax: tax,
              total: orderData.total,
              deliveryAddress: orderData.delivery_address,
              pickupNotes: orderData.pickup_notes,
              orderType: orderData.delivery_address ? 'delivery' : 'pickup',
              timestamp: new Date().toISOString(),
            };

            // Call the send-order-confirmation-email Edge Function
            const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-order-confirmation-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify(emailData),
            });

            if (emailResponse.ok) {
              console.log('✓ Order confirmation email sent to admins');
            } else {
              const errorText = await emailResponse.text();
              console.error('Failed to send order confirmation email:', errorText);
            }
          } catch (emailError) {
            console.error('Error sending order confirmation email:', emailError);
          }
        }

        // Schedule Uber Direct delivery for 10 minutes later (only for delivery orders)
        if (orderData?.delivery_address) {
          console.log('Scheduling Uber Direct delivery for 10 minutes from now...');
          
          // Calculate delivery trigger time (10 minutes from now)
          const deliveryTriggerTime = new Date(Date.now() + 10 * 60 * 1000);
          
          // Store the scheduled delivery trigger time
          const { error: scheduleError } = await supabase
            .from('orders')
            .update({
              delivery_scheduled_at: deliveryTriggerTime.toISOString(),
            })
            .eq('id', orderId);

          if (scheduleError) {
            console.error('Error scheduling delivery:', scheduleError);
          } else {
            console.log('✓ Delivery scheduled for:', deliveryTriggerTime.toISOString());
            
            // Send notification about scheduled delivery
            await supabase
              .from('notifications')
              .insert({
                user_id: userId,
                title: 'Delivery Scheduled',
                message: 'A driver will be assigned to your order in approximately 10 minutes.',
                type: 'order',
                read: false,
              });
          }
        }

        console.log('✓ Payment succeeded and order updated successfully');
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

        console.log('Processing payment failure for order:', orderId);

        // Update stripe_payments table
        const { error: paymentUpdateError } = await supabase
          .from('stripe_payments')
          .update({
            status: 'failed',
            error_message: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('payment_id', paymentIntent.id);

        if (paymentUpdateError) {
          console.error('Error updating stripe_payments:', paymentUpdateError);
        } else {
          console.log('✓ stripe_payments table updated');
        }

        // Update orders table - mark as cancelled since payment failed
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
        } else {
          console.log('✓ orders table updated - order cancelled due to payment failure');
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
        } else {
          console.log('✓ Notification created');
        }

        console.log('✓ Payment failed and order cancelled');
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent canceled:', paymentIntent.id);

        const orderId = paymentIntent.metadata.orderId;
        const userId = paymentIntent.metadata.userId;

        if (!orderId) {
          console.error('Missing orderId in metadata');
          break;
        }

        console.log('Processing payment cancellation for order:', orderId);

        // Update stripe_payments table
        const { error: paymentUpdateError } = await supabase
          .from('stripe_payments')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('payment_id', paymentIntent.id);

        if (paymentUpdateError) {
          console.error('Error updating stripe_payments:', paymentUpdateError);
        } else {
          console.log('✓ stripe_payments table updated');
        }

        // Update orders table - mark as cancelled since payment was cancelled
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
        } else {
          console.log('✓ orders table updated - order cancelled due to payment cancellation');
        }

        // Send notification to user if userId is available
        if (userId) {
          await supabase
            .from('notifications')
            .insert({
              user_id: userId,
              title: 'Order Cancelled',
              message: 'Your payment was cancelled. No charges were made.',
              type: 'order',
              read: false,
            });
        }

        console.log('✓ Payment canceled and order cancelled');
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
          .eq('payment_id', paymentIntent.id);

        if (paymentUpdateError) {
          console.error('Error updating stripe_payments:', paymentUpdateError);
        } else {
          console.log('✓ stripe_payments table updated');
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
          } else {
            console.log('✓ orders table updated');
          }
        }

        console.log('✓ Payment processing status updated');
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success response
    console.log('=== Webhook processed successfully ===');
    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('=== Webhook error ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({
        error: error.message || 'Webhook processing failed',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
