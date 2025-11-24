/**
 * Shopping cart management with localStorage persistence
 */

import type { Item } from '@/types/database';

export interface CartItem {
  item: Item;
  quantity: number;
  addedAt: string;
}

const CART_STORAGE_KEY = 'urban-mayhem-cart';

// Get cart from localStorage
export const getCart = (): CartItem[] => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading cart:', error);
    return [];
  }
};

// Save cart to localStorage
export const saveCart = (cart: CartItem[]): void => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    // Dispatch custom event for cart updates
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: { cart } }));
  } catch (error) {
    console.error('Error saving cart:', error);
  }
};

// Add item to cart
export const addToCart = (item: Item, quantity = 1): void => {
  const cart = getCart();
  const existingIndex = cart.findIndex(
    (cartItem) => cartItem.item.id === item.id
  );

  if (existingIndex >= 0) {
    // Update quantity if item already in cart
    cart[existingIndex].quantity += quantity;
  } else {
    // Add new item
    cart.push({
      item,
      quantity,
      addedAt: new Date().toISOString(),
    });
  }

  saveCart(cart);
};

// Remove item from cart
export const removeFromCart = (itemId: string): void => {
  const cart = getCart();
  const filtered = cart.filter((cartItem) => cartItem.item.id !== itemId);
  saveCart(filtered);
};

// Update item quantity
export const updateCartItemQuantity = (
  itemId: string,
  quantity: number
): void => {
  const cart = getCart();
  const index = cart.findIndex((cartItem) => cartItem.item.id === itemId);

  if (index >= 0) {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      cart[index].quantity = quantity;
      saveCart(cart);
    }
  }
};

// Clear entire cart
export const clearCart = (): void => {
  saveCart([]);
};

// Get cart total
export const getCartTotal = (): number => {
  const cart = getCart();
  return cart.reduce((total, cartItem) => {
    return total + cartItem.item.price * cartItem.quantity;
  }, 0);
};

// Get cart item count
export const getCartItemCount = (): number => {
  const cart = getCart();
  return cart.reduce((count, cartItem) => count + cartItem.quantity, 0);
};

// Check if item is in cart
export const isItemInCart = (itemId: string): boolean => {
  const cart = getCart();
  return cart.some((cartItem) => cartItem.item.id === itemId);
};
