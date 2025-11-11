import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { orderAPI } from '../../services/api';
import { Order } from '../../types';
import { Colors } from '../../constants/Colors';
import { ORDER_STATUSES } from '../../constants/config';
import { Header } from '../../components/Header';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await orderAPI.getById(id as string);
      setOrder(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!order) return null;

  const statusInfo = ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES] || {
    color: Colors.textLight,
    label: order.status,
  };

  const getTrackingSteps = () => {
    const steps = [
      { key: 'placed', label: 'Order Placed', icon: 'checkmark-circle' },
      { key: 'confirmed', label: 'Confirmed', icon: 'checkmark-done-circle' },
      { key: 'preparing', label: 'Preparing', icon: 'cube' },
      { key: 'out_for_delivery', label: 'Out for Delivery', icon: 'bicycle' },
      { key: 'delivered', label: 'Delivered', icon: 'home' },
    ];

    const currentIndex = steps.findIndex((s) => s.key === order.status);
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }));
  };

  const trackingSteps = getTrackingSteps();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Header title="Order Details" onBack={() => router.back()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <Text style={styles.orderID}>Order #{order.id.slice(0, 8)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Text style={styles.statusText}>{statusInfo.label.toUpperCase()}</Text>
          </View>
        </View>

        {/* Order Tracking */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Tracking</Text>
          <View style={styles.trackingContainer}>
            {trackingSteps.map((step, index) => (
              <View key={step.key} style={styles.trackingStep}>
                <View style={styles.trackingIconContainer}>
                  <View
                    style={[
                      styles.trackingIcon,
                      step.completed && styles.trackingIconCompleted,
                      step.active && styles.trackingIconActive,
                    ]}
                  >
                    <Ionicons
                      name={step.icon as any}
                      size={24}
                      color={step.completed ? Colors.background : Colors.textLight}
                    />
                  </View>
                  {index < trackingSteps.length - 1 && (
                    <View
                      style={[styles.trackingLine, step.completed && styles.trackingLineCompleted]}
                    />
                  )}
                </View>
                <View style={styles.trackingInfo}>
                  <Text
                    style={[
                      styles.trackingLabel,
                      step.active && styles.trackingLabelActive,
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>Medicine {index + 1}</Text>
                <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalAmount}>₹{order.total_amount}</Text>
          </View>
        </View>

        {/* Delivery Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={20} color={Colors.textLight} />
            <Text style={styles.detailText}>{order.delivery_address}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="call" size={20} color={Colors.textLight} />
            <Text style={styles.detailText}>{order.phone}</Text>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={styles.detailRow}>
            <Ionicons name="cash" size={20} color={Colors.textLight} />
            <Text style={styles.detailText}>Cash on Delivery (COD)</Text>
          </View>
        </View>

        {/* Order Date */}
        <View style={styles.section}>
          <Text style={styles.orderDate}>
            Ordered on {new Date(order.created_at).toLocaleString()}
          </Text>
        </View>
      </ScrollView>
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  orderID: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.background,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  trackingContainer: {
    paddingLeft: 8,
  },
  trackingStep: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  trackingIconContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  trackingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  trackingIconCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  trackingIconActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  trackingLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginTop: 4,
  },
  trackingLineCompleted: {
    backgroundColor: Colors.success,
  },
  trackingInfo: {
    flex: 1,
    paddingTop: 12,
  },
  trackingLabel: {
    fontSize: 16,
    color: Colors.textLight,
  },
  trackingLabelActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: Colors.textLight,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
    flex: 1,
  },
  orderDate: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
});
