
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

console.log('Cancel RSVP function started');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { eventId } = await req.json();
    if (!eventId) throw new Error('Event ID is required');

    console.log('Processing RSVP cancellation for event:', eventId, 'user:', user.id);

    // Check if RSVP exists
    const { data: existingRsvp, error: checkError } = await supabaseClient
      .from('event_rsvps')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .maybeSingle();

    console.log('Existing RSVP check:', { existingRsvp, checkError });

    if (checkError) throw new Error('Failed to check existing RSVP');
    if (!existingRsvp) {
      return new Response(
        JSON.stringify({ error: 'No RSVP found for this event' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get current event state
    const { data: eventBefore, error: eventBeforeError } = await supabaseClient
      .from('events')
      .select('id, available_spots, capacity')
      .eq('id', eventId)
      .single();

    console.log('Event before cancellation:', { eventBefore, eventBeforeError });

    if (eventBeforeError || !eventBefore) {
      throw new Error('Event not found');
    }

    // Delete the RSVP first
    console.log('Deleting RSVP...');
    const { error: deleteError } = await supabaseClient
      .from('event_rsvps')
      .delete()
      .eq('id', existingRsvp.id);

    console.log('RSVP delete result:', { deleteError });

    if (deleteError) {
      throw new Error('Failed to cancel RSVP');
    }

    // Try the RPC function first to increment spots
    console.log('Attempting RPC increment...');
    const { data: rpcResult, error: rpcError } = await supabaseClient.rpc(
      'increment_available_spots',
      { event_id: eventId }
    );

    console.log('RPC result:', { rpcResult, rpcError });

    let updatedEvent;
    let availableSpots;

    if (rpcError) {
      // RPC function doesn't exist, fall back to manual update
      console.log('RPC failed, using manual update method');
      
      const newSpots = Math.min(eventBefore.available_spots + 1, eventBefore.capacity);
      const { data: manualUpdate, error: manualError } = await supabaseClient
        .from('events')
        .update({ available_spots: newSpots })
        .eq('id', eventId)
        .select('available_spots')
        .single();

      console.log('Manual update result:', { manualUpdate, manualError });

      if (manualError || !manualUpdate) {
        // Rollback: re-insert the RSVP
        await supabaseClient
          .from('event_rsvps')
          .insert({
            event_id: eventId,
            user_id: user.id,
          });
        
        return new Response(
          JSON.stringify({ error: 'Failed to update available spots. Please try again.' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      updatedEvent = manualUpdate;
      availableSpots = manualUpdate.available_spots;
    } else {
      // RPC succeeded
      updatedEvent = rpcResult && rpcResult.length > 0 ? rpcResult[0] : rpcResult;
      availableSpots = updatedEvent?.available_spots;
    }

    console.log('Spots incremented successfully. New available spots:', availableSpots);

    // Verify the update actually happened
    const { data: eventAfter } = await supabaseClient
      .from('events')
      .select('available_spots')
      .eq('id', eventId)
      .single();

    console.log('Event after cancellation:', eventAfter);

    return new Response(
      JSON.stringify({
        success: true,
        availableSpots: availableSpots ?? eventAfter?.available_spots,
        debug: {
          before: eventBefore.available_spots,
          after: eventAfter?.available_spots,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
