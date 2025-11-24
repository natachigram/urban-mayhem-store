-- Add placeholder items for mock data purchases
-- These allow purchases table to reference valid item_ids while using mock frontend data

INSERT INTO items (id, name, type, description, image_url, price, rarity, stats) VALUES
  ('00000000-0000-0000-0000-000000000001', 'UMP Token Package', 'bundle', 'Urban Mayhem Points for in-game purchases', 'https://placehold.co/400x400/0a0a0a/05FF9D?text=UMP', 0.00, 'common', '{}'),
  ('00000000-0000-0000-0000-000000000002', 'Character Skin', 'skin', 'Premium character cosmetic', 'https://placehold.co/400x500/0a0a0a/05FF9D?text=Skin', 0.00, 'common', '{}')
ON CONFLICT (id) DO NOTHING;
