import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { orderAPI } from '../../services/api';
import { Order } from '../../types';
import { Colors } from '../../constants/Colors';
import { ORDER_STATUSES } from '../../constants/config';
import { Header } from '../../components/Header';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export default function OrdersScreen() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderAPI.getAll();
      setOrders(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    return ORDER_STATUSES[status as keyof typeof ORDER_STATUSES]?.color || Colors.textLight;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Header title="My Orders" onBack={() => router.back()} />

      <ScrollView style={styles.ordersContent} showsVerticalScrollIndicator={false}>
        {orders.length > 0 ? (
          orders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => router.push(`/order/${order.id}`)}
            >
              <View style={styles.orderHeader}>
                <Text style={styles.orderID}>Order #{order.id.slice(0, 8)}</Text>
                <View style={[styles.orderStatus, { backgroundColor: getStatusColor(order.status) }]}>
                  <Text style={styles.orderStatusText}>{order.status.toUpperCase()}</Text>
                </View>
              </View>

              <Text style={styles.orderDate}>Ordered on {new Date(order.created_at).toLocaleDateString()}</Text>

              <Text style={styles.orderAmount}>Total: ₹{order.total_amount}</Text>
              <Text style={styles.orderItems}>{order.items.length} items</Text>

              <Text style={styles.orderAddress}>📍 {order.delivery_address}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyOrdersContainer}>
            <Ionicons name="receipt-outline" size={80} color={Colors.textLight} />
            <Text style={styles.emptyOrdersText}>No orders yet</Text>
            <TouchableOpacity style={styles.shopNowButton} onPress={() => router.push('/home')}>
              <Text style={styles.shopNowButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  ordersContent: {
    flex: 1,
    paddingTop: 16,
  },
  orderCard: {
    backgroundColor: Colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderID: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  orderStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.background,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 8,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  orderItems: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 8,
  },
  orderAddress: {
    fontSize: 12,
    color: Colors.textLight,
  },
  emptyOrdersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyOrdersText: {
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
