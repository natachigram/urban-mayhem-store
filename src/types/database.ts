// ========================================
// URBAN MAYHEM STORE - MVP TYPE DEFINITIONS
// Simplified schema for production launch
// ========================================

export type ItemType = 'weapon' | 'skin' | 'bundle' | 'powerup';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type PurchaseStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// ========================================
// CORE DATABASE TYPES
// ========================================

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  description?: string;
  long_description?: string;
  image_url: string;
  gallery_images?: string[];
  price: number;
  rarity: Rarity;
  stats?: Record<string, any>;
  stock_quantity?: number; // -1 means unlimited
  is_featured: boolean;
  is_active: boolean;
  purchase_count: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  item_id: string;
  user_wallet: string;
  user_id?: string;
  amount: number;
  quantity: number;
  transaction_hash?: string;
  status: PurchaseStatus;
  metadata?: Record<string, any>;
  created_at: string;
  // Populated via joins
  item?: Item;
}

export interface UserInventoryItem {
  id: string;
  user_wallet: string;
  user_id?: string;
  item_id: string;
  purchase_id?: string;
  quantity: number;
  is_equipped: boolean;
  metadata?: Record<string, any>;
  acquired_at: string;
  // Populated via joins
  item?: Item;
}

// ========================================
// CLIENT-SIDE TYPES
// ========================================

export interface CartItem {
  item: Item;
  quantity: number;
}

// ========================================
// API RESPONSE TYPES
// ========================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface PurchaseResponse {
  success: boolean;
  purchase?: Purchase;
  inventory?: UserInventoryItem;
  error?: string;
}

export interface InventorySyncResponse {
  success: boolean;
  items: UserInventoryItem[];
  last_sync: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
