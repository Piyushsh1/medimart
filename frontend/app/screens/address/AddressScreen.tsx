import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { addressAPI } from '../../services/api';
import { Address } from '../../types';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface AddressScreenProps {
  onSelectAddress?: (address: Address) => void;
  showSelectOnly?: boolean;
}

export default function AddressScreen({ onSelectAddress, showSelectOnly = false }: AddressScreenProps) {
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    is_default: false,
  });
  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    loadAddresses();
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const data = await addressAPI.getAll();
      setAddresses(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setFormData({
      label: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      is_default: false,
    });
    setShowAddModal(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      phone: address.phone,
      is_default: address.is_default,
    });
    setShowAddModal(true);
  };

  const handleSaveAddress = async () => {
    if (!formData.label.trim() || !formData.address_line1.trim() || !formData.city.trim() || 
        !formData.state.trim() || !formData.pincode.trim() || !formData.phone.trim()) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      if (editingAddress) {
        await addressAPI.update(editingAddress.id, formData);
        Alert.alert('Success', 'Address updated successfully!');
      } else {
        // Create address with all required fields
        const addressData = {
          ...formData,
          address_line2: formData.address_line2 || '',
        };
        await addressAPI.create(addressData);
        Alert.alert('Success', 'Address added successfully!');
      }
      setShowAddModal(false);
      await loadAddresses();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteAddress = (address: Address) => {
    Alert.alert(
      'Delete Address',
      `Are you sure you want to delete "${address.label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await addressAPI.delete(address.id);
              Alert.alert('Success', 'Address deleted successfully!');
              await loadAddresses();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleSelectAddress = async (address: Address) => {
    if (showSelectOnly) {
      // Store selected address ID for cart screen to pick up
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('selectedAddressId', address.id);
      } catch (error) {
        // Fallback if AsyncStorage not available
      }
      router.back();
    } else if (onSelectAddress) {
      onSelectAddress(address);
      router.back();
    }
  };

  const handleSetDefault = async (address: Address) => {
    try {
      await addressAPI.update(address.id, {
        ...address,
        is_default: true,
      });
      await loadAddresses();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Header 
        title={showSelectOnly ? "Select Address" : "My Addresses"} 
        onBack={() => router.back()} 
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={80} color={Colors.textLight} />
            <Text style={styles.emptyText}>No addresses added yet</Text>
            <Text style={styles.emptySubtext}>Add your first address to get started</Text>
          </View>
        ) : (
          addresses.map((address) => (
            <View key={address.id} style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <View style={styles.addressHeaderLeft}>
                  <View style={styles.labelBadge}>
                    <Ionicons 
                      name={address.label.toLowerCase() === 'home' ? 'home' : address.label.toLowerCase() === 'office' ? 'business' : 'location'} 
                      size={16} 
                      color={Colors.primary} 
                    />
                    <Text style={styles.labelText}>{address.label}</Text>
                  </View>
                  {address.is_default && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </View>
                {!showSelectOnly && (
                  <View style={styles.addressActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditAddress(address)}
                    >
                      <Ionicons name="pencil" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteAddress(address)}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={() => handleSelectAddress(address)}
                disabled={!showSelectOnly && !onSelectAddress}
                activeOpacity={(showSelectOnly || onSelectAddress) ? 0.7 : 1}
              >
                <Text style={styles.addressLine1}>{address.address_line1}</Text>
                {address.address_line2 && (
                  <Text style={styles.addressLine2}>{address.address_line2}</Text>
                )}
                <Text style={styles.addressDetails}>
                  {address.city}, {address.state} - {address.pincode}
                </Text>
                <Text style={styles.phoneText}>Phone: {address.phone}</Text>

                {!address.is_default && !showSelectOnly && (
                  <TouchableOpacity
                    style={styles.setDefaultButton}
                    onPress={() => handleSetDefault(address)}
                  >
                    <Text style={styles.setDefaultText}>Set as Default</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>
          ))
        )}

        {showSelectOnly && (
          <TouchableOpacity style={styles.addAddressCard} onPress={handleAddAddress}>
            <Ionicons name="add-circle" size={24} color={Colors.primary} />
            <Text style={styles.addAddressCardText}>Add New Address</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {!showSelectOnly && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddAddress}>
            <Ionicons name="add" size={24} color={Colors.background} />
            <Text style={styles.addButtonText}>Add New Address</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add/Edit Address Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Backdrop: tapping outside modal closes it. While keyboard is open we hide the dark overlay
              and disable taps to avoid accidental dismissal while typing. */}
          <TouchableOpacity
            style={[styles.backdropTouchable, keyboardVisible && styles.backdropHidden]}
            onPress={() => {
              Keyboard.dismiss();
              setShowAddModal(false);
            }}
            activeOpacity={1}
            disabled={keyboardVisible}
          />

          <View style={styles.modalContentWrapper}>
            <View style={styles.modalContent}>
              {/* draggable handle */}
              <View style={styles.handleBar} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowAddModal(false);
                  }}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={22} color={Colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView 
                ref={scrollViewRef}
                style={styles.form} 
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.formContent}
                keyboardDismissMode="on-drag"
                nestedScrollEnabled={true}
              >
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Label *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Home, Office"
                    value={formData.label}
                    onChangeText={(text) => setFormData({ ...formData, label: text })}
                    placeholderTextColor={Colors.textLight}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Address Line 1 *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Street address, building"
                    value={formData.address_line1}
                    onChangeText={(text) => setFormData({ ...formData, address_line1: text })}
                    placeholderTextColor={Colors.textLight}
                    multiline
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Address Line 2</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Apartment, suite, etc. (optional)"
                    value={formData.address_line2}
                    onChangeText={(text) => setFormData({ ...formData, address_line2: text })}
                    placeholderTextColor={Colors.textLight}
                    multiline
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>City *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="City"
                      value={formData.city}
                      onChangeText={(text) => setFormData({ ...formData, city: text })}
                      placeholderTextColor={Colors.textLight}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>State *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="State"
                      value={formData.state}
                      onChangeText={(text) => setFormData({ ...formData, state: text })}
                      placeholderTextColor={Colors.textLight}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Pincode *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Pincode"
                      value={formData.pincode}
                      onChangeText={(text) => setFormData({ ...formData, pincode: text })}
                      placeholderTextColor={Colors.textLight}
                      keyboardType="numeric"
                      maxLength={6}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Phone *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Phone"
                      value={formData.phone}
                      onChangeText={(text) => setFormData({ ...formData, phone: text })}
                      placeholderTextColor={Colors.textLight}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setFormData({ ...formData, is_default: !formData.is_default })}
                >
                  <View style={[styles.checkbox, formData.is_default && styles.checkboxChecked]}>
                    {formData.is_default && (
                      <Ionicons name="checkmark" size={16} color={Colors.background} />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>Set as default address</Text>
                </TouchableOpacity>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowAddModal(false);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleSaveAddress}
                  >
                    <Text style={styles.saveButtonText}>
                      {editingAddress ? 'Update' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
  },
  addressCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 6,
  },
  defaultBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.background,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  addressLine1: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  addressLine2: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  addressDetails: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
  },
  setDefaultButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
  setDefaultText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  bottomBar: {
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  addAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  addAddressCardText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 12,
  },
  // The overlay container wraps everything
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  // Backdrop fills the area above the modal and provides the dark overlay.
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropHidden: {
    backgroundColor: 'transparent',
  },
  // Wrapper anchors modal content at the bottom
  modalContentWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
  },
  // Modal content should size to its content, with a maximum height so it doesn't fill
  // the entire screen and will sit above the keyboard without leaving a grey gap.
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '55%',
    flexDirection: 'column',
    overflow: 'hidden',
    // subtle shadow / elevation for a modern sheet look
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  handleBar: {
    width: 60,
    height: 6,
    borderRadius: 4,
    backgroundColor: '#E6E6E6',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 10,
    padding: 6,
  },
  form: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 120,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    minHeight: 48,
  },
  row: {
    flexDirection: 'row',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
});

