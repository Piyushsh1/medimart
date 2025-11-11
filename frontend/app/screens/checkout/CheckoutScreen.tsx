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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { orderAPI, paymentAPI, cartAPI } from '../../services/api';
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
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cod');
  const [cartTotal, setCartTotal] = useState(0);

  useEffect(() => {
    loadCart();
  }, []);

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

  const handlePlaceOrder = async () => {
    // Validation
    if (!deliveryAddress.trim()) {
      Alert.alert('Validation Error', 'Please enter delivery address');
      return;
    }

    if (deliveryAddress.trim().length < 10) {
      Alert.alert('Validation Error', 'Please enter a complete delivery address');
      return;
    }

    if (!deliveryPhone.trim()) {
      Alert.alert('Validation Error', 'Please enter phone number');
      return;
    }

    // Validate phone number (Indian format: 10 digits starting with 6-9)
    if (!/^[6-9][0-9]{9}$/.test(deliveryPhone)) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit phone number starting with 6-9');
      return;
    }

    setLoading(true);
    try {
      if (selectedPaymentMethod === 'cod') {
        await handleCODOrder();
      } else {
        await handleOnlinePayment();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handleCODOrder = async () => {
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

  const handleOnlinePayment = async () => {
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

            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Delivery Address"
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                multiline
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={deliveryPhone}
                onChangeText={setDeliveryPhone}
                keyboardType="phone-pad"
              />
            </View>
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
              <Text style={styles.summaryLabel}>Total Amount</Text>
              <Text style={styles.summaryValue}>₹{cartTotal.toFixed(2)}</Text>
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
