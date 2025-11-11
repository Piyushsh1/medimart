import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { cartAPI, getAuthToken } from '../services/api';
import { Cart } from '../types';
import { cartEvents } from '../utils/cartEvents';

export const useCart = () => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);

  const loadCart = useCallback(async () => {
    if (!getAuthToken()) {
      setCart(null);
      setCartItemCount(0);
      return;
    }

    try {
      setLoading(true);
      const cartData = await cartAPI.get();
      setCart(cartData);
      
      if (cartData && cartData.items) {
        const totalItems = cartData.items.reduce((sum, item) => sum + item.quantity, 0);
        setCartItemCount(totalItems);
      } else {
        setCartItemCount(0);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setCart(null);
      setCartItemCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload cart when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [loadCart])
  );

  // Listen to cart update events for real-time updates
  useEffect(() => {
    const unsubscribe = cartEvents.subscribe(() => {
      loadCart();
    });
    return unsubscribe;
  }, [loadCart]);

  const addToCart = async (medicineId: string, quantity: number = 1) => {
    try {
      await cartAPI.add(medicineId, quantity);
      await loadCart();
      return true;
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (medicineId: string, quantity: number) => {
    try {
      await cartAPI.update(medicineId, quantity);
      await loadCart();
      return true;
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      throw error;
    }
  };

  const removeFromCart = async (medicineId: string) => {
    try {
      await cartAPI.remove(medicineId);
      await loadCart();
      return true;
    } catch (error: any) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  const getItemQuantity = (medicineId: string): number => {
    if (!cart || !cart.items) return 0;
    const item = cart.items.find(item => item.medicine_id === medicineId);
    return item ? item.quantity : 0;
  };

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  return {
    cart,
    loading,
    cartItemCount,
    loadCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    getItemQuantity,
  };
};
