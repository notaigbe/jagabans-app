
-- Drop the old payment_methods table if it exists
DROP TABLE IF EXISTS public.payment_methods CASCADE;

-- Create the new payment_methods table with Stripe integration
CREATE TABLE public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  card_number text NULL,
  cardholder_name text NOT NULL,
  expiry_date text NOT NULL,
  is_default boolean NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  stripe_payment_method_id text NULL,
  stripe_customer_id text NULL,
  last4 text NULL,
  brand text NULL,
  exp_month integer NULL,
  exp_year integer NULL,
  CONSTRAINT payment_methods_pkey PRIMARY KEY (id),
  CONSTRAINT payment_methods_user_id_fkey FOREIGN KEY (user_id) REFERENCES user_profiles (id) ON DELETE CASCADE,
  CONSTRAINT payment_methods_type_check CHECK (type = ANY (ARRAY['credit'::text, 'debit'::text]))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS payment_methods_user_id_idx ON public.payment_methods USING btree (user_id);
CREATE INDEX IF NOT EXISTS payment_methods_is_default_idx ON public.payment_methods USING btree (is_default);
CREATE INDEX IF NOT EXISTS payment_methods_stripe_payment_method_id_idx ON public.payment_methods USING btree (stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS payment_methods_stripe_customer_id_idx ON public.payment_methods USING btree (stripe_customer_id);

-- Enable Row Level Security
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own payment methods" 
  ON public.payment_methods 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own payment methods" 
  ON public.payment_methods 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own payment methods" 
  ON public.payment_methods 
  FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own payment methods" 
  ON public.payment_methods 
  FOR DELETE 
  USING (user_id = auth.uid());

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_methods_updated_at_trigger
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_methods_updated_at();
