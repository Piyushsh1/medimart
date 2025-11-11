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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { profileAPI, clearAuthToken } from '../../services/api';
import { User } from '../../types';
import { Colors } from '../../constants/Colors';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userData = await profileAPI.get();
      setUser(userData);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          clearAuthToken();
          router.replace('/');
        },
      },
    ]);
  };

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  const menuItems = [
    { icon: 'bag-outline', label: 'My orders', route: '/orders' },
    { icon: 'location-outline', label: 'My Addresses', route: '/addresses' },
    { icon: 'medkit-outline', label: 'My consultations', route: '/consultations' },
    { icon: 'time-outline', label: 'Previously ordered items', route: '/orders' },
    { icon: 'document-text-outline', label: 'Health Records & Insights', badge: 'Beta', route: '/orders' },
    { icon: 'star-outline', label: 'Rate your recent purchases', route: '/orders' },
    { icon: 'card-outline', label: 'Manage payment methods', route: '/orders' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hey there!</Text>
            <Text style={styles.phone}>{user.full_name}</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={() => router.push('/edit-profile')}>
            <Text style={styles.editButtonText}>Edit profile</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        

        {/* QR Scanner Banner */}
        <TouchableOpacity style={styles.qrBanner}>
          <View style={styles.qrBannerContent}>
            <Text style={styles.qrBannerTitle}>Scan QR on your medicines,</Text>
            <Text style={styles.qrBannerTitle}>to check their authenticity</Text>
            <TouchableOpacity style={styles.scanButton}>
              <Text style={styles.scanButtonText}>Scan now →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.qrBannerImage}>
            <Ionicons name="qr-code" size={60} color={Colors.primary} />
          </View>
          <View style={styles.qrBannerBadge}>
            <Text style={styles.qrBannerBadgeText}>100% SAWAAL
JAWAAB</Text>
          </View>
        </TouchableOpacity>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={24} color={Colors.text} />
                <Text style={styles.menuItemText}>{item.label}</Text>
              </View>
              <View style={styles.menuItemRight}>
                {item.badge && (
                  <View style={styles.betaBadge}>
                    <Text style={styles.betaBadgeText}>{item.badge}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={Colors.primary} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 80 }} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: Colors.textLight,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    marginRight: 4,
  },
  
  qrBanner: {
    backgroundColor: '#FFE4E4',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
  },
  qrBannerContent: {
    flex: 1,
  },
  qrBannerTitle: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  scanButton: {
    backgroundColor: Colors.text,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  scanButtonText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  qrBannerImage: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  qrBannerBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  qrBannerBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
  },
  menuSection: {
    backgroundColor: Colors.background,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 16,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  betaBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  betaBadgeText: {
    fontSize: 10,
    color: '#1976D2',
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  logoutText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 12,
  },
});
