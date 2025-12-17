-- Create account deletion audit table
CREATE TABLE IF NOT EXISTS account_deletion_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_account_deletion_audit_user_id ON account_deletion_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_account_deletion_audit_deleted_at ON account_deletion_audit(deleted_at);

-- Enable RLS
ALTER TABLE account_deletion_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view deletion audit logs"
  ON account_deletion_audit
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_role IN ('admin', 'super_admin')
    )
  );

-- System can insert audit logs
CREATE POLICY "System can insert deletion audit logs"
  ON account_deletion_audit
  FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE account_deletion_audit IS 'Audit log for account deletions - stores only non-personal data for compliance';
COMMENT ON COLUMN account_deletion_audit.user_id IS 'UUID of deleted user (for audit trail only, cannot be linked back to user)';
COMMENT ON COLUMN account_deletion_audit.deleted_at IS 'Timestamp when account was deleted';
COMMENT ON COLUMN account_deletion_audit.reason IS 'Reason for deletion (e.g., user_requested, admin_action)';
