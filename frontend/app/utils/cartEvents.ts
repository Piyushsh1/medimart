// Simple event emitter for cart updates
type CartUpdateListener = () => void;

class CartEventEmitter {
  private listeners: Set<CartUpdateListener> = new Set();

  subscribe(listener: CartUpdateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const cartEvents = new CartEventEmitter();

