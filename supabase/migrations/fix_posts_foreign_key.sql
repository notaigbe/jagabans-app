
-- Fix the posts table foreign key to reference user_profiles.user_id instead of auth.users.id
-- This migration ensures the posts table properly references user_profiles

-- First, check if the posts table exists
DO $$ 
BEGIN
  -- Drop the existing foreign key constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_user_id_fkey' 
    AND table_name = 'posts'
  ) THEN
    ALTER TABLE posts DROP CONSTRAINT posts_user_id_fkey;
  END IF;
END $$;

-- Add a new foreign key constraint that references user_profiles.user_id
-- Note: This assumes user_profiles.user_id exists and is properly set up
ALTER TABLE posts 
ADD CONSTRAINT posts_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES user_profiles(user_id) 
ON DELETE CASCADE;

-- Create an index on user_profiles.user_id if it doesn't exist for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Similarly fix post_comments foreign key
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'post_comments_user_id_fkey' 
    AND table_name = 'post_comments'
  ) THEN
    ALTER TABLE post_comments DROP CONSTRAINT post_comments_user_id_fkey;
  END IF;
END $$;

ALTER TABLE post_comments 
ADD CONSTRAINT post_comments_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES user_profiles(user_id) 
ON DELETE CASCADE;

-- Fix post_likes foreign key
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'post_likes_user_id_fkey' 
    AND table_name = 'post_likes'
  ) THEN
    ALTER TABLE post_likes DROP CONSTRAINT post_likes_user_id_fkey;
  END IF;
END $$;

ALTER TABLE post_likes 
ADD CONSTRAINT post_likes_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES user_profiles(user_id) 
ON DELETE CASCADE;

-- Fix post_reports foreign key
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'post_reports_reporter_user_id_fkey' 
    AND table_name = 'post_reports'
  ) THEN
    ALTER TABLE post_reports DROP CONSTRAINT post_reports_reporter_user_id_fkey;
  END IF;
END $$;

ALTER TABLE post_reports 
ADD CONSTRAINT post_reports_reporter_user_id_fkey 
FOREIGN KEY (reporter_user_id) 
REFERENCES user_profiles(user_id) 
ON DELETE CASCADE;

-- Fix referrals foreign keys
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'referrals_referrer_user_id_fkey' 
    AND table_name = 'referrals'
  ) THEN
    ALTER TABLE referrals DROP CONSTRAINT referrals_referrer_user_id_fkey;
  END IF;
END $$;

ALTER TABLE referrals 
ADD CONSTRAINT referrals_referrer_user_id_fkey 
FOREIGN KEY (referrer_user_id) 
REFERENCES user_profiles(user_id) 
ON DELETE CASCADE;

DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'referrals_referred_user_id_fkey' 
    AND table_name = 'referrals'
  ) THEN
    ALTER TABLE referrals DROP CONSTRAINT referrals_referred_user_id_fkey;
  END IF;
END $$;

ALTER TABLE referrals 
ADD CONSTRAINT referrals_referred_user_id_fkey 
FOREIGN KEY (referred_user_id) 
REFERENCES user_profiles(user_id) 
ON DELETE SET NULL;

-- Fix push_notification_tokens foreign key
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'push_notification_tokens_user_id_fkey' 
    AND table_name = 'push_notification_tokens'
  ) THEN
    ALTER TABLE push_notification_tokens DROP CONSTRAINT push_notification_tokens_user_id_fkey;
  END IF;
END $$;

ALTER TABLE push_notification_tokens 
ADD CONSTRAINT push_notification_tokens_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES user_profiles(user_id) 
ON DELETE CASCADE;

-- Fix push_notification_preferences foreign key
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'push_notification_preferences_user_id_fkey' 
    AND table_name = 'push_notification_preferences'
  ) THEN
    ALTER TABLE push_notification_preferences DROP CONSTRAINT push_notification_preferences_user_id_fkey;
  END IF;
END $$;

ALTER TABLE push_notification_preferences 
ADD CONSTRAINT push_notification_preferences_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES user_profiles(user_id) 
ON DELETE CASCADE;

-- Fix push_notification_log foreign key
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'push_notification_log_user_id_fkey' 
    AND table_name = 'push_notification_log'
  ) THEN
    ALTER TABLE push_notification_log DROP CONSTRAINT push_notification_log_user_id_fkey;
  END IF;
END $$;

ALTER TABLE push_notification_log 
ADD CONSTRAINT push_notification_log_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES user_profiles(user_id) 
ON DELETE CASCADE;
