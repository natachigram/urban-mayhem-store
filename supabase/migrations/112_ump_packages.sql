-- Add UMP as a valid item type
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_type_check;
ALTER TABLE items ADD CONSTRAINT items_type_check 
  CHECK (type IN ('weapon', 'skin', 'bundle', 'powerup', 'ump'));

-- Insert UMP Packages
INSERT INTO items (name, type, description, image_url, price, rarity, is_featured, purchase_count, metadata) VALUES
('Starter Pack', 'ump', '500 UMP - Perfect for beginners', 'https://images.unsplash.com/photo-1614680376408-81e91ffe3db7?w=400', 0.05, 'common', false, 1850, '{"ump_amount": 500}'::jsonb),
('Pro Pack', 'ump', '1,200 UMP - Best value for active players', 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400', 0.10, 'rare', true, 3200, '{"ump_amount": 1200, "best_value": true}'::jsonb),
('Elite Pack', 'ump', '2,500 UMP - For serious competitors', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 0.20, 'epic', false, 1540, '{"ump_amount": 2500}'::jsonb),
('Warlord Pack', 'ump', '6,000 UMP - Maximum firepower', 'https://images.unsplash.com/photo-1608889476561-6242cfdbf622?w=400', 0.30, 'legendary', false, 890, '{"ump_amount": 6000}'::jsonb);
