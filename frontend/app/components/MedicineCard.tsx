import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Medicine } from '../types';
import { QuantitySelector } from './QuantitySelector';
import { useCart } from '../hooks/useCart';

interface MedicineCardProps {
  medicine: Medicine;
  quantity?: number;
  onAddToCart: () => Promise<void>;
  onUpdateQuantity?: (newQuantity: number) => Promise<void>;
  onRemove?: () => Promise<void>;
  onPress?: () => void;
}

export const MedicineCard: React.FC<MedicineCardProps> = ({ 
  medicine, 
  quantity,
  onAddToCart, 
  onUpdateQuantity,
  onRemove,
  onPress 
}) => {
  const { getItemQuantity } = useCart();

  // Prefer prop when explicitly provided, otherwise read live from useCart
  const displayedQuantity = typeof quantity === 'number' ? quantity : getItemQuantity(medicine.id);

  const handleIncrease = async () => {
    if (onUpdateQuantity) {
      await onUpdateQuantity(displayedQuantity + 1);
    }
  };

  const handleDecrease = async () => {
    if (onUpdateQuantity) {
      await onUpdateQuantity(displayedQuantity - 1);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.info}>
        <Text style={styles.name}>{medicine.name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {medicine.description}
        </Text>
        <Text style={styles.category}>{medicine.category}</Text>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>₹{medicine.price}</Text>
          <Text style={styles.mrp}>₹{medicine.mrp}</Text>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{medicine.discount_percentage}% OFF</Text>
          </View>
        </View>

        <View style={styles.stock}>
          <Text style={styles.stockText}>
            {medicine.stock_quantity > 0 ? `${medicine.stock_quantity} in stock` : 'Out of stock'}
          </Text>
          {medicine.prescription_required && <Text style={styles.prescriptionText}>Rx Required</Text>}
        </View>
      </View>

      <View style={styles.actionContainer}>
        <QuantitySelector
          quantity={displayedQuantity}
          maxQuantity={medicine.stock_quantity}
          onAdd={onAddToCart}
          onIncrease={handleIncrease}
          onDecrease={handleDecrease}
          onUpdateQuantity={onUpdateQuantity}
          onRemove={onRemove}
          disabled={medicine.stock_quantity === 0}
          size="small"
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 8,
    lineHeight: 16,
  },
  category: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginRight: 8,
  },
  mrp: {
    fontSize: 12,
    color: Colors.textLight,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 10,
    color: Colors.background,
    fontWeight: 'bold',
  },
  stock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  prescriptionText: {
    fontSize: 10,
    color: Colors.warning,
    fontWeight: '500',
  },
  actionContainer: {
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
});
