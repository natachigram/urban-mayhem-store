-- ========================================
-- SEED DATA: Store Items
-- Initial catalog for Urban Mayhem Store
-- ========================================

-- Insert Skins
INSERT INTO items (name, type, description, image_url, price, rarity, is_featured, purchase_count, stats) VALUES
('Neon Spectre', 'skin', 'Elite stealth suit with active camouflage capabilities', 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800', 0.25, 'legendary', true, 1240, '{"defense": 85, "stealth": 95}'::jsonb),
('Cyber Punk', 'skin', 'Street-ready combat gear with integrated neural link', 'https://images.unsplash.com/photo-1614680376408-81e91ffe3db7?w=800', 0.15, 'epic', true, 850, '{"defense": 70, "tech": 90}'::jsonb),
('Urban Ranger', 'skin', 'Standard issue urban camouflage for city operations', 'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?w=800', 0.08, 'rare', false, 2100, '{"defense": 60, "mobility": 75}'::jsonb),
('Void Walker', 'skin', 'Experimental suit utilizing void energy for movement', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 0.30, 'legendary', true, 3500, '{"defense": 80, "speed": 100}'::jsonb),
('Toxic Hazard', 'skin', 'Hazmat combat suit designed for toxic environments', 'https://images.unsplash.com/photo-1608889476561-6242cfdbf622?w=800', 0.18, 'epic', false, 420, '{"defense": 90, "hazard_res": 100}'::jsonb),
('Night Owl', 'skin', 'Specialized gear for night operations', 'https://images.unsplash.com/photo-1523438097201-512ae7d59c44?w=800', 0.075, 'rare', false, 950, '{"defense": 55, "night_vision": 80}'::jsonb),
('Chrome Assassin', 'skin', 'Reflective armor with enhanced agility systems', 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800', 0.22, 'legendary', false, 680, '{"defense": 75, "agility": 95}'::jsonb),
('Desert Storm', 'skin', 'Military-grade tactical suit for harsh environments', 'https://images.unsplash.com/photo-1618588507085-c79565432917?w=800', 0.12, 'epic', false, 1150, '{"defense": 80, "heat_res": 85}'::jsonb);

-- Insert Weapons
INSERT INTO items (name, type, description, image_url, price, rarity, is_featured, purchase_count, stats) VALUES
('Plasma Rifle X-99', 'weapon', 'Devastating energy weapon with rapid-fire capability', 'https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=800', 0.35, 'legendary', true, 1890, '{"damage": 95, "fire_rate": 850, "accuracy": 88}'::jsonb),
('Cyber Katana', 'weapon', 'High-frequency blade for close combat specialists', 'https://images.unsplash.com/photo-1583521214690-73421a1829a9?w=800', 0.28, 'legendary', false, 760, '{"damage": 100, "speed": 2.5, "range": 2}'::jsonb),
('Quantum SMG', 'weapon', 'Submachine gun with phase-shift ammunition', 'https://images.unsplash.com/photo-1511914678378-2906b1f69dcf?w=800', 0.18, 'epic', true, 1420, '{"damage": 65, "fire_rate": 950, "accuracy": 75}'::jsonb),
('Thunder Cannon', 'weapon', 'Heavy artillery weapon with explosive rounds', 'https://images.unsplash.com/photo-1624504589343-f2bfc082e8de?w=800', 0.42, 'legendary', false, 520, '{"damage": 120, "fire_rate": 120, "splash_damage": 50}'::jsonb);

-- Insert Bundles
INSERT INTO items (name, type, description, image_url, price, rarity, is_featured, purchase_count, stats) VALUES
('Starter Pack', 'bundle', 'Essential items for new Urban Mayhem players - includes basic skin, weapon, and 500 UMP', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800', 0.10, 'common', true, 3850, '{"items": ["basic_skin", "starter_weapon", "500_ump"]}'::jsonb),
('Pro Bundle', 'bundle', 'Advanced loadout for experienced players - Epic skin, legendary weapon, 2000 UMP', 'https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=800', 0.65, 'epic', true, 1240, '{"items": ["epic_skin", "legendary_weapon", "2000_ump"]}'::jsonb),
('Ultimate Warlord Pack', 'bundle', 'Complete arsenal - 3 legendary skins, 2 weapons, 5000 UMP', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800', 1.50, 'legendary', true, 420, '{"items": ["3_legendary_skins", "2_weapons", "5000_ump"]}'::jsonb);

-- Insert Powerups
INSERT INTO items (name, type, description, image_url, price, rarity, is_featured, purchase_count, stats) VALUES
('Shield Regenerator', 'powerup', 'Rapidly restores shield capacity over 10 seconds', 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=800', 0.05, 'rare', false, 2850, '{"heal_rate": 20, "duration": 10}'::jsonb),
('Speed Boost', 'powerup', 'Increases movement speed by 50% for 15 seconds', 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=800', 0.04, 'rare', false, 3200, '{"speed_mult": 1.5, "duration": 15}'::jsonb),
('Damage Amplifier', 'powerup', 'Boosts all damage output by 35% for 20 seconds', 'https://images.unsplash.com/photo-1579547621113-e4bb2a19bdd6?w=800', 0.06, 'epic', true, 1950, '{"damage_mult": 1.35, "duration": 20}'::jsonb),
('Invisibility Cloak', 'powerup', 'Become nearly invisible for 8 seconds', 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800', 0.08, 'legendary', false, 1180, '{"stealth": 95, "duration": 8}'::jsonb);

-- Update timestamps
UPDATE items SET updated_at = now();

-- Verify inserts
SELECT type, COUNT(*), SUM(purchase_count) as total_sales
FROM items
GROUP BY type
ORDER BY type;
