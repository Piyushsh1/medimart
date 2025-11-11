import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { medicineAPI, cartAPI, getAuthToken } from '../../services/api';
import { Medicine, Review } from '../../types';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { QuantitySelector } from '../../components/QuantitySelector';
import { cartEvents } from '../../utils/cartEvents';

export default function MedicineDetailScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [alternatives, setAlternatives] = useState<Medicine[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cart, setCart] = useState<any>(null);
  const [quantity, setQuantity] = useState(0);

  // Update only cart data without refreshing the whole page
  const updateCartData = useCallback(async () => {
    if (!getAuthToken()) {
      setCart(null);
      setQuantity(0);
      return;
    }
    
    try {
      const cartData = await cartAPI.get();
      // Always update cart state with fresh data from server
      // Note: cartData can be null if cart is empty, which is valid
      setCart(cartData);
      
      // Update quantity for current medicine
      if (cartData && cartData.items) {
        const item = cartData.items.find((item: any) => item.medicine_id === id);
        setQuantity(item ? item.quantity : 0);
      } else {
        setQuantity(0);
      }
    } catch (error: any) {
      // On error, don't reset cart state - preserve what we have
      // This prevents losing cart state on temporary network issues
      console.error('Error updating cart:', error);
      // Only clear cart if it's an auth error (401 Unauthorized)
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        setCart(null);
        setQuantity(0);
      }
      // Otherwise, preserve existing cart state
    }
  }, [id]);

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
          setQuantity(0);
          return;
        }
        try {
          const cartData = await cartAPI.get();
          // Always update cart state with fresh data from server
          // Note: cartData can be null if cart is empty, which is valid
          setCart(cartData);
          
          // Update quantity for current medicine
          if (cartData && cartData.items) {
            const item = cartData.items.find((item: any) => item.medicine_id === id);
            setQuantity(item ? item.quantity : 0);
          } else {
            setQuantity(0);
          }
        } catch (error: any) {
          // On error, preserve previous cart state - don't reset to null
          // This prevents losing cart state on network errors
          console.error('Error reloading cart on focus:', error);
          // Only clear cart if we're sure the user is not authenticated
          const errorMessage = error?.message || String(error);
          if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
            setCart(null);
            setQuantity(0);
          }
          // Otherwise, preserve existing cart state - don't update
        }
      };
      reloadCart();
    }, [id])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load medicine, reviews, alternatives, and cart in parallel
      // Don't let cart failure block page rendering
      const loadPromises: Promise<any>[] = [
        medicineAPI.getById(id as string),
        medicineAPI.getReviews(id as string),
        medicineAPI.getAlternatives(id as string),
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
      const medicineData = results[0];
      const reviewsData = results[1];
      const alternativesData = results[2];
      // cartResult will be undefined if user is not authenticated
      const cartResult = getAuthToken() ? results[3] : undefined;

      setMedicine(medicineData);
      setReviews(reviewsData);
      setAlternatives(alternativesData);
      
      // Handle cart result
      if (getAuthToken() && cartResult !== undefined) {
        if (cartResult && cartResult.isError) {
          // Cart load failed - check if it's an auth error
          const errorMessage = cartResult.error?.message || String(cartResult.error);
          if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
            setCart(null);
            setQuantity(0);
          }
          // Otherwise, don't update cart state (preserve if exists, or leave as null)
        } else {
          // Cart loaded successfully (cartResult can be null for empty cart, or a cart object)
          setCart(cartResult);
          
          // Get current quantity in cart
          if (cartResult && cartResult.items) {
            const item = cartResult.items.find((item: any) => item.medicine_id === id);
            setQuantity(item ? item.quantity : 0);
          } else {
            setQuantity(0);
          }
        }
      } else if (!getAuthToken()) {
        setCart(null);
        setQuantity(0);
      }
      // If cartResult is undefined but user is authenticated, don't update cart state
    } catch (error: any) {
      Alert.alert('Error', error.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!medicine) return;
    if (!getAuthToken()) {
      Alert.alert('Login required', 'Please login to add items to cart.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/login') },
      ]);
      return;
    }
    try {
      await cartAPI.add(medicine.id, 1);
      await updateCartData();
      // Emit event to update cart badge in real-time
      cartEvents.emit();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleIncreaseQuantity = async () => {
    if (!medicine) return;
    try {
      await cartAPI.update(medicine.id, quantity + 1);
      await updateCartData();
      // Emit event to update cart badge in real-time
      cartEvents.emit();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDecreaseQuantity = async () => {
    if (!medicine) return;
    try {
      await cartAPI.update(medicine.id, quantity - 1);
      await updateCartData();
      // Emit event to update cart badge in real-time
      cartEvents.emit();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleUpdateQuantity = async (newQuantity: number) => {
    if (!medicine) return;
    try {
      await cartAPI.update(medicine.id, newQuantity);
      await updateCartData();
      // Emit event to update cart badge in real-time
      cartEvents.emit();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSubmitReview = async () => {
    if (!comment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    setSubmitting(true);
    try {
      await medicineAPI.addReview(id as string, rating, comment);
      Alert.alert('Success', 'Review submitted successfully!');
      setShowReviewForm(false);
      setComment('');
      setRating(5);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!medicine) return null;

  const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="search" size={24} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="share-social" size={24} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="bag" size={24} color={Colors.text} />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>2</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Image Gallery */}
        <View style={styles.imageGallery}>
          <View style={styles.imageContainer}>
            <View style={styles.imagePlaceholder}>
              <Ionicons name="medical" size={100} color={Colors.primary} />
            </View>
          </View>
          <View style={styles.pageIndicator}>
            <Text style={styles.pageIndicatorText}>1/2</Text>
          </View>
        </View>

        {/* Medicine Info */}
        <View style={styles.medicineInfo}>
          <Text style={styles.medicineName}>{medicine.name}</Text>
          <Text style={styles.manufacturer}>Scorleon Pharma</Text>

          {/* Composition */}
          <View style={styles.compositionSection}>
            <Text style={styles.compositionTitle}>Composition</Text>
            <Text style={styles.compositionText}>
              {medicine.description}
            </Text>
          </View>

          {/* Badges */}
          <View style={styles.badgesContainer}>
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
              <Text style={styles.badgeText}>Genuine</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Authenticity Assured</Text>
            </View>
            {medicine.prescription_required && (
              <View style={styles.badge}>
                <Ionicons name="medical" size={16} color={Colors.warning} />
                <Text style={styles.badgeText}>Prescription required</Text>
              </View>
            )}
            <View style={styles.badge}>
              <Ionicons name="people" size={16} color={Colors.textLight} />
              <Text style={styles.badgeText}>79 people bought recently</Text>
            </View>
          </View>

          {/* Delivery Time */}
          <View style={styles.deliverySection}>
            <Ionicons name="time-outline" size={20} color={Colors.text} />
            <Text style={styles.deliveryText}>Get by <Text style={styles.deliveryTime}>6pm, Tomorrow</Text></Text>
            <Ionicons name="information-circle-outline" size={16} color={Colors.textLight} />
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.pricingSection}>
          <View style={styles.priceRow}>
            <View style={styles.priceLeft}>
              <Text style={styles.currentPrice}>₹{medicine.price}</Text>
              <Text style={styles.regularPrice}>₹{medicine.mrp}</Text>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{medicine.discount_percentage}% off</Text>
              </View>
            </View>
          </View>

          <View style={styles.cartActionContainer}>
            <View style={styles.priceInfo}>
              <Text style={styles.totalPriceLabel}>Total:</Text>
              <Text style={styles.totalPriceValue}>₹{(medicine.price * (quantity || 1)).toFixed(2)}</Text>
            </View>
            
            <QuantitySelector
              quantity={quantity}
              maxQuantity={medicine.stock_quantity}
              onAdd={handleAddToCart}
              onIncrease={handleIncreaseQuantity}
              onDecrease={handleDecreaseQuantity}
              onUpdateQuantity={handleUpdateQuantity}
              disabled={medicine.stock_quantity === 0}
              size="large"
            />
          </View>

          {quantity > 0 && (
            <TouchableOpacity
              style={styles.viewCartButton}
              onPress={() => router.push('/cart')}
            >
              <Ionicons name="bag-check" size={20} color={Colors.primary} />
              <Text style={styles.viewCartText}>View Cart ({quantity} item{quantity > 1 ? 's' : ''})</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 20 }} />

        {/* Reviews Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
            {averageRating > 0 && (
              <View style={styles.averageRating}>
                <Ionicons name="star" size={16} color={Colors.warning} />
                <Text style={styles.averageRatingText}>{averageRating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          {!showReviewForm && (
            <TouchableOpacity style={styles.addReviewButton} onPress={() => setShowReviewForm(true)}>
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.addReviewText}>Write a Review</Text>
            </TouchableOpacity>
          )}

          {showReviewForm && (
            <View style={styles.reviewForm}>
              <Text style={styles.formLabel}>Rating</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)}>
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={32}
                      color={Colors.warning}
                      style={styles.star}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Comment</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Share your experience..."
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton]}
                  onPress={() => {
                    setShowReviewForm(false);
                    setComment('');
                    setRating(5);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.formButton, styles.submitButton, submitting && styles.disabledButton]}
                  onPress={handleSubmitReview}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color={Colors.background} />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>{review.user_name || 'Anonymous'}</Text>
                <View style={styles.reviewRating}>
                  <Ionicons name="star" size={14} color={Colors.warning} />
                  <Text style={styles.reviewRatingText}>{review.rating}</Text>
                </View>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
              <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
            </View>
          ))}

          {reviews.length === 0 && !showReviewForm && (
            <Text style={styles.noReviews}>No reviews yet. Be the first to review!</Text>
          )}
        </View>

        {/* Alternative Medicines */}
        {alternatives.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alternative Medicines</Text>
            {alternatives.map((alt) => (
              <TouchableOpacity
                key={alt.id}
                style={styles.alternativeCard}
                onPress={() => router.push(`/medicine/${alt.id}`)}
              >
                <View style={styles.alternativeInfo}>
                  <Text style={styles.alternativeName}>{alt.name}</Text>
                  <Text style={styles.alternativePrice}>₹{alt.price}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
              </TouchableOpacity>
            ))}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerIcon: {
    position: 'relative',
    padding: 4,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: Colors.background,
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  imageGallery: {
    position: 'relative',
    height: 300,
    backgroundColor: Colors.surface,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageIndicator: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pageIndicatorText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  medicineInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  medicineName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  manufacturer: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 16,
  },
  compositionSection: {
    marginBottom: 16,
  },
  compositionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  compositionText: {
    fontSize: 13,
    color: Colors.textLight,
    lineHeight: 18,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeText: {
    fontSize: 11,
    color: Colors.text,
    marginLeft: 4,
  },
  deliverySection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 8,
  },
  deliveryText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    marginLeft: 8,
  },
  deliveryTime: {
    fontWeight: '600',
    color: Colors.text,
  },
  pricingSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  priceRow: {
    marginBottom: 16,
  },
  priceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginRight: 12,
  },
  regularPrice: {
    fontSize: 16,
    color: Colors.textLight,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 11,
    color: Colors.background,
    fontWeight: 'bold',
  },
  cartActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceInfo: {
    flex: 1,
  },
  totalPriceLabel: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  totalPriceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  viewCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  viewCartText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  averageRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  averageRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.background,
    marginLeft: 4,
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addReviewText: {
    fontSize: 16,
    color: Colors.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  reviewForm: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  star: {
    marginRight: 8,
  },
  commentInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 16,
    color: Colors.text,
    minHeight: 100,
    marginBottom: 16,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  formButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  submitButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reviewRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.background,
    marginLeft: 4,
  },
  reviewComment: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.textLight,
  },
  noReviews: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    paddingVertical: 32,
  },
  alternativeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  alternativeInfo: {
    flex: 1,
  },
  alternativeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  alternativePrice: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
});
