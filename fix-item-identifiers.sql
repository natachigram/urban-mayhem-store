DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'identifier'
  ) THEN
    ALTER TABLE items ADD COLUMN identifier TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_items_identifier ON items(identifier);

UPDATE items SET identifier = 'skin_1' WHERE name = 'Bulkhead' AND type = 'skin';
UPDATE items SET identifier = 'skin_2' WHERE name = 'Iron Hide' AND type = 'skin';
UPDATE items SET identifier = 'skin_3' WHERE name = 'Side Sweep' AND type = 'skin';
UPDATE items SET identifier = 'skin_4' WHERE name = 'Streetwise' AND type = 'skin';

UPDATE items SET identifier = 'pkg_ump' WHERE id = '00000000-0000-0000-0000-000000000001';
UPDATE items SET identifier = 'pkg_starter_1' WHERE id = 'dcd26d34-5f35-4387-a7ce-11991cea96bf';
UPDATE items SET identifier = 'pkg_starter_2' WHERE id = 'a64b1a73-c694-48b6-ac72-056a1872f842';
UPDATE items SET identifier = 'pkg_pro' WHERE id = '4b84ba12-7a9b-4063-89ec-2b6b132c0f88';
UPDATE items SET identifier = 'pkg_heavy' WHERE id = 'bea3c614-9e83-404d-9dcb-2fc80811b769';
UPDATE items SET identifier = 'pkg_ultimate' WHERE id = '571d9e3a-e04a-4520-8ef7-233d3b697be7';

UPDATE items SET identifier = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '_', 'g')) || '_' || LEFT(id::text, 8) WHERE identifier IS NULL AND type = 'weapon';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'items_identifier_key'
  ) THEN
    ALTER TABLE items ADD CONSTRAINT items_identifier_key UNIQUE (identifier);
  END IF;
END $$;

SELECT id, name, type, identifier FROM items WHERE identifier IS NOT NULL ORDER BY type, identifier;
