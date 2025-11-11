import { BACKEND_URL } from '../constants/config';
import { Platform } from 'react-native';

let storageImpl: {
  set: (key: string, value: string) => void;
  getString: (key: string) => string | null;
  delete: (key: string) => void;
} | null = null;

const AUTH_KEY = 'auth_token';

// Initialize storage implementation: prefer MMKV on native, fallback to localStorage on web
try {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    storageImpl = {
      set: (k: string, v: string) => window.localStorage.setItem(k, v),
      getString: (k: string) => window.localStorage.getItem(k),
      delete: (k: string) => window.localStorage.removeItem(k),
    };
  } else {
    // Lazily require react-native-mmkv to avoid bundling issues on web
    // and to ensure native usage on mobile platforms.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MMKV } = require('react-native-mmkv');
    const mmkv = new MMKV();
    storageImpl = {
      set: (k: string, v: string) => mmkv.set(k, v),
      getString: (k: string) => mmkv.getString(k) ?? null,
      delete: (k: string) => mmkv.delete(k),
    };
  }
} catch (e) {
  console.warn('No persistent storage available for auth token, falling back to memory only.', e);
  storageImpl = null;
}

let authToken: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;
  try {
    storageImpl?.set(AUTH_KEY, token);
  } catch (e) {
    console.warn('Failed to persist auth token:', e);
  }
};

export const getAuthToken = () => {
  if (authToken) return authToken;
  try {
    const stored = storageImpl ? storageImpl.getString(AUTH_KEY) : null;
    if (stored) {
      authToken = stored;
      return stored;
    }
  } catch (e) {
    console.warn('Failed to read auth token from storage:', e);
  }
  return authToken;
};

export const clearAuthToken = () => {
  authToken = null;
  try {
    storageImpl?.delete(AUTH_KEY);
  } catch (e) {
    console.warn('Failed to clear auth token from storage:', e);
  }
};

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const headers: any = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${BACKEND_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(error.detail || 'Request failed');
  }

  // Handle null responses (empty cart returns null)
  const text = await response.text();
  if (!text || text.trim() === '' || text.trim() === 'null') {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    // If JSON parsing fails, log and return null
    console.warn('Failed to parse JSON response:', e, 'Response text:', text);
    return null;
  }
};

// Auth APIs
export const authAPI = {
  register: async (data: any) => {
    console.log('Registration request:', { url: `${BACKEND_URL}/api/register`, data });
    const response = await fetch(`${BACKEND_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const responseData = await response.json();
    console.log('Registration response:', { status: response.status, data: responseData });
    if (!response.ok) {
      throw new Error(responseData.detail || 'Registration failed');
    }
    return responseData;
  },

  login: async (data: any) => {
    const response = await fetch(`${BACKEND_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error((await response.json()).detail);
    return response.json();
  },
};

// Pharmacy APIs
export const pharmacyAPI = {
  getAll: (params?: { latitude?: number; longitude?: number; radius?: number }) => {
    if (params && params.latitude && params.longitude) {
      const queryParams = new URLSearchParams({
        latitude: params.latitude.toString(),
        longitude: params.longitude.toString(),
        radius: (params.radius || 10).toString(),
      });
      return fetchWithAuth(`/api/pharmacies?${queryParams.toString()}`);
    }
    return fetchWithAuth('/api/pharmacies');
  },
  getById: (id: string) => fetchWithAuth(`/api/pharmacies/${id}`),
  getMedicines: (id: string) => fetchWithAuth(`/api/pharmacies/${id}/medicines`),
};

// Medicine APIs
export const medicineAPI = {
  getById: (id: string) => fetchWithAuth(`/api/medicines/${id}`),
  getReviews: (id: string) => fetchWithAuth(`/api/medicines/${id}/reviews`),
  addReview: (id: string, rating: number, comment: string) =>
    fetchWithAuth(`/api/medicines/${id}/reviews?rating=${rating}&comment=${encodeURIComponent(comment)}`, {
      method: 'POST',
    }),
  getAlternatives: (id: string) => fetchWithAuth(`/api/medicines/${id}/alternatives`),
};

// Cart APIs
export const cartAPI = {
  get: () => fetchWithAuth('/api/cart'),
  add: (medicineId: string, quantity: number = 1) =>
    fetchWithAuth(`/api/cart/add?medicine_id=${medicineId}&quantity=${quantity}`, {
      method: 'POST',
    }),
  update: (medicineId: string, quantity: number) =>
    fetchWithAuth(`/api/cart/update?medicine_id=${medicineId}&quantity=${quantity}`, {
      method: 'PUT',
    }),
  remove: (medicineId: string) => fetchWithAuth(`/api/cart/remove/${medicineId}`, { method: 'DELETE' }),
  clear: () => fetchWithAuth('/api/cart/clear', { method: 'DELETE' }),
};

// Order APIs
export const orderAPI = {
  create: (deliveryAddress: string, phone: string, paymentMethod: string = 'cod') =>
    fetchWithAuth(`/api/orders?delivery_address=${encodeURIComponent(deliveryAddress)}&phone=${phone}&payment_method=${paymentMethod}`, {
      method: 'POST',
    }),
  getAll: () => fetchWithAuth('/api/orders'),
  getById: (id: string) => fetchWithAuth(`/api/orders/${id}`),
  updateStatus: (id: string, status: string) =>
    fetchWithAuth(`/api/orders/${id}/status?status=${status}`, { method: 'PUT' }),
};

// Payment APIs
export const paymentAPI = {
  createRazorpayOrder: (orderId: string) => 
    fetchWithAuth(`/api/payments/create-razorpay-order?order_id=${orderId}`, {
      method: 'POST',
    }),
  verifyPayment: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    order_id: string;
  }) =>
    fetchWithAuth('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getPaymentMethods: () => fetchWithAuth('/api/payments/methods'),
  savePaymentMethod: (data: any) =>
    fetchWithAuth('/api/payments/methods', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deletePaymentMethod: (methodId: string) =>
    fetchWithAuth(`/api/payments/methods/${methodId}`, { method: 'DELETE' }),
  getTransaction: (orderId: string) => fetchWithAuth(`/api/payments/transaction/${orderId}`),
};

// Profile APIs
export const profileAPI = {
  get: () => fetchWithAuth('/api/profile'),
  update: (fullName: string, email: string, phone: string) =>
    fetchWithAuth(`/api/profile?full_name=${encodeURIComponent(fullName)}&email=${email}&phone=${phone}`, {
      method: 'PUT',
    }),
};

// Address APIs
export const addressAPI = {
  getAll: () => fetchWithAuth('/api/addresses'),
  create: (data: any) =>
    fetchWithAuth('/api/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    fetchWithAuth(
      `/api/addresses/${id}?label=${encodeURIComponent(data.label)}&address_line1=${encodeURIComponent(
        data.address_line1
      )}&address_line2=${encodeURIComponent(data.address_line2)}&city=${encodeURIComponent(
        data.city
      )}&state=${encodeURIComponent(data.state)}&pincode=${data.pincode}&phone=${data.phone}&is_default=${data.is_default}`,
      { method: 'PUT' }
    ),
  delete: (id: string) => fetchWithAuth(`/api/addresses/${id}`, { method: 'DELETE' }),
};

// Prescription APIs
export const prescriptionAPI = {
  getAll: () => fetchWithAuth('/api/prescriptions'),
  getById: (id: string) => fetchWithAuth(`/api/prescriptions/${id}`),
  upload: (imageUrl: string, pharmacyId?: string, notes?: string) =>
    fetchWithAuth(
      `/api/prescriptions?image_url=${encodeURIComponent(imageUrl)}${pharmacyId ? `&pharmacy_id=${pharmacyId}` : ''}${notes ? `&notes=${encodeURIComponent(notes)}` : ''}`,
      { method: 'POST' }
    ),
};

// Lab Tests APIs
export const labTestAPI = {
  getAll: () => fetchWithAuth('/api/lab-tests'),
  getById: (id: string) => fetchWithAuth(`/api/lab-tests/${id}`),
  create: (data: any) =>
    fetchWithAuth(
      `/api/lab-tests?test_name=${encodeURIComponent(data.test_name)}&description=${encodeURIComponent(
        data.description
      )}&price=${data.price}&lab_name=${encodeURIComponent(data.lab_name)}&test_type=${encodeURIComponent(
        data.test_type
      )}&scheduled_date=${encodeURIComponent(data.scheduled_date)}${data.notes ? `&notes=${encodeURIComponent(data.notes)}` : ''}`,
      { method: 'POST' }
    ),
  updateStatus: (id: string, status: string, resultsUrl?: string) =>
    fetchWithAuth(
      `/api/lab-tests/${id}/status?status=${status}${resultsUrl ? `&results_url=${encodeURIComponent(resultsUrl)}` : ''}`,
      { method: 'PUT' }
    ),
  delete: (id: string) => fetchWithAuth(`/api/lab-tests/${id}`, { method: 'DELETE' }),
};

// Consultations APIs
export const consultationAPI = {
  getAll: () => fetchWithAuth('/api/consultations'),
  getById: (id: string) => fetchWithAuth(`/api/consultations/${id}`),
  create: (data: any) =>
    fetchWithAuth(
      `/api/consultations?doctor_name=${encodeURIComponent(data.doctor_name)}&specialization=${encodeURIComponent(
        data.specialization
      )}&consultation_type=${encodeURIComponent(data.consultation_type)}&price=${
        data.price
      }&scheduled_date=${encodeURIComponent(data.scheduled_date)}&duration_minutes=${
        data.duration_minutes || 30
      }${data.symptoms ? `&symptoms=${encodeURIComponent(data.symptoms)}` : ''}${data.notes ? `&notes=${encodeURIComponent(data.notes)}` : ''}`,
      { method: 'POST' }
    ),
  updateStatus: (id: string, status: string, diagnosis?: string, prescriptionUrl?: string) =>
    fetchWithAuth(
      `/api/consultations/${id}/status?status=${status}${diagnosis ? `&diagnosis=${encodeURIComponent(diagnosis)}` : ''}${prescriptionUrl ? `&prescription_url=${encodeURIComponent(prescriptionUrl)}` : ''}`,
      { method: 'PUT' }
    ),
  delete: (id: string) => fetchWithAuth(`/api/consultations/${id}`, { method: 'DELETE' }),
};

// Initialize data
export const initializeData = () => fetchWithAuth('/api/init-data', { method: 'POST' });
