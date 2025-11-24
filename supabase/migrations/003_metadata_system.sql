-- Migration 003: Metadata-Based Asset System
-- This migration adds metadata columns to support Unity-safe asset creation

-- Add metadata columns to items table
ALTER TABLE items
ADD COLUMN IF NOT EXISTS base_prefab TEXT,
ADD COLUMN IF NOT EXISTS variant_style TEXT,
ADD COLUMN IF NOT EXISTS texture_variant TEXT DEFAULT 'variant_a',
ADD COLUMN IF NOT EXISTS glow_effect TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Update stats column to store structured metadata (base, modifiers, final)
COMMENT ON COLUMN items.stats IS 'Stores metadata, baseStats, and finalStats as JSONB';
COMMENT ON COLUMN items.base_prefab IS 'Unity prefab ID from controlled prefab list';
COMMENT ON COLUMN items.variant_style IS 'Color style ID from visualVariations.colorStyles';
COMMENT ON COLUMN items.texture_variant IS 'Texture variant ID from visualVariations.textureVariants';
COMMENT ON COLUMN items.glow_effect IS 'Glow effect ID from visualVariations.glowEffects';
COMMENT ON COLUMN items.metadata IS 'Full asset metadata for Unity interpretation';

-- Create validation function for stat limits
CREATE OR REPLACE FUNCTION validate_asset_metadata()
RETURNS TRIGGER AS $$
DECLARE
  weapon_stat_limits JSONB := '{"damage": {"min": -5, "max": 5}, "fireRate": {"min": -2, "max": 2}, "range": {"min": -3, "max": 3}, "accuracy": {"min": -5, "max": 5}}'::JSONB;
  powerup_stat_limits JSONB := '{"duration": {"min": 5, "max": 30}, "effectStrength": {"min": -10, "max": 10}}'::JSONB;
  stat_key TEXT;
  stat_value NUMERIC;
  limits JSONB;
BEGIN
  -- Validate base_prefab exists
  IF NEW.base_prefab IS NOT NULL AND NEW.base_prefab NOT IN (
    -- Weapon prefabs
    'AR_01', 'AR_02', 'SMG_01', 'SMG_02', 'SNIPER_01', 'SNIPER_02', 'SHOTGUN_01', 'PISTOL_01',
    -- Skin prefabs
    'SKIN_URBAN', 'SKIN_DESERT', 'SKIN_SHADOW', 'SKIN_NEON', 'SKIN_ARCTIC', 'SKIN_DIGITAL',
    -- Powerup prefabs
    'SPEED_01', 'SPEED_02', 'SHIELD_01', 'SHIELD_02', 'DAMAGE_01', 'DAMAGE_02', 'HEALTH_01', 'AMMO_01',
    -- Emote prefabs
    'EMOTE_VICTORY', 'EMOTE_TAUNT', 'EMOTE_DANCE', 'EMOTE_SALUTE', 'EMOTE_LAUGH'
  ) THEN
    RAISE EXCEPTION 'Invalid base_prefab: %', NEW.base_prefab;
  END IF;

  -- Validate color style
  IF NEW.variant_style IS NOT NULL AND NEW.variant_style NOT IN (
    'neon_purple', 'desert_yellow', 'shadow_black', 'arctic_blue', 'toxic_green', 
    'crimson_red', 'cyber_cyan', 'gold_luxury'
  ) THEN
    RAISE EXCEPTION 'Invalid variant_style: %', NEW.variant_style;
  END IF;

  -- Validate texture variant
  IF NEW.texture_variant NOT IN ('variant_a', 'variant_b', 'variant_c', 'variant_d') THEN
    RAISE EXCEPTION 'Invalid texture_variant: %', NEW.texture_variant;
  END IF;

  -- Validate glow effect
  IF NEW.glow_effect NOT IN ('none', 'subtle', 'medium', 'intense') THEN
    RAISE EXCEPTION 'Invalid glow_effect: %', NEW.glow_effect;
  END IF;

  -- Validate stat limits for weapons
  IF NEW.type = 'weapon' AND (NEW.stats -> 'metadata' -> 'stats') IS NOT NULL THEN
    FOR stat_key, stat_value IN SELECT * FROM jsonb_each_text(NEW.stats -> 'metadata' -> 'stats')
    LOOP
      limits := weapon_stat_limits -> stat_key;
      IF limits IS NOT NULL THEN
        IF stat_value::NUMERIC < (limits ->> 'min')::NUMERIC OR 
           stat_value::NUMERIC > (limits ->> 'max')::NUMERIC THEN
          RAISE EXCEPTION 'Stat % value % out of bounds (min: %, max: %)', 
            stat_key, stat_value, limits ->> 'min', limits ->> 'max';
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Validate stat limits for powerups
  IF NEW.type = 'powerup' AND (NEW.stats -> 'metadata' -> 'stats') IS NOT NULL THEN
    FOR stat_key, stat_value IN SELECT * FROM jsonb_each_text(NEW.stats -> 'metadata' -> 'stats')
    LOOP
      limits := powerup_stat_limits -> stat_key;
      IF limits IS NOT NULL THEN
        IF stat_value::NUMERIC < (limits ->> 'min')::NUMERIC OR 
           stat_value::NUMERIC > (limits ->> 'max')::NUMERIC THEN
          RAISE EXCEPTION 'Stat % value % out of bounds (min: %, max: %)', 
            stat_key, stat_value, limits ->> 'min', limits ->> 'max';
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Validate price minimum
  IF NEW.price < 0.001 THEN
    RAISE EXCEPTION 'Price must be at least 0.001 ETH';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for metadata validation
DROP TRIGGER IF EXISTS validate_asset_metadata_trigger ON items;
CREATE TRIGGER validate_asset_metadata_trigger
  BEFORE INSERT OR UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION validate_asset_metadata();

-- Create index for metadata queries
CREATE INDEX IF NOT EXISTS idx_items_base_prefab ON items(base_prefab);
CREATE INDEX IF NOT EXISTS idx_items_variant_style ON items(variant_style);
CREATE INDEX IF NOT EXISTS idx_items_metadata ON items USING GIN(metadata);

-- Add comment explaining metadata structure
COMMENT ON TABLE items IS 
'Items table with metadata-based asset system. Assets are defined by:
- base_prefab: Unity prefab ID from controlled list
- variant_style: Color style from preset options
- texture_variant: Texture from preset options  
- glow_effect: Glow intensity from preset options
- stats.metadata: Full metadata object for Unity
- stats.baseStats: Base stats from prefab
- stats.finalStats: Calculated stats (base + modifiers)';
