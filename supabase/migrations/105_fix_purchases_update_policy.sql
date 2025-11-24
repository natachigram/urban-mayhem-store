-- ========================================
-- FIX: Allow updates to purchase records
-- The status update from pending to completed was failing due to missing UPDATE policy
-- ========================================

-- Allow anyone to update purchases (status changes, transaction hash)
-- In production, you might want to restrict this to only updating certain fields
CREATE POLICY "Anyone can update purchases"
  ON purchases FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Alternative: More restrictive policy (only allow updates to pending purchases)
-- CREATE POLICY "Can update pending purchases"
--   ON purchases FOR UPDATE
--   USING (status = 'pending')
--   WITH CHECK (status IN ('completed', 'failed'));

-- ========================================
-- VERIFICATION
-- ========================================

-- Check all policies on purchases table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'purchases'
ORDER BY cmd, policyname;
