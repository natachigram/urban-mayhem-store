// ========================================
// URBAN MAYHEM STORE - MVP DATA HOOKS
// Simplified hooks for production launch
// ========================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsApi, purchaseApi, inventoryApi } from '@/services/supabase';
import type { Item, Purchase } from '@/types/database';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';

// ========================================
// STORE HOOKS
// ========================================

// Fetch all items with optional type filter
export const useItems = (type?: string) => {
  return useQuery({
    queryKey: ['items', type],
    queryFn: () => itemsApi.getAll(type),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
};

// Fetch featured items
export const useFeaturedItems = () => {
  return useQuery({
    queryKey: ['items', 'featured'],
    queryFn: () => itemsApi.getFeatured(),
    staleTime: 1000 * 60 * 5,
  });
};

// Fetch single item by ID
export const useItemDetail = (id: string | undefined) => {
  return useQuery({
    queryKey: ['item', id],
    queryFn: () => {
      if (!id) throw new Error('Item ID is required');
      return itemsApi.getById(id);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};

// ========================================
// INVENTORY HOOKS
// ========================================

// Fetch user inventory
export const useInventory = () => {
  const { address } = useAccount();

  return useQuery({
    queryKey: ['inventory', address],
    queryFn: () => {
      if (!address) throw new Error('Wallet not connected');
      return inventoryApi.getUserInventory(address);
    },
    enabled: !!address,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Check if user owns an item
export const useOwnsItem = (itemId: string | undefined) => {
  const { address } = useAccount();

  return useQuery({
    queryKey: ['ownsItem', address, itemId],
    queryFn: async () => {
      if (!address || !itemId) return false;
      const inventory = await inventoryApi.getUserInventory(address);
      return inventory.some((inv) => inv.item_id === itemId);
    },
    enabled: !!address && !!itemId,
    staleTime: 1000 * 60 * 5,
  });
};

// ========================================
// PURCHASE HOOKS
// ========================================

// Purchase item mutation
export const usePurchaseItem = () => {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return useMutation({
    mutationFn: async ({
      itemId,
      quantity = 1,
      transactionHash,
    }: {
      itemId: string;
      quantity?: number;
      transactionHash: string;
    }) => {
      if (!address) throw new Error('Wallet not connected');
      return purchaseApi.createPurchase({
        item_id: itemId,
        user_wallet: address,
        quantity,
        transaction_hash: transactionHash,
      });
    },
    onSuccess: () => {
      toast.success('Purchase successful!', {
        description: 'Item added to your inventory.',
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', address] });
    },
    onError: (error: Error) => {
      toast.error('Purchase failed', {
        description: error.message,
      });
    },
  });
};

// Fetch user purchase history
export const usePurchaseHistory = () => {
  const { address } = useAccount();

  return useQuery({
    queryKey: ['purchases', address],
    queryFn: () => {
      if (!address) throw new Error('Wallet not connected');
      return purchaseApi.getUserPurchases(address);
    },
    enabled: !!address,
    staleTime: 1000 * 60 * 5,
  });
};
