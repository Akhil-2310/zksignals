-- Fix RLS policies for anonymous access
-- Run this in your Supabase SQL editor to fix the RLS policy issues

-- Drop the problematic policies
DROP POLICY IF EXISTS "Group creators can update their groups" ON groups;
DROP POLICY IF EXISTS "Users can access their own identities" ON semaphore_identities;

-- Create new policies that work with anonymous access
CREATE POLICY "Public group updates" ON groups
    FOR UPDATE USING (true);

CREATE POLICY "Public access to semaphore identities" ON semaphore_identities
    FOR ALL USING (true);

-- Verify policies are working
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('groups', 'semaphore_identities')
ORDER BY tablename, policyname;
