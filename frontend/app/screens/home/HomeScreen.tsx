import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { CATEGORIES } from '../../constants/config';
import { pharmacyAPI } from '../../services/api';
import { useCart } from '../../hooks/useCart';
import { Pharmacy, Cart } from '../../types';
import { PharmacyCard } from '../../components/PharmacyCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';

const pharmacyImages = [
  'https://static.vecteezy.com/system/resources/thumbnails/006/138/581/small/pharmacy-store-healthcare-background-free-vector.jpg',
  'https://static.vecteezy.com/system/resources/thumbnails/002/127/148/small/digital-pharmacy-concept-illustration-pharmacy-store-online-pharmacy-can-use-for-homepage-mobile-apps-web-banner-character-cartoon-illustration-flat-style-free-vector.jpg',
  'https://static.vecteezy.com/system/resources/thumbnails/002/172/389/small/pharmacy-store-front-on-city-background-commercial-property-medicine-building-illustration-in-flat-style-vector.jpg',
  'https://static.vecteezy.com/system/resources/thumbnails/001/870/220/small/little-pharmacy-store-building-facade-scene-free-vector.jpg',
];

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const { cart, cartItemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const pharmaciesData = await pharmacyAPI.getAll();

      const pharmaciesWithImages = pharmaciesData.map((pharmacy: Pharmacy, index: number) => ({
        ...pharmacy,
        image: pharmacyImages[index % pharmacyImages.length],
      }));

      setPharmacies(pharmaciesWithImages);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPharmacies = pharmacies.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.homeContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>Hello!</Text>
            <Text style={styles.headerSubtext}>Find medicines near you</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.cartButton} onPress={() => router.push('/cart')}>
              <Ionicons name="bag" size={24} color={Colors.primary} />
              {cartItemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartItemCount > 10 ? '10+' : cartItemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/profile')}>
              <Ionicons name="person" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search medicines, pharmacies..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Banner */}
          <View style={styles.bannerContainer}>
            <View style={styles.banner}>
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>Get medicines delivered</Text>
                <Text style={styles.bannerSubtitle}>Order from nearby pharmacies</Text>
                <View style={styles.bannerBadge}>
                  <Text style={styles.bannerBadgeText}>COD Available</Text>
                </View>
              </View>
              <Ionicons name="medical" size={60} color={Colors.background} />
            </View>
          </View>

          {/* Categories */}
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <FlatList
              data={CATEGORIES}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.name}
              contentContainerStyle={styles.categoriesContainer}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.categoryCard}>
                  <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
                    <Ionicons name={item.icon as any} size={24} color={Colors.background} />
                  </View>
                  <Text style={styles.categoryText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/prescription-upload')}
            >
              <Ionicons name="document-text" size={32} color={Colors.primary} />
              <Text style={styles.actionText}>Upload Prescription</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/orders')}>
              <Ionicons name="receipt" size={32} color={Colors.primary} />
              <Text style={styles.actionText}>My Orders</Text>
            </TouchableOpacity>
          </View>

          {/* Pharmacies */}
          <View style={styles.pharmaciesSection}>
            <Text style={styles.sectionTitle}>Nearby Pharmacies</Text>
            {filteredPharmacies.map((pharmacy) => (
              <PharmacyCard
                key={pharmacy.id}
                pharmacy={pharmacy}
                onPress={() => router.push(`/pharmacy/${pharmacy.id}`)}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  homeContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerGreeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  scrollContent: {
    flex: 1,
  },
  bannerContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  banner: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.background,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: Colors.background,
    opacity: 0.9,
    marginBottom: 12,
  },
  bannerBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  bannerBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  categoriesSection: {
    marginBottom: 24,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionText: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  pharmaciesSection: {
    paddingBottom: 24,
  },
});
