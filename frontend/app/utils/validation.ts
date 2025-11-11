/**
 * Validation utilities for form inputs
 */

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Indian phone number validation (10 digits)
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

export const validatePincode = (pincode: string): boolean => {
  // Indian pincode validation (6 digits)
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  return pincodeRegex.test(pincode);
};

export const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }
  return { valid: true, message: '' };
};

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
};

export const validateUPI = (upi: string): boolean => {
  // UPI ID validation (format: username@bank)
  const upiRegex = /^[\w.-]+@[\w.-]+$/;
  return upiRegex.test(upi);
};

export const formatPrice = (price: number): string => {
  return `₹${price.toFixed(2)}`;
};

export const formatPhone = (phone: string): string => {
  // Format: +91 XXXXX XXXXX
  if (phone.length === 10) {
    return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
  }
  return phone;
};

export const sanitizeInput = (input: string): string => {
  // Remove potentially harmful characters
  return input.replace(/[<>]/g, '');
};
