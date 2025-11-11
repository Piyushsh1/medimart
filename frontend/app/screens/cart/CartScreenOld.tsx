import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { cartAPI } from '../../services/api';
import { Cart } from '../../types';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export default function CartScreen() {
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Cart | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const data = await cartAPI.get();
      setCart(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (medicineId: string) => {
    try {
      await cartAPI.remove(medicineId);
      Alert.alert('Success', 'Item removed from cart!');
      loadCart();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Header title="My Cart" onBack={() => router.back()} />

      {cart && cart.items.length > 0 ? (
        <>
          <ScrollView style={styles.cartItemsContainer} showsVerticalScrollIndicator={false}>
            {cart.items.map((item, index) => (
              <View key={index} style={styles.cartItem}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName}>Medicine {index + 1}</Text>
                  <View style={styles.cartItemPrice}>
                    <Text style={styles.cartItemCurrentPrice}>₹{item.price}</Text>
                    <Text style={styles.cartItemQuantity}>Qty: {item.quantity}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveItem(item.medicine_id)}>
                  <Ionicons name="trash" size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          <View style={styles.cartSummary}>
            <View style={styles.cartTotalContainer}>
              <Text style={styles.cartTotalLabel}>Total Amount:</Text>
              <Text style={styles.cartTotalAmount}>₹{cart.total_amount}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutButton} onPress={() => router.push('/checkout')}>
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyCartContainer}>
          <Ionicons name="bag-outline" size={80} color={Colors.textLight} />
          <Text style={styles.emptyCartText}>Your cart is empty</Text>
          <TouchableOpacity style={styles.shopNowButton} onPress={() => router.push('/home')}>
            <Text style={styles.shopNowButtonText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  cartItemsContainer: {
    flex: 1,
    paddingTop: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  cartItemPrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItemCurrentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  cartItemQuantity: {
    fontSize: 12,
    color: Colors.textLight,
  },
  removeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartSummary: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cartTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cartTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  cartTotalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  checkoutButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyCartText: {
    fontSize: 18,
    color: Colors.textLight,
    marginTop: 16,
    marginBottom: 32,
  },
  shopNowButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  shopNowButtonText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
});
