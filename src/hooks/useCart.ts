import { useState, useEffect } from 'react';
import {
  getCart,
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,
  getCartTotal,
  getCartItemCount,
  isItemInCart,
  type CartItem,
} from '@/services/cart';
import type { Item } from '@/types/database';
import { toast } from 'sonner';

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>(getCart());
  const [total, setTotal] = useState<number>(getCartTotal());
  const [itemCount, setItemCount] = useState<number>(getCartItemCount());

  // Listen for cart updates from other components
  useEffect(() => {
    const handleCartUpdate = () => {
      setCart(getCart());
      setTotal(getCartTotal());
      setItemCount(getCartItemCount());
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  const add = (item: Item, quantity = 1) => {
    addToCart(item, quantity);
    toast.success('Added to cart!', {
      description: `${item.name} x${quantity}`,
    });
    // Update local state
    setCart(getCart());
    setTotal(getCartTotal());
    setItemCount(getCartItemCount());
  };

  const remove = (itemId: string) => {
    removeFromCart(itemId);
    toast.success('Removed from cart');
    setCart(getCart());
    setTotal(getCartTotal());
    setItemCount(getCartItemCount());
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    updateCartItemQuantity(itemId, quantity);
    setCart(getCart());
    setTotal(getCartTotal());
    setItemCount(getCartItemCount());
  };

  const clear = () => {
    clearCart();
    toast.success('Cart cleared');
    setCart([]);
    setTotal(0);
    setItemCount(0);
  };

  const isInCart = (itemId: string): boolean => {
    return isItemInCart(itemId);
  };

  return {
    cart,
    total,
    itemCount,
    add,
    remove,
    updateQuantity,
    clear,
    isInCart,
  };
};
