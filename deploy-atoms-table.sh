#!/bin/bash

# Deploy atoms table to Supabase
# Usage: ./deploy-atoms-table.sh

SUPABASE_URL="https://kxltwbzkldztokoxakef.supabase.co"
MIGRATION_FILE="supabase/migrations/106_intuition_schema.sql"

echo "📦 Deploying atoms table migration..."
echo ""
echo "Please run this SQL manually in Supabase SQL Editor:"
echo "👉 https://supabase.com/dashboard/project/kxltwbzkldztokoxakef/sql/new"
echo ""
echo "Copy and paste the entire content from:"
echo "   $MIGRATION_FILE"
echo ""
cat "$MIGRATION_FILE"
