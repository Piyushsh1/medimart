import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { pharmacyAPI, medicineAPI, cartAPI, getAuthToken } from '../../services/api';
import { Pharmacy, Medicine } from '../../types';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { MedicineCard } from '../../components/MedicineCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Ionicons } from '@expo/vector-icons';
import { cartEvents } from '../../utils/cartEvents';

export default function PharmacyDetailScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<any>(null);
  const [cartLoading, setCartLoading] = useState(false);

  // Update only cart data without refreshing the whole page
  const updateCartData = useCallback(async () => {
    if (!getAuthToken()) {
      setCart(null);
      return;
    }
    
    try {
      setCartLoading(true);
      const cartData = await cartAPI.get();
      // Always update cart state with fresh data from server
      // Note: cartData can be null if cart is empty, which is valid
      setCart(cartData);
    } catch (error: any) {
      // On error, don't reset cart state - preserve what we have
      // This prevents losing cart state on temporary network issues
      console.error('Error updating cart:', error);
      // Only clear cart if it's an auth error (401 Unauthorized)
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        setCart(null);
      }
      // Otherwise, preserve existing cart state
    } finally {
      setCartLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [id]);

  // Listen to cart events for real-time updates
  useEffect(() => {
    const unsubscribe = cartEvents.subscribe(() => {
      updateCartData();
    });
    return unsubscribe;
  }, [updateCartData]);

  // Reload cart when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Reload cart data when screen comes into focus to ensure it's up to date
      const reloadCart = async () => {
        if (!getAuthToken()) {
          // If not logged in, clear cart state
          setCart(null);
          return;
        }
        try {
          const cartData = await cartAPI.get();
          // Always update cart state with fresh data from server
          // Note: cartData can be null if cart is empty, which is valid
          setCart(cartData);
        } catch (error: any) {
          // On error, preserve previous cart state - don't reset to null
          // This prevents losing cart state on network errors
          console.error('Error reloading cart on focus:', error);
          // Only clear cart if we're sure the user is not authenticated
          const errorMessage = error?.message || String(error);
          if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
            setCart(null);
          }
          // Otherwise, preserve existing cart state - don't update
        }
      };
      reloadCart();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      setMedicines([]);
      
      // Load pharmacy, medicines, and cart in parallel
      // Don't let cart failure block page rendering
      const loadPromises: Promise<any>[] = [
        pharmacyAPI.getById(id as string),
        pharmacyAPI.getMedicines(id as string),
      ];

      // Add cart loading if user is authenticated
      if (getAuthToken()) {
        loadPromises.push(
          cartAPI.get().catch((error: any) => {
            // Log error but don't throw - we'll handle it below
            console.error('Error loading cart in loadData:', error);
            return { error, isError: true };
          })
        );
      }

      const results = await Promise.all(loadPromises);
      const pharmacyData = results[0];
      const medicinesData = results[1];
      // cartResult will be undefined if user is not authenticated
      const cartResult = getAuthToken() ? results[2] : undefined;

      // Set pharmacy and medicines
      setPharmacy(pharmacyData);
      setMedicines(medicinesData);
      
      // Handle cart result
      if (getAuthToken() && cartResult !== undefined) {
        if (cartResult && cartResult.isError) {
          // Cart load failed - check if it's an auth error
          const errorMessage = cartResult.error?.message || String(cartResult.error);
          if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
            setCart(null);
          }
          // Otherwise, don't update cart state (preserve if exists, or leave as null)
        } else {
          // Cart loaded successfully (cartResult can be null for empty cart, or a cart object)
          setCart(cartResult);
        }
      } else if (!getAuthToken()) {
        setCart(null);
      }
      // If cartResult is undefined but user is authenticated, don't update cart state
    } catch (error: any) {
      Alert.alert('Error', error.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  // Create a memoized map of medicine quantities for efficient lookup
  const medicineQuantities = useMemo(() => {
    const quantities: Record<string, number> = {};
    if (cart && cart.items && Array.isArray(cart.items)) {
      // Only use cart if it's from the same pharmacy
      if (!cart.pharmacy_id || !id || String(cart.pharmacy_id) === String(id)) {
        cart.items.forEach((item: any) => {
          if (item.medicine_id && item.quantity) {
            quantities[String(item.medicine_id)] = item.quantity;
          }
        });
      }
    }
    return quantities;
  }, [cart, id]);

  const getItemQuantity = (medicineId: string): number => {
    return medicineQuantities[String(medicineId)] || 0;
  };

  const handleAddToCart = async (medicineId: string) => {
    if (!getAuthToken()) {
      Alert.alert('Login required', 'Please login to add items to cart.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/login') },
      ]);
      return;
    }
    try {
      await cartAPI.add(medicineId, 1);
      await updateCartData();
      // Emit event to update cart badge in real-time
      cartEvents.emit();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleUpdateQuantity = async (medicineId: string, newQuantity: number) => {
    try {
      await cartAPI.update(medicineId, newQuantity);
      await updateCartData();
      // Emit event to update cart badge in real-time
      cartEvents.emit();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!pharmacy) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Header title={pharmacy.name} onBack={() => router.back()} />

      {/* Pharmacy Info */}
      <View style={styles.pharmacyInfoCard}>
        <Image source={{ uri: pharmacy.image }} style={styles.pharmacyInfoImage} />
        <View style={styles.pharmacyInfoDetails}>
          <View style={styles.pharmacyInfoHeader}>
            <Text style={styles.pharmacyInfoName}>{pharmacy.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color={Colors.warning} />
              <Text style={styles.rating}>{pharmacy.rating}</Text>
            </View>
          </View>
          <Text style={styles.pharmacyInfoDescription}>{pharmacy.description}</Text>
          <View style={styles.pharmacyInfoMeta}>
            <Text style={styles.pharmacyInfoMetaText}>⏱ {pharmacy.delivery_time}</Text>
            <Text style={styles.pharmacyInfoMetaText}>💰 Min ₹{pharmacy.minimum_order}</Text>
          </View>
        </View>
      </View>

      {/* Medicines */}
      <ScrollView style={styles.medicinesContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Available Medicines</Text>
        {medicines.map((medicine) => (
          <MedicineCard
            key={medicine.id}
            medicine={medicine}
            quantity={getItemQuantity(medicine.id)}
            onAddToCart={async () => await handleAddToCart(medicine.id)}
            onUpdateQuantity={async (newQuantity) => await handleUpdateQuantity(medicine.id, newQuantity)}
            onPress={() => router.push(`/medicine/${medicine.id}`)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  pharmacyInfoCard: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pharmacyInfoImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  pharmacyInfoDetails: {
    flex: 1,
  },
  pharmacyInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pharmacyInfoName: {
    fontSize: 16,
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
  pharmacyInfoDescription: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 8,
  },
  pharmacyInfoMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  pharmacyInfoMetaText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  medicinesContainer: {
    flex: 1,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
});
