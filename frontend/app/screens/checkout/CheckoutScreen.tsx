import React, { useState } from 'react';
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
import { orderAPI, cartAPI } from '../../services/api';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';

export default function CheckoutScreen() {
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    if (!deliveryAddress || !deliveryPhone) {
      Alert.alert('Error', 'Please fill delivery address and phone');
      return;
    }

    setLoading(true);
    try {
      await orderAPI.create(deliveryAddress, deliveryPhone);
      Alert.alert('Success', 'Order placed successfully!', [
        {
          text: 'OK',
          onPress: () => router.replace('/orders'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
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
            <View style={styles.paymentOption}>
              <Ionicons name="cash" size={24} color={Colors.success} />
              <Text style={styles.paymentOptionText}>Cash on Delivery (COD)</Text>
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
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  paymentOptionText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
    fontWeight: '500',
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
