import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { CATEGORIES } from '../../constants/config';
import { pharmacyAPI } from '../../services/api';
import locationService from '../../services/locationService';
import { useCart } from '../../hooks/useCart';
import { Pharmacy } from '../../types';
import { PharmacyCard } from '../../components/PharmacyCard';

const pharmacyImages = [
  'https://static.vecteezy.com/system/resources/thumbnails/006/138/581/small/pharmacy-store-healthcare-background-free-vector.jpg',
  'https://static.vecteezy.com/system/resources/thumbnails/002/127/148/small/digital-pharmacy-concept-illustration-pharmacy-store-online-pharmacy-can-use-for-homepage-mobile-apps-web-banner-character-cartoon-illustration-flat-style-free-vector.jpg',
  'https://static.vecteezy.com/system/resources/thumbnails/002/172/389/small/pharmacy-store-front-on-city-background-commercial-property-medicine-building-illustration-in-flat-style-vector.jpg',
  'https://static.vecteezy.com/system/resources/thumbnails/001/870/220/small/little-pharmacy-store-building-facade-scene-free-vector.jpg',
];

export default function HomeScreenNew() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const { cart, cartItemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    city?: string;
  } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await fetchLocation();
      await loadPharmacies();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocation = async () => {
    try {
      setLocationLoading(true);
      const location = await locationService.getCurrentLocation();
      
      if (location) {
        const addressComponents = await locationService.reverseGeocode(location);
        setCurrentLocation({
          ...location,
          city: addressComponents?.city || 'Your Location',
        });
      }
    } catch (error) {
      console.error('Error fetching location:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  const loadPharmacies = async () => {
    try {
      let pharmaciesData: Pharmacy[] = [];
      
      if (currentLocation) {
        // Fetch pharmacies with location filtering
        pharmaciesData = await pharmacyAPI.getAll({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          radius: 10,
        });
      } else {
        pharmaciesData = await pharmacyAPI.getAll();
      }

      const pharmaciesWithImages = pharmaciesData.map((pharmacy: Pharmacy, index: number) => ({
        ...pharmacy,
        image: pharmacy.image || pharmacyImages[index % pharmacyImages.length],
      }));

      setPharmacies(pharmaciesWithImages);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [currentLocation]);

  const filteredPharmacies = pharmacies.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.homeContainer}>
        {/* Header with Location */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.locationContainer}>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={18} color={Colors.primary} />
                <Text style={styles.locationLabel}>Deliver to</Text>
              </View>
              <TouchableOpacity
                style={styles.locationValueContainer}
                onPress={fetchLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color={Colors.text} />
                ) : (
                  <>
                    <Text style={styles.locationValue} numberOfLines={1}>
                      {currentLocation?.city || 'Select Location'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={Colors.text} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.cartButton}
              onPress={() => router.push('/cart')}
              data-testid="cart-button"
            >
              <Ionicons name="bag-outline" size={24} color={Colors.text} />
              {cartItemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {cartItemCount > 10 ? '10+' : cartItemCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push('/profile')}
              data-testid="profile-button"
            >
              <Ionicons name="person-outline" size={24} color={Colors.text} />
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
            data-testid="search-input"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textLight} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
        >
          {/* Hero Banner */}
          <View style={styles.bannerContainer}>
            <LinearGradient
              colors={[Colors.gradient1, Colors.gradient2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.banner}
            >
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>Order medicines{'\n'}at your doorstep</Text>
                <Text style={styles.bannerSubtitle}>
                  Get medicines delivered from nearby pharmacies
                </Text>
                <View style={styles.bannerBadges}>
                  <View style={styles.bannerBadge}>
                    <Ionicons name="flash" size={14} color={Colors.primary} />
                    <Text style={styles.bannerBadgeText}>Fast Delivery</Text>
                  </View>
                  <View style={[styles.bannerBadge, { marginLeft: 8 }]}>
                    <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
                    <Text style={styles.bannerBadgeText}>Verified</Text>
                  </View>
                </View>
              </View>
              <View style={styles.bannerIcon}>
                <Ionicons name="medical" size={80} color="rgba(255,255,255,0.3)" />
              </View>
            </LinearGradient>
          </View>

          {/* Categories */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={CATEGORIES}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.name}
              contentContainerStyle={styles.categoriesContainer}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.categoryCard} data-testid={`category-${item.name}`}>
                  <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
                    <Ionicons name={item.icon as any} size={28} color={Colors.background} />
                  </View>
                  <Text style={styles.categoryText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/prescription-upload')}
                data-testid="upload-prescription-button"
              >
                <View style={[styles.actionIconContainer, { backgroundColor: Colors.blue + '15' }]}>
                  <Ionicons name="document-text-outline" size={28} color={Colors.blue} />
                </View>
                <Text style={styles.actionText}>Upload{'\n'}Prescription</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/orders')}
                data-testid="my-orders-button"
              >
                <View style={[styles.actionIconContainer, { backgroundColor: Colors.purple + '15' }]}>
                  <Ionicons name="receipt-outline" size={28} color={Colors.purple} />
                </View>
                <Text style={styles.actionText}>My{'\n'}Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/lab-tests')}
                data-testid="lab-tests-button"
              >
                <View style={[styles.actionIconContainer, { backgroundColor: Colors.teal + '15' }]}>
                  <Ionicons name="flask-outline" size={28} color={Colors.teal} />
                </View>
                <Text style={styles.actionText}>Lab{'\n'}Tests</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/consultations')}
                data-testid="consultations-button"
              >
                <View style={[styles.actionIconContainer, { backgroundColor: Colors.orange + '15' }]}>
                  <Ionicons name="videocam-outline" size={28} color={Colors.orange} />
                </View>
                <Text style={styles.actionText}>Doctor{'\n'}Consult</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Nearby Pharmacies */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  {currentLocation ? 'Nearby Pharmacies' : 'Pharmacies'}
                </Text>
                {currentLocation && (
                  <Text style={styles.sectionSubtitle}>Based on your location</Text>
                )}
              </View>
              {filteredPharmacies.length > 3 && (
                <TouchableOpacity>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.pharmaciesContainer}>
              {filteredPharmacies.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="business-outline" size={60} color={Colors.textLight} />
                  <Text style={styles.emptyText}>No pharmacies found</Text>
                  <Text style={styles.emptySubtext}>Try adjusting your search or location</Text>
                </View>
              ) : (
                filteredPharmacies.map((pharmacy) => (
                  <PharmacyCard
                    key={pharmacy.id}
                    pharmacy={pharmacy}
                    onPress={() => router.push(`/pharmacy/${pharmacy.id}`)}
                    showDistance={!!currentLocation}
                  />
                ))
              )}
            </View>
          </View>

          <View style={{ height: 40 }} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  homeContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background,
  },
  headerLeft: {
    flex: 1,
  },
  locationContainer: {
    flexDirection: 'column',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 4,
    fontWeight: '500',
  },
  locationValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginRight: 4,
    maxWidth: 180,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  cartBadgeText: {
    color: Colors.background,
    fontSize: 11,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  scrollContent: {
    flex: 1,
  },
  bannerContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  banner: {
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.background,
    marginBottom: 8,
    lineHeight: 28,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: Colors.background,
    opacity: 0.95,
    marginBottom: 16,
    lineHeight: 18,
  },
  bannerBadges: {
    flexDirection: 'row',
  },
  bannerBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerBadgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  bannerIcon: {
    marginLeft: 8,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 2,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 20,
    width: 75,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  quickActionsSection: {
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 11,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 15,
  },
  pharmaciesContainer: {
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 6,
    textAlign: 'center',
  },
});
