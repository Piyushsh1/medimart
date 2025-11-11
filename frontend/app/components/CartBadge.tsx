import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCart } from '../hooks/useCart';
import { Colors } from '../constants/Colors';

export const CartBadge: React.FC = () => {
  const router = useRouter();
  const { cartItemCount } = useCart();

  const openCart = () => {
    // navigate to the cart screen
    router.push('/cart');
  };

  const displayCount = cartItemCount > 10 ? '10+' : cartItemCount.toString();

  return (
    <TouchableOpacity style={styles.container} onPress={openCart} activeOpacity={0.8}>
      <Ionicons name="cart-outline" size={24} color={Colors.text} />
      {cartItemCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{displayCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: 2,
    top: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default CartBadge;
