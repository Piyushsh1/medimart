export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export const CATEGORIES = [
  { name: 'Pain Relief', icon: 'medical', color: '#FF6B35' },
  { name: 'Cold & Flu', icon: 'thermometer', color: '#17A2B8' },
  { name: 'Vitamins', icon: 'fitness', color: '#28A745' },
  { name: 'Antibiotics', icon: 'shield', color: '#DC3545' },
  { name: 'Diabetes Care', icon: 'heart', color: '#6F42C1' },
  { name: 'Heart Care', icon: 'pulse', color: '#E83E8C' },
];

export const ORDER_STATUSES = {
  placed: { color: '#FFC107', label: 'Placed' },
  confirmed: { color: '#E23744', label: 'Confirmed' },
  preparing: { color: '#FF6B35', label: 'Preparing' },
  out_for_delivery: { color: '#28A745', label: 'Out for Delivery' },
  delivered: { color: '#28A745', label: 'Delivered' },
  cancelled: { color: '#6C757D', label: 'Cancelled' },
};
