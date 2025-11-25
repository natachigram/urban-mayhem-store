/**
 * Items Service
 * Fetch store items from Supabase database
 */

import { supabase } from './supabase';

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'skin' | 'bundle' | 'powerup' | 'ump';
  description: string;
  long_description?: string;
  image_url: string;
  gallery_images?: string[];
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  stats?: Record<string, any>;
  is_featured: boolean;
  is_active: boolean;
  purchase_count: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all active items
 */
export const getAllItems = async (): Promise<Item[]> => {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('is_active', true)
    .order('purchase_count', { ascending: false });

  if (error) {
    console.error('Error fetching items:', error);
    return [];
  }

  return data || [];
};

/**
 * Fetch items by type
 */
export const getItemsByType = async (type: string): Promise<Item[]> => {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('type', type)
    .eq('is_active', true)
    .order('rarity', { ascending: false });

  if (error) {
    console.error(`Error fetching ${type} items:`, error);
    return [];
  }

  return data || [];
};

/**
 * Fetch featured items
 */
export const getFeaturedItems = async (): Promise<Item[]> => {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('is_featured', true)
    .eq('is_active', true)
    .order('purchase_count', { ascending: false })
    .limit(6);

  if (error) {
    console.error('Error fetching featured items:', error);
    return [];
  }

  return data || [];
};

/**
 * Fetch single item by ID
 */
export const getItemById = async (id: string): Promise<Item | null> => {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching item ${id}:`, error);
    return null;
  }

  return data;
};

/**
 * Search items by name
 */
export const searchItems = async (query: string): Promise<Item[]> => {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('is_active', true)
    .ilike('name', `%${query}%`)
    .order('purchase_count', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error searching items:', error);
    return [];
  }

  return data || [];
};

/**
 * Fetch items with filters
 */
export interface ItemFilters {
  type?: string;
  rarity?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  sortBy?: 'price' | 'purchase_count' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export const getFilteredItems = async (
  filters: ItemFilters
): Promise<Item[]> => {
  let query = supabase.from('items').select('*').eq('is_active', true);

  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  if (filters.rarity) {
    query = query.eq('rarity', filters.rarity);
  }

  if (filters.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }

  if (filters.featured !== undefined) {
    query = query.eq('is_featured', filters.featured);
  }

  const sortBy = filters.sortBy || 'purchase_count';
  const sortOrder = filters.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching filtered items:', error);
    return [];
  }

  return data || [];
};
