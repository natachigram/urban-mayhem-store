#!/bin/bash

# Urban Mayhem Store - Quick Start Script
# This script helps you get started quickly

echo "🎮 Urban Mayhem Store - Quick Start"
echo "===================================="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found!"
    echo "📝 Creating .env from template..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "🔧 ACTION REQUIRED:"
    echo "   1. Open .env in your editor"
    echo "   2. Add your Supabase URL and anon key"
    echo "   3. Add your WalletConnect Project ID"
    echo ""
    echo "   Get Supabase credentials from:"
    echo "   https://supabase.com/dashboard/project/_/settings/api"
    echo ""
    echo "   Get WalletConnect ID from:"
    echo "   https://cloud.walletconnect.com"
    echo ""
else
    echo "✅ .env file exists"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "📊 Next Steps:"
echo ""
echo "1. Configure Supabase:"
echo "   - Create project at https://supabase.com"
echo "   - Go to SQL Editor"
echo "   - Run: supabase/migrations/001_initial_schema.sql"
echo ""
echo "2. Start development server:"
echo "   npm run dev"
echo ""
echo "3. Open http://localhost:5173"
echo ""
echo "📖 Full setup guide: SETUP.md"
echo ""
