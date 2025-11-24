-- ========================================
-- FIX: Inventory not updating on purchase completion
-- Add trigger for purchase status UPDATE
-- ========================================

-- The existing trigger only fires on INSERT with status='completed'
-- But payment.ts creates with 'pending' then updates to 'completed'
-- We need BOTH triggers

-- Drop existing trigger to recreate it
DROP TRIGGER IF EXISTS on_purchase_completed ON purchases;

-- Separate triggers for INSERT and UPDATE
-- Trigger 1: Handle direct completed inserts
CREATE TRIGGER on_purchase_inserted_completed
  AFTER INSERT ON purchases
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION handle_purchase();

-- Trigger 2: Handle status updates to completed
CREATE TRIGGER on_purchase_updated_completed
  AFTER UPDATE OF status ON purchases
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION handle_purchase();

-- ========================================
-- VERIFICATION
-- ========================================

-- Test: Check if trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_purchase_completed';
