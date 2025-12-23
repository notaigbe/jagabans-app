
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL = process.env.SUPABASE_URL || "https://vpunvfkmlmqbfiggqrkn.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwdW52ZmttbG1xYmZpZ2dxcmtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0OTI0MTEsImV4cCI6MjA3ODA2ODQxMX0.i7E7C7FTJH8wYCAyUlxDG347u-V93TqF7uqGO6y2rO0;";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase: SupabaseClient<Database> = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
