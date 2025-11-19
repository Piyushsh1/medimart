import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { orderAPI, paymentAPI, cartAPI, addressAPI, profileAPI } from '../../services/api';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';

// Conditionally import RazorpayCheckout only on native platforms
let RazorpayCheckout: any = null;
if (Platform.OS !== 'web') {
  try {
    RazorpayCheckout = require('react-native-razorpay');
  } catch (e) {
    console.warn('Razorpay not available on this platform');
  }
}

type PaymentMethod = 'cod' | 'razorpay';

export default function CheckoutScreen() {
  const [selectedAddress, setSelectedAddress] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cod');
  const [cartTotal, setCartTotal] = useState(0);
  const [userPhone, setUserPhone] = useState('');

  useEffect(() => {
    loadCart();
    loadAddresses();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const reloadAddresses = async () => {
        await loadAddresses();
      };
      reloadAddresses();
    }, [])
  );

  const loadCart = async () => {
    try {
      const cart = await cartAPI.get();
      if (cart) {
        setCartTotal(cart.total_amount);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  // Charges identical to CartScreen
  const handlingCharges = cartTotal >= 500 ? 0 : 20;
  const deliveryFee = cartTotal >= 300 ? 0 : 40;
  const finalTotal = cartTotal + handlingCharges + deliveryFee;

  const loadAddresses = async () => {
    try {
      const [addresses, profile] = await Promise.all([
        addressAPI.getAll(),
        profileAPI.get().catch(() => null),
      ]);

      if (profile && profile.phone) setUserPhone(profile.phone);

      // Check for address selected via AddressScreen
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const selectedAddressId = await AsyncStorage.getItem('selectedAddressId');
        if (selectedAddressId) {
          const selected = addresses.find((a: any) => a.id === selectedAddressId);
          if (selected) {
            setSelectedAddress(selected);
            await AsyncStorage.removeItem('selectedAddressId');
            return;
          }
        }
      } catch (e) {}

      // Default address or first
      const def = addresses.find((a: any) => a.is_default);
      setSelectedAddress(def || addresses[0] || null);
    } catch (error) {
      // ignore address load failure in checkout
    }
  };

  const handlePlaceOrder = async () => {
    // Validation
    if (!selectedAddress) {
      Alert.alert('Select Address', 'Please select a delivery address');
      return;
    }

    const constructedAddress = `${selectedAddress.address_line1}${selectedAddress.address_line2 ? ', ' + selectedAddress.address_line2 : ''}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}`;
    const phoneToUse = (selectedAddress.phone || userPhone || '').trim();
    if (!phoneToUse) {
      Alert.alert('Validation Error', 'Please add a phone number to your address');
      return;
    }
    if (!/^[6-9][0-9]{9}$/.test(phoneToUse)) {
      Alert.alert('Validation Error', 'Please use a valid 10-digit phone number starting with 6-9');
      return;
    }

    setLoading(true);
    try {
      if (selectedPaymentMethod === 'cod') {
        await handleCODOrder(constructedAddress, phoneToUse);
      } else {
        await handleOnlinePayment(constructedAddress, phoneToUse);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handleCODOrder = async (deliveryAddress: string, deliveryPhone: string) => {
    try {
      await orderAPI.create(deliveryAddress, deliveryPhone, 'cod');
      Alert.alert('Success', 'Order placed successfully!', [
        {
          text: 'OK',
          onPress: () => router.replace('/orders'),
        },
      ]);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to place COD order');
    }
  };

  const handleOnlinePayment = async (deliveryAddress: string, deliveryPhone: string) => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Info', 'Online payment is available on mobile app only. Please use COD for web checkout.');
        return;
      }

      if (!RazorpayCheckout) {
        Alert.alert('Error', 'Payment service not available on this platform');
        return;
      }

      // Create order first
      const order = await orderAPI.create(deliveryAddress, deliveryPhone, 'razorpay');
      
      // Create Razorpay order
      const razorpayOrder = await paymentAPI.createRazorpayOrder(order.id);
      
      // Open Razorpay checkout
      const options = {
        description: 'MediMart Order Payment',
        image: 'https://i.imgur.com/3g7nmJC.png',
        currency: razorpayOrder.currency,
        key: razorpayOrder.key_id,
        amount: razorpayOrder.amount,
        name: 'MediMart',
        order_id: razorpayOrder.order_id,
        prefill: {
          contact: deliveryPhone,
          name: 'Customer',
        },
        theme: { color: Colors.primary },
      };

      RazorpayCheckout.open(options)
        .then(async (data: any) => {
          // Payment successful, verify it
          await handlePaymentSuccess(data, order.id);
        })
        .catch((error: any) => {
          // Payment failed or cancelled
          Alert.alert('Payment Failed', error.description || 'Payment was cancelled');
        });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to initiate payment');
    }
  };

  const handlePaymentSuccess = async (paymentData: any, orderId: string) => {
    try {
      setLoading(true);
      
      // Verify payment with backend
      await paymentAPI.verifyPayment({
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
        order_id: orderId,
      });
      
      Alert.alert('Success', 'Payment successful! Order placed.', [
        {
          text: 'OK',
          onPress: () => router.replace('/orders'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', 'Payment verification failed. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex1}>
        <Header title="Checkout" onBack={() => router.back()} />

        <ScrollView style={styles.checkoutContent} showsVerticalScrollIndicator={false}>
          {/* Delivery Details */}
          <View style={styles.checkoutSection}>
            <Text style={styles.checkoutSectionTitle}>Delivery Details</Text>

            <View style={styles.addressHeaderRow}>
              <View style={styles.addressHeaderLeft}>
                <Ionicons name="location" size={20} color={Colors.primary} />
                <Text style={styles.addressHeaderTitle}>Delivery Address</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/addresses?select=true')}>
                <Text style={styles.changeText}>{selectedAddress ? 'Change' : 'Add'}</Text>
              </TouchableOpacity>
            </View>

            {selectedAddress ? (
              <View>
                <View style={styles.addressLabelRow}>
                  <View style={styles.addressLabelBadge}>
                    <Ionicons
                      name={selectedAddress.label?.toLowerCase() === 'home' ? 'home' : selectedAddress.label?.toLowerCase() === 'office' ? 'business' : 'location'}
                      size={14}
                      color={Colors.primary}
                    />
                    <Text style={styles.addressLabelText}>{selectedAddress.label || 'Address'}</Text>
                  </View>
                  {selectedAddress.is_default && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.addressText}>
                  {selectedAddress.address_line1}
                  {selectedAddress.address_line2 ? `, ${selectedAddress.address_line2}` : ''}
                </Text>
                <Text style={styles.addressText}>
                  {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                </Text>
                <Text style={styles.addressPhoneText}>Phone: {selectedAddress.phone || userPhone}</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.addAddressButton} onPress={() => router.push('/addresses?select=true')}>
                <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                <Text style={styles.addAddressText}>Add delivery address</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Payment Method */}
          <View style={styles.checkoutSection}>
            <Text style={styles.checkoutSectionTitle}>Payment Method</Text>
            
            {/* Cash on Delivery */}
            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPaymentMethod === 'cod' && styles.paymentOptionSelected,
              ]}
              onPress={() => setSelectedPaymentMethod('cod')}
            >
              <View style={styles.paymentOptionLeft}>
                <Ionicons name="cash" size={24} color={Colors.success} />
                <View style={styles.paymentOptionTextContainer}>
                  <Text style={styles.paymentOptionText}>Cash on Delivery</Text>
                  <Text style={styles.paymentOptionSubtext}>Pay when you receive</Text>
                </View>
              </View>
              {selectedPaymentMethod === 'cod' && (
                <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
              )}
            </TouchableOpacity>

            {/* Online Payment */}
            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPaymentMethod === 'razorpay' && styles.paymentOptionSelected,
              ]}
              onPress={() => setSelectedPaymentMethod('razorpay')}
            >
              <View style={styles.paymentOptionLeft}>
                <Ionicons name="card" size={24} color={Colors.primary} />
                <View style={styles.paymentOptionTextContainer}>
                  <Text style={styles.paymentOptionText}>Pay Online</Text>
                  <Text style={styles.paymentOptionSubtext}>UPI, Cards, Wallets & More</Text>
                </View>
              </View>
              {selectedPaymentMethod === 'razorpay' && (
                <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
              )}
            </TouchableOpacity>

            {/* Payment Icons */}
            {selectedPaymentMethod === 'razorpay' && (
              <View style={styles.paymentIconsContainer}>
                <View style={styles.paymentIconBadge}>
                  <Ionicons name="logo-google" size={16} color={Colors.primary} />
                  <Text style={styles.paymentIconText}>UPI</Text>
                </View>
                <View style={styles.paymentIconBadge}>
                  <Ionicons name="card" size={16} color={Colors.primary} />
                  <Text style={styles.paymentIconText}>Cards</Text>
                </View>
                <View style={styles.paymentIconBadge}>
                  <Ionicons name="wallet" size={16} color={Colors.primary} />
                  <Text style={styles.paymentIconText}>Wallets</Text>
                </View>
              </View>
            )}
          </View>

          {/* Order Summary */}
          <View style={styles.checkoutSection}>
            <Text style={styles.checkoutSectionTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{cartTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Handling Charges</Text>
              <Text style={[styles.summaryValue, handlingCharges === 0 && styles.successText]}>
                {handlingCharges === 0 ? 'FREE' : `₹${handlingCharges}`}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={[styles.summaryValue, deliveryFee === 0 && styles.successText]}>
                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotal}>Total Amount</Text>
              <Text style={styles.summaryTotalValue}>₹{finalTotal.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.checkoutFooter}>
          <TouchableOpacity
            style={[styles.placeOrderButton, loading && styles.disabledButton]}
            onPress={handlePlaceOrder}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <Text style={styles.placeOrderButtonText}>Place Order</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  checkoutContent: {
    flex: 1,
    paddingTop: 16,
  },
  checkoutSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  checkoutSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  changeText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
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
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  paymentOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentOptionTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  paymentOptionText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
  },
  paymentOptionSubtext: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  paymentIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
    marginTop: 8,
    paddingLeft: 4,
  },
  paymentIconBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  paymentIconText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.textLight,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  successText: {
    color: Colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  checkoutFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  placeOrderButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeOrderButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
