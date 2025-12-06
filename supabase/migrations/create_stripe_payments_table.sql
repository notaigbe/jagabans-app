
-- Create stripe_payments table for Stripe payment processing
-- This table stores payment records for the mobile app (Stripe)
-- The square_payments table is kept for website payments (Square)

CREATE TABLE IF NOT EXISTS stripe_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled')),
  payment_method TEXT,
  receipt_url TEXT,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE stripe_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own stripe payments
CREATE POLICY "Users can view their own stripe payments"
  ON stripe_payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own stripe payments
CREATE POLICY "Users can insert their own stripe payments"
  ON stripe_payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all stripe payments
CREATE POLICY "Admins can view all stripe payments"
  ON stripe_payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role IN ('admin', 'super_admin')
    )
  );

-- Create indexes for faster lookups
CREATE INDEX idx_stripe_payments_user_id ON stripe_payments(user_id);
CREATE INDEX idx_stripe_payments_order_id ON stripe_payments(order_id);
CREATE INDEX idx_stripe_payments_stripe_payment_intent_id ON stripe_payments(stripe_payment_intent_id);
CREATE INDEX idx_stripe_payments_status ON stripe_payments(status);
CREATE INDEX idx_stripe_payments_created_at ON stripe_payments(created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_stripe_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stripe_payments_updated_at
  BEFORE UPDATE ON stripe_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_stripe_payments_updated_at();

-- Enable realtime on orders table for payment status updates
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Add payment_status column to orders table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending' 
      CHECK (payment_status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled'));
    
    -- Create index on payment_status
    CREATE INDEX idx_orders_payment_status ON orders(payment_status);
  END IF;
END $$;

-- Add comment to table
COMMENT ON TABLE stripe_payments IS 'Stores Stripe payment records for mobile app orders';
COMMENT ON COLUMN stripe_payments.amount IS 'Payment amount in cents (e.g., 1000 = $10.00)';
COMMENT ON COLUMN stripe_payments.stripe_payment_intent_id IS 'Stripe PaymentIntent ID (pi_xxx)';
COMMENT ON COLUMN stripe_payments.status IS 'Payment status: pending, processing, succeeded, failed, or canceled';
