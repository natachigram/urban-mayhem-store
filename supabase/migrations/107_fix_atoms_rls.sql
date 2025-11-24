-- Fix RLS policies for atoms table to allow anonymous reads

-- Drop existing policies
DROP POLICY IF EXISTS "Atoms are viewable by everyone" ON atoms;
DROP POLICY IF EXISTS "Anyone can create atoms" ON atoms;

-- Recreate with anon access
CREATE POLICY "atoms_select_policy"
  ON atoms FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "atoms_insert_policy"
  ON atoms FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
