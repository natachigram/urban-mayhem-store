// ========================================
// URBAN MAYHEM STORE - MVP SUPABASE SERVICE
// Simplified API for production launch
// ========================================

import { createClient } from '@supabase/supabase-js';
import type { Item, Purchase, UserInventoryItem } from '@/types/database';
import {
  mockItems,
  getMockItemById,
  getMockItemsByType,
  getMockFeaturedItems,
} from './mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured
const isSupabaseConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here';

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase not configured. Using mock data mode.');
  console.log(
    '💡 To use real backend, configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Helper to simulate async delay for mock data
const mockDelay = () => new Promise((resolve) => setTimeout(resolve, 300));

// ========================================
// ITEMS API
// ========================================

export const itemsApi = {
  async getAll(type?: string, limit = 50): Promise<Item[]> {
    // Use mock data if Supabase not configured
    if (!isSupabaseConfigured) {
      await mockDelay();
      if (type) {
        return getMockItemsByType(type).slice(0, limit);
      }
      return mockItems.slice(0, limit);
    }

    let query = supabase
      .from('items')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('purchase_count', { ascending: false })
      .limit(limit);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching items:', error);
      throw error;
    }

    return data || [];
  },

  async getById(id: string): Promise<Item | null> {
    // Use mock data if Supabase not configured
    if (!isSupabaseConfigured) {
      await mockDelay();
      return getMockItemById(id) || null;
    }

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching item:', error);
      throw error;
    }

    return data;
  },

  async getFeatured(limit = 6): Promise<Item[]> {
    // Use mock data if Supabase not configured
    if (!isSupabaseConfigured) {
      await mockDelay();
      return getMockFeaturedItems().slice(0, limit);
    }

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('is_featured', true)
      .eq('is_active', true)
      .order('purchase_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
};

// ========================================
// PURCHASE API
// ========================================

export const purchaseApi = {
  async createPurchase(purchase: {
    item_id: string;
    user_wallet: string;
    quantity: number;
    transaction_hash: string;
  }): Promise<Purchase> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase configuration required for purchases');
    }

    // Call edge function to process purchase
    const { data, error } = await supabase.functions.invoke(
      'process-purchase',
      {
        body: purchase,
      }
    );

    if (error) throw error;
    return data;
  },

  async processUmpTopup(topup: {
    txHash: string;
    userWallet: string;
    amountUmp: number;
    userId?: string;
  }) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase configuration required for UMP top-up');
    }

    const { data, error } = await supabase.functions.invoke(
      'process-purchase',
      {
        body: {
          type: 'ump_topup',
          ...topup,
        },
      }
    );

    if (error) throw error;
    return data;
  },

  async getUserPurchases(userWallet: string): Promise<Purchase[]> {
    if (!isSupabaseConfigured) {
      await mockDelay();
      return [];
    }

    const { data, error } = await supabase
      .from('purchases')
      .select('*, item:items(*)')
      .eq('user_wallet', userWallet)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};

// ========================================
// INVENTORY API
// ========================================

export const inventoryApi = {
  async getUserInventory(userWallet: string): Promise<UserInventoryItem[]> {
    if (!isSupabaseConfigured) {
      await mockDelay();
      return [];
    }

    const { data, error } = await supabase
      .from('user_inventory')
      .select('*, item:items(*)')
      .eq('user_wallet', userWallet)
      .order('acquired_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getEquippedItems(userWallet: string): Promise<UserInventoryItem[]> {
    if (!isSupabaseConfigured) {
      await mockDelay();
      return [];
    }

    const { data, error } = await supabase
      .from('user_inventory')
      .select('*, item:items(*)')
      .eq('user_wallet', userWallet)
      .eq('is_equipped', true);

    if (error) throw error;
    return data || [];
  },
};
