-- Check attestations table structure and sample data
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'attestations' 
LIMIT 20;

-- Get sample attestation
SELECT * FROM attestations LIMIT 1;

-- Check atoms table
SELECT * FROM atoms WHERE entity_type = 'item' LIMIT 3;

-- Check items table
SELECT id, identifier, name FROM items LIMIT 5;
