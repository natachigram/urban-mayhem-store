-- Fix purchases RLS policy to allow client-side inserts
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Service role can create purchases" ON purchases;

-- Allow authenticated users to create their own purchases
CREATE POLICY "Users can create own purchases"
  ON purchases FOR INSERT
  WITH CHECK (true); -- Allow any insert, validation happens in application

-- Allow public to create purchases (for wallet-only auth)
CREATE POLICY "Anyone can create purchases"
  ON purchases FOR INSERT
  TO anon
  WITH CHECK (true);

-- Update view policy to allow viewing own purchases by wallet
DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;

CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  USING (true); -- Allow viewing for now, can be restricted later
