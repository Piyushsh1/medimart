import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useCart } from '../hooks/useCart';
import { router } from 'expo-router';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

const DefaultRightAction: React.FC = () => {
  const { cartItemCount } = useCart();

  return (
    <TouchableOpacity style={styles.cartButton} onPress={() => router.push('/cart')}>
      <Ionicons name="bag" size={22} color={Colors.primary} />
      {cartItemCount > 0 ? (
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>{cartItemCount > 10 ? '10+' : cartItemCount}</Text>
        </View>
      ) : (
        <View style={styles.emptySpace} />
      )}
    </TouchableOpacity>
  );
};

export const Header: React.FC<HeaderProps> = ({ title, onBack, rightAction }) => {
  return (
    <View style={styles.header}>
      {onBack ? (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.emptySpace} />
      )}
      <Text style={styles.title}>{title}</Text>
      {rightAction !== undefined ? rightAction : <DefaultRightAction />}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  backButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  emptySpace: {
    width: 40,
  },
  cartButton: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    right: -2,
    top: -6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: Colors.background,
    fontSize: 10,
    fontWeight: '700',
  },
});
