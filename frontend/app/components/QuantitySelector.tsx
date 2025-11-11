import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface QuantitySelectorProps {
  quantity: number;
  maxQuantity?: number;
  onAdd: () => Promise<void>;
  onIncrease: () => Promise<void>;
  onDecrease: () => Promise<void>;
  onUpdateQuantity?: (newQuantity: number) => Promise<void>;
  onRemove?: () => Promise<void>;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  maxQuantity,
  onAdd,
  onIncrease,
  onDecrease,
  onUpdateQuantity,
  disabled = false,
  size = 'medium',
}) => {
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleAdd = async () => {
    setLoading(true);
    try {
      await onAdd();
    } finally {
      setLoading(false);
    }
  };

  const handleIncrease = async () => {
    if (maxQuantity && quantity >= maxQuantity) return;
    setLoading(true);
    try {
      await onIncrease();
    } finally {
      setLoading(false);
    }
  };

  const handleDecrease = async () => {
    setLoading(true);
    try {
      await onDecrease();
    } finally {
      setLoading(false);
    }
  };

  const handleQuantitySelect = async (newQuantity: number) => {
    setLoading(true);
    try {
      if (onUpdateQuantity) {
        await onUpdateQuantity(newQuantity);
      } else {
        // Fallback to increase/decrease if onUpdateQuantity not provided
        const diff = newQuantity - quantity;
        if (diff > 0) {
          for (let i = 0; i < diff; i++) {
            await onIncrease();
          }
        } else if (diff < 0) {
          // Decrease quantity
          for (let i = 0; i < Math.abs(diff); i++) {
            await onDecrease();
          }
        }
      }
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  };

  // Generate quantity options (1 to 10, or up to maxQuantity)
  const getQuantityOptions = () => {
    const max = maxQuantity ? Math.min(maxQuantity, 10) : 10;
    return Array.from({ length: max }, (_, i) => i + 1);
  };

  const sizeStyles = {
    small: {
      container: styles.containerSmall,
      button: styles.buttonSmall,
      text: styles.textSmall,
      addButton: styles.addButtonSmall,
    },
    medium: {
      container: styles.containerMedium,
      button: styles.buttonMedium,
      text: styles.textMedium,
      addButton: styles.addButtonMedium,
    },
    large: {
      container: styles.containerLarge,
      button: styles.buttonLarge,
      text: styles.textLarge,
      addButton: styles.addButtonLarge,
    },
  };

  const currentSize = sizeStyles[size];

  // Show "ADD" button when quantity is 0
  if (quantity === 0) {
    return (
      <TouchableOpacity
        style={[styles.addButton, currentSize.addButton, disabled && styles.disabledButton]}
        onPress={handleAdd}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={Colors.background} />
        ) : (
          <Text style={[styles.addButtonText, currentSize.text]}>ADD</Text>
        )}
      </TouchableOpacity>
    );
  }

  // Show "X added" button with dropdown when quantity > 0
  const quantityOptions = getQuantityOptions();
  
  return (
    <View>
      <TouchableOpacity
        style={[styles.addedButton, currentSize.addButton, disabled && styles.disabledButton]}
        onPress={() => setShowDropdown(true)}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={Colors.background} />
        ) : (
          <>
            <Text style={[styles.addedButtonText, currentSize.text]}>
              {quantity} added
            </Text>
            <View style={styles.dropdownIcon}>
              <Ionicons name="chevron-down" size={14} color={Colors.primary} />
            </View>
          </>
        )}
      </TouchableOpacity>

      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <View 
            style={styles.dropdownContainer}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownHeaderText}>Select your desired quantity</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDropdown(false)}
              >
                <Ionicons name="close" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Options List */}
            <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
              {quantityOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.dropdownOption,
                    option === quantity && styles.dropdownOptionSelected,
                  ]}
                  onPress={() => handleQuantitySelect(option)}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      option === quantity && styles.dropdownOptionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                  {option === quantity ? (
                    <View style={styles.checkmarkCircle}>
                      <Ionicons name="checkmark" size={14} color={Colors.background} />
                    </View>
                  ) : (
                    <View style={styles.emptyCircle} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Remove Button */}
            {quantity > 0 && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={async () => {
                  setLoading(true);
                  try {
                    if (typeof onRemove === 'function') {
                      await onRemove();
                    } else {
                      // fallback: set quantity to 0 using update or decreases
                      await handleQuantitySelect(0);
                    }
                    setShowDropdown(false);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <Ionicons name="trash-outline" size={18} color={Colors.background} />
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // ADD Button Styles
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  addButtonSmall: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    minWidth: 100,
    height: 36,
  },
  addButtonMedium: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    minWidth: 120,
    height: 44,
  },
  addButtonLarge: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    minWidth: 140,
    height: 52,
  },
  addButtonText: {
    color: Colors.background,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Quantity Controls Container
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  containerSmall: {
    minWidth: 80,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  containerMedium: {
    minWidth: 100,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  containerLarge: {
    minWidth: 120,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },

  // Control Buttons
  controlButton: {
    backgroundColor: Colors.background,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSmall: {
    width: 24,
    height: 24,
  },
  buttonMedium: {
    width: 28,
    height: 28,
  },
  buttonLarge: {
    width: 36,
    height: 36,
  },

  // Quantity Display
  quantityDisplay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  textSmall: {
    fontSize: 12,
  },
  textMedium: {
    fontSize: 14,
  },
  textLarge: {
    fontSize: 16,
  },

  // Disabled State
  disabledButton: {
    opacity: 0.5,
  },

  // Added Button (when quantity > 0) - same size as ADD button
  addedButton: {
    // Keep visual parity with addButton base
    backgroundColor: Colors.primary,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    // Dimensions are applied via size-specific addButtonSmall/addButtonMedium/addButtonLarge
    // but include a fallback padding/minWidth/height so the button sizes match even if size styles
    // are not applied for any reason.
    paddingHorizontal: 20,
    paddingVertical: 8,
    minWidth: 120,
    height: 44,
  },

  addedButtonText: {
    color: Colors.background,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  dropdownIcon: {
    marginLeft: 8,
    backgroundColor: Colors.background,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal and Dropdown Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dropdownContainer: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    width: '85%',
    maxWidth: 400,
    maxHeight: 500,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },

  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  dropdownHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dropdownScroll: {
    maxHeight: 350,
  },

  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.background,
  },

  dropdownOptionSelected: {
    backgroundColor: '#FFE4E4', // Light peach/red background for selected
  },

  dropdownOptionText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },

  dropdownOptionTextSelected: {
    color: Colors.text,
    fontWeight: '600',
  },

  checkmarkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },

  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 8,
    gap: 8,
  },

  removeButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});
