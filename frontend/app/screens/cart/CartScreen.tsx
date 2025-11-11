import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { cartAPI, medicineAPI, addressAPI, profileAPI } from '../../services/api';
import { Cart, Address, Medicine, User } from '../../types';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { QuantitySelector } from '../../components/QuantitySelector';
import { cartEvents } from '../../utils/cartEvents';

export default function CartScreen() {
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Cart | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Reload addresses when screen comes into focus (e.g., after selecting address)
      const reloadAddresses = async () => {
        try {
          const addresses = await addressAPI.getAll();
          const defAddress = addresses.find((addr: Address) => addr.is_default);
          
          // Check if a specific address was selected
          try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const selectedAddressId = await AsyncStorage.getItem('selectedAddressId');
            if (selectedAddressId) {
              const selected = addresses.find((addr: Address) => addr.id === selectedAddressId);
              if (selected) {
                setSelectedAddress(selected);
                setDefaultAddress(selected);
                await AsyncStorage.removeItem('selectedAddressId');
                return;
              }
            }
          } catch (error) {
            // AsyncStorage not available or error
          }
          
          // Default to default address or first address
          const addressToUse = defAddress || addresses[0] || null;
          setDefaultAddress(addressToUse);
          setSelectedAddress(addressToUse);
        } catch (error) {
          // Silently fail
        }
      };
      reloadAddresses();
    }, [])
  );

  const loadCart = async (suppressLoading: boolean = false) => {
    try {
      if (!suppressLoading) setLoading(true);
      const [cartData, addresses, userData] = await Promise.all([
        cartAPI.get(),
        addressAPI.getAll(),
        profileAPI.get(),
      ]);
      
      setCart(cartData);
      setUser(userData);
      
      // Load medicine details for cart items
      if (cartData && cartData.items.length > 0) {
        const medicinePromises = cartData.items.map((item: any) =>
          medicineAPI.getById(item.medicine_id)
        );
        const medicineData = await Promise.all(medicinePromises);
        setMedicines(medicineData);
      }

      // Find default address
      const defAddress = addresses.find((addr: Address) => addr.is_default);
      const addressToUse = defAddress || addresses[0] || null;
      setDefaultAddress(addressToUse);
      setSelectedAddress(addressToUse);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      if (!suppressLoading) setLoading(false);
    }
  };

  const handleRemoveItem = async (medicineId: string) => {
    try {
      await cartAPI.remove(medicineId);
      // Refresh cart without showing full-page loader
      await loadCart(true);
      // Emit event to update cart badge in real-time
      cartEvents.emit();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleUpdateQuantity = async (medicineId: string, newQuantity: number) => {
    try {
      await cartAPI.update(medicineId, newQuantity);
      // Refresh cart data quietly to avoid full-page loader
      await loadCart(true);
      // Emit event to update cart badge in real-time
      cartEvents.emit();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!cart || cart.items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <Header title="Cart" onBack={() => router.back()} />
        <View style={styles.emptyCartContainer}>
          <Ionicons name="bag-outline" size={80} color={Colors.textLight} />
          <Text style={styles.emptyCartText}>Your cart is empty</Text>
          <TouchableOpacity style={styles.shopNowButton} onPress={() => router.push('/home')}>
            <Text style={styles.shopNowButtonText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate actual totals from cart data
  const calculateMRPTotal = () => {
    return cart.items.reduce((total, item, index) => {
      const medicine = medicines[index];
      return total + (medicine?.mrp || item.price) * item.quantity;
    }, 0);
  };

  const mrpTotal = calculateMRPTotal();
  const totalDiscount = mrpTotal - cart.total_amount;
  const handlingCharges = cart.total_amount >= 500 ? 0 : 20; // Free handling for orders above 500
  const deliveryFee = cart.total_amount >= 300 ? 0 : 40; // Free delivery for orders above 300
  const finalTotal = cart.total_amount + handlingCharges + deliveryFee;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Header title="Cart" onBack={() => router.back()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="location" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Delivery Address</Text>
            </View>
            <TouchableOpacity 
              onPress={async () => {
                const result = await router.push('/addresses?select=true');
                // Address selection is handled via focus effect
              }}
            >
              <Text style={styles.changeText}>
                {selectedAddress ? 'Change' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
          {selectedAddress ? (
            <View>
              <View style={styles.addressLabelRow}>
                <View style={styles.addressLabelBadge}>
                  <Ionicons 
                    name={selectedAddress.label.toLowerCase() === 'home' ? 'home' : selectedAddress.label.toLowerCase() === 'office' ? 'business' : 'location'} 
                    size={14} 
                    color={Colors.primary} 
                  />
                  <Text style={styles.addressLabelText}>{selectedAddress.label}</Text>
                </View>
                {selectedAddress.is_default && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={styles.addressText}>
                {selectedAddress.address_line1}
                {selectedAddress.address_line2 && `, ${selectedAddress.address_line2}`}
              </Text>
              <Text style={styles.addressText}>
                {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
              </Text>
              <Text style={styles.addressPhoneText}>Phone: {selectedAddress.phone}</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.addAddressButton}
              onPress={() => router.push('/addresses?select=true')}
            >
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.addAddressText}>Add delivery address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Contact */}
        {user && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="call" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>{user.full_name}</Text>
              </View>
              <Text style={styles.phoneNumber}>{user.phone}</Text>
            </View>
          </View>
        )}

        {/* Product List */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitleLarge}>Cart Items ({cart.items.length})</Text>
          
          {cart.items.map((item, index) => {
            const medicine = medicines[index];
            if (!medicine) return null;
            
            return (
              <View key={item.medicine_id} style={styles.productCard}>
                <View style={styles.productImage}>
                  <View style={styles.productImagePlaceholder}>
                    <Ionicons name="medical" size={40} color={Colors.primary} />
                  </View>
                </View>
                <View style={styles.productDetails}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {medicine.name}
                  </Text>
                  <Text style={styles.productCategory}>{medicine.category}</Text>
                  <Text style={styles.productDescription} numberOfLines={1}>
                    {medicine.description}
                  </Text>
                  
                  <View style={styles.productFooter}>
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceValue}>₹{(item.price * item.quantity).toFixed(2)}</Text>
                      {medicine.mrp > item.price && (
                        <Text style={styles.priceStrike}>₹{(medicine.mrp * item.quantity).toFixed(2)}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.cartItemActions}>
                    <QuantitySelector
                      quantity={item.quantity}
                      maxQuantity={medicine.stock_quantity}
                      onAdd={async () => {}}
                      onIncrease={async () => await handleUpdateQuantity(item.medicine_id, item.quantity + 1)}
                      onDecrease={async () => await handleUpdateQuantity(item.medicine_id, item.quantity - 1)}
                      onUpdateQuantity={async (n: number) => await handleUpdateQuantity(item.medicine_id, n)}
                      onRemove={async () => await handleRemoveItem(item.medicine_id)}
                      size="small"
                    />

                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveItem(item.medicine_id)}
                    >
                      <Ionicons name="trash-outline" size={16} color={Colors.error} />
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Bill Summary */}
        <View style={styles.billSection}>
          <Text style={styles.billTitle}>Bill Summary</Text>
          
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total (MRP)</Text>
            <Text style={styles.billValue}>₹{mrpTotal.toFixed(2)}</Text>
          </View>

          {totalDiscount > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, styles.successText]}>Total Discount</Text>
              <Text style={[styles.billValue, styles.successText]}>-₹{totalDiscount.toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <Text style={styles.billValue}>₹{cart.total_amount.toFixed(2)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Handling Charges</Text>
            <Text style={[styles.billValue, handlingCharges === 0 && styles.successText]}>
              {handlingCharges === 0 ? 'FREE' : `₹${handlingCharges}`}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={[styles.billValue, deliveryFee === 0 && styles.successText]}>
              {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
            </Text>
          </View>

          {deliveryFee === 0 && cart.total_amount < 300 && (
            <Text style={styles.deliveryNote}>
              * Free delivery on orders above ₹300
            </Text>
          )}

          <View style={styles.divider} />

          <View style={styles.billRow}>
            <Text style={styles.billTotal}>Total Amount</Text>
            <Text style={styles.billTotalValue}>₹{finalTotal.toFixed(2)}</Text>
          </View>

          {totalDiscount > 0 && (
            <View style={styles.savingsContainer}>
              <Ionicons name="pricetag" size={16} color={Colors.success} />
              <Text style={styles.savingsText}>
                You saved ₹{totalDiscount.toFixed(2)} on this order!
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        <View style={styles.checkoutSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>₹{finalTotal.toFixed(2)}</Text>
          </View>

          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={() => router.push('/checkout')}
          >
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.background} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  sectionTitleLarge: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  phoneNumber: {
    fontSize: 14,
    color: Colors.textLight,
  },
  changeText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginLeft: 28,
    flexWrap: 'wrap',
  },
  addressLabelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  addressLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 4,
  },
  defaultBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.background,
  },
  addressText: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
    marginLeft: 28,
    marginTop: 4,
  },
  addressPhoneText: {
    fontSize: 14,
    color: Colors.textLight,
    marginLeft: 28,
    marginTop: 4,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 28,
    paddingVertical: 8,
  },
  addAddressText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  productsSection: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  productCard: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  productImage: {
    marginRight: 12,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: Colors.primary,
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceStrike: {
    fontSize: 12,
    color: Colors.textLight,
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  cartItemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeButtonText: {
    fontSize: 14,
    color: Colors.error,
    marginLeft: 4,
    fontWeight: '500',
  },
  billSection: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    marginTop: 8,
  },
  billTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  billLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  billValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  successText: {
    color: Colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  billTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  billTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  deliveryNote: {
    fontSize: 12,
    color: Colors.textLight,
    fontStyle: 'italic',
    marginTop: -8,
    marginBottom: 8,
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '10',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  savingsText: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomBar: {
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  checkoutSection: {
    gap: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  checkoutButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
