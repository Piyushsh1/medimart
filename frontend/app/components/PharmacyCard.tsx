import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Pharmacy } from '../types';

interface PharmacyCardProps {
  pharmacy: Pharmacy;
  onPress: () => void;
  showDistance?: boolean;
}

export const PharmacyCard: React.FC<PharmacyCardProps> = ({ pharmacy, onPress, showDistance = false }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <Image source={{ uri: pharmacy.image }} style={styles.image} />
      <View style={styles.overlay}>
        {pharmacy.is_open && (
          <View style={styles.openBadge}>
            <Text style={styles.openBadgeText}>OPEN</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{pharmacy.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color={Colors.warning} />
            <Text style={styles.rating}>{pharmacy.rating}</Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {pharmacy.description}
        </Text>

        <View style={styles.meta}>
          {showDistance && pharmacy.distance !== undefined && (
            <View style={styles.metaItem}>
              <Ionicons name="location" size={14} color={Colors.primary} />
              <Text style={[styles.metaText, { color: Colors.primary, fontWeight: '600' }]}>
                {pharmacy.distance < 1 
                  ? `${Math.round(pharmacy.distance * 1000)} m` 
                  : `${pharmacy.distance.toFixed(1)} km`}
              </Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={Colors.textLight} />
            <Text style={styles.metaText}>{pharmacy.delivery_time}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={14} color={Colors.textLight} />
            <Text style={styles.metaText}>Min ₹{pharmacy.minimum_order}</Text>
          </View>
        </View>

        <View style={styles.addressContainer}>
          <Ionicons name="location-outline" size={12} color={Colors.textLight} />
          <Text style={styles.address} numberOfLines={1}>
            {pharmacy.address}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.surface,
  },
  overlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  openBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  openBadgeText: {
    color: Colors.background,
    fontSize: 10,
    fontWeight: 'bold',
  },
  info: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.background,
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 12,
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 4,
    fontWeight: '500',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  address: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 4,
    flex: 1,
  },
});
