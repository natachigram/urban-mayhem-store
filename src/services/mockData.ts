// ========================================
// URBAN MAYHEM STORE - MOCK DATA
// For development without Supabase
// ========================================

import type { Item } from '@/types/database';

export const mockItems: Item[] = [
  {
    id: 'item-1',
    name: 'Plasma Rifle X-99',
    type: 'weapon',
    description: 'Devastating energy weapon with rapid-fire capability',
    long_description: 'The Plasma Rifle X-99 is the pinnacle of Urban Mayhem weaponry.',
    image_url: 'https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=800',
    price: 29.99,
    rarity: 'legendary',
    stats: { damage: 85, fireRate: 750, accuracy: 88 },
    is_featured: true,
    is_active: true,
    purchase_count: 1205,
    created_at: '2024-06-01T00:00:00Z',
    updated_at: '2025-11-21T00:00:00Z',
  },
  {
    id: 'item-2',
    name: 'Neon Tactical Suit',
    type: 'skin',
    description: 'Glowing tactical armor with reactive neon patterns',
    image_url: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800',
    price: 19.99,
    rarity: 'epic',
    stats: { movementSpeed: 5 },
    is_featured: true,
    is_active: true,
    purchase_count: 892,
    created_at: '2024-06-15T00:00:00Z',
    updated_at: '2025-11-21T00:00:00Z',
  },
  {
    id: 'item-3',
    name: 'Starter Pack',
    type: 'bundle',
    description: 'Essential items for new Urban Mayhem players',
    image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
    price: 9.99,
    rarity: 'common',
    is_featured: true,
    is_active: true,
    purchase_count: 3421,
    created_at: '2024-05-01T00:00:00Z',
    updated_at: '2025-11-21T00:00:00Z',
  },
  {
    id: 'item-4',
    name: 'Cyber Katana',
    type: 'weapon',
    description: 'High-frequency blade for close combat specialists',
    image_url: 'https://images.unsplash.com/photo-1583521214690-73421a1829a9?w=800',
    price: 24.99,
    rarity: 'legendary',
    stats: { damage: 95, range: 'melee', attackSpeed: 2.5 },
    is_featured: false,
    is_active: true,
    purchase_count: 687,
    created_at: '2024-07-01T00:00:00Z',
    updated_at: '2025-11-21T00:00:00Z',
  },
  {
    id: 'item-5',
    name: 'Shield Regenerator',
    type: 'powerup',
    description: 'Rapidly restores shield capacity',
    image_url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=800',
    price: 4.99,
    rarity: 'rare',
    is_featured: false,
    is_active: true,
    purchase_count: 2134,
    created_at: '2024-06-10T00:00:00Z',
    updated_at: '2025-11-21T00:00:00Z',
  },
];

export const getMockItemById = (id: string): Item | undefined => {
  return mockItems.find((item) => item.id === id);
};

export const getMockItemsByType = (type: string): Item[] => {
  return mockItems.filter((item) => item.type === type);
};

export const getMockFeaturedItems = (): Item[] => {
  return mockItems.filter((item) => item.is_featured);
};
