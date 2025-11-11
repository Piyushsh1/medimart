export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  rating: number;
  image: string;
  is_open: boolean;
  delivery_time: string;
  minimum_order: number;
  latitude?: number;
  longitude?: number;
  distance?: number;
}

export interface Medicine {
  id: string;
  pharmacy_id: string;
  name: string;
  description: string;
  price: number;
  mrp: number;
  discount_percentage: number;
  stock_quantity: number;
  category: string;
  image: string;
  prescription_required: boolean;
}

export interface CartItem {
  medicine_id: string;
  quantity: number;
  price: number;
  medicine?: Medicine;
}

export interface Cart {
  id: string;
  user_id: string;
  pharmacy_id: string;
  items: CartItem[];
  total_amount: number;
}

export interface Order {
  id: string;
  user_id: string;
  pharmacy_id: string;
  items: CartItem[];
  total_amount: number;
  delivery_address: string;
  phone: string;
  status: string;
  payment_method: string;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  is_default: boolean;
  latitude?: number;
  longitude?: number;
}

export interface Review {
  id: string;
  medicine_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_name?: string;
}

export interface Prescription {
  id: string;
  user_id: string;
  pharmacy_id?: string;
  image_url: string;
  notes?: string;
  status: string;
  created_at: string;
}

export interface LabTest {
  id: string;
  user_id: string;
  test_name: string;
  description: string;
  price: number;
  lab_name: string;
  test_type: string;
  status: string;
  scheduled_date: string;
  results_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Consultation {
  id: string;
  user_id: string;
  doctor_name: string;
  specialization: string;
  consultation_type: string;
  price: number;
  status: string;
  scheduled_date: string;
  duration_minutes: number;
  symptoms?: string;
  diagnosis?: string;
  prescription_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  method_type: 'upi' | 'card' | 'netbanking' | 'wallet';
  is_default: boolean;
  card_last4?: string;
  card_network?: string;
  upi_id?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  order_id: string;
  amount: number;
  payment_method: string;
  status: 'initiated' | 'success' | 'failed' | 'refunded';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}
