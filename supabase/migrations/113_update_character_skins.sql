-- ========================================
-- UPDATE CHARACTER SKINS
-- Replace all skins with actual game characters
-- ========================================

-- Delete all existing skins
DELETE FROM items WHERE type = 'skin';

-- Insert the 4 actual character skins
INSERT INTO items (name, type, description, image_url, gallery_images, price, rarity, is_featured, purchase_count, stats) VALUES
(
  'Bulkhead', 
  'skin', 
  'Heavy-duty combat specialist with enhanced armor and defensive capabilities',
  '/skins/bulkhead.png',
  ARRAY['/skins/bulkhead.png', '/skins/bulkhead_2.png'],
  2.50,
  'legendary',
  true,
  450,
  '{"defense": 95, "strength": 90, "speed": 60}'::jsonb
),
(
  'Iron Hide', 
  'skin', 
  'Elite warrior with tactical precision and superior firepower',
  '/skins/iron_hide.png',
  ARRAY['/skins/iron_hide.png', '/skins/iron_hide_2.png'],
  2.00,
  'epic',
  true,
  680,
  '{"defense": 85, "strength": 85, "speed": 75}'::jsonb
),
(
  'Side Sweep', 
  'skin', 
  'Agile striker with lightning-fast reflexes and mobility',
  '/skins/side_sweep.png',
  ARRAY['/skins/side_sweep.png', '/skins/side_sweep_2.png'],
  1.50,
  'epic',
  false,
  320,
  '{"defense": 65, "strength": 75, "speed": 95}'::jsonb
),
(
  'Streetwise', 
  'skin', 
  'Street-smart operative with balanced combat abilities',
  '/skins/streetwise.png',
  ARRAY['/skins/streetwise.png', '/skins/Streetwise_2.png'],
  0.75,
  'rare',
  false,
  890,
  '{"defense": 70, "strength": 70, "speed": 80}'::jsonb
);
