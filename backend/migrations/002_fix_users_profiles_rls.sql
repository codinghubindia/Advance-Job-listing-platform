-- =====================================================
-- FIX: Add INSERT policy for users_profiles table
-- =====================================================
-- The service role key SHOULD bypass RLS automatically,
-- but if you're still having issues, run this migration.
-- This adds an INSERT policy that allows authenticated users
-- to create their own profile during registration.

-- Drop existing policy if it exists
DROP POLICY IF EXISTS users_profiles_insert_own ON users_profiles;

-- Allow authenticated users to insert their own profile
CREATE POLICY users_profiles_insert_own ON users_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Add comment
COMMENT ON POLICY users_profiles_insert_own ON users_profiles IS 
  'Allows users to create their own profile during authentication';

