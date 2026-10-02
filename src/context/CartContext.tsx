import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CartItem, Product, ProductVariant } from '../types';
import { useAuth } from './AuthContext';
import { db, isFirebaseInitialized } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, variant: ProductVariant, quantity?: number, slot?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  subtotal: number;
  discountPercentage: number;
  discountCode: string;
  applyDiscountCode: (code: string) => { success: boolean; message: string };
  removeDiscountCode: () => void;
  shippingFee: number;
  tax: number;
  total: number;
  itemCount: number;
  freeShippingThreshold: number;
  progressToFreeShipping: number;
  amountNeededForFreeShipping: number;
  selectedDeliverySlot: string;
  setSelectedDeliverySlot: (slot: string) => void;
  selectedBhopalArea: string;
  setSelectedBhopalArea: (area: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const FREE_DELIVERY_THRESHOLD = 499; // ₹499 for free delivery in Bhopal
const STANDARD_DELIVERY_FEE = 40; // ₹40 standard delivery fee

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('ksp_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedDeliverySlot, setSelectedDeliverySlot] = useState<string>('Morning 6:00 AM – 8:30 AM (Farm Chilled)');
  const [selectedBhopalArea, setSelectedBhopalArea] = useState<string>('MP Nagar (Zone 1 & 2)');

  const [discountCode, setDiscountCode] = useState<string>(() => {
    return localStorage.getItem('ksp_discount_code') || '';
  });
  const [discountPercentage, setDiscountPercentage] = useState<number>(() => {
    const code = localStorage.getItem('ksp_discount_code');
    if (code === 'FIRSTBHOPAL') return 0.15;
    if (code === 'SHYAM10') return 0.10;
    return 0;
  });

  // Flag to avoid infinite sync loops
  const isMergingRef = useRef(false);
  const lastMergedUserIdRef = useRef<string | null>(null);

  // Sync / Merge cart with Firestore on sign-in
  useEffect(() => {
    if (user && user.uid !== lastMergedUserIdRef.current) {
      lastMergedUserIdRef.current = user.uid;
      isMergingRef.current = true;

      let localCart: CartItem[] = [];
      try {
        const saved = localStorage.getItem('ksp_cart');
        if (saved) localCart = JSON.parse(saved);
      } catch {
        localCart = [];
      }

      const remoteCart: CartItem[] = (userProfile?.cart && Array.isArray(userProfile.cart)) 
        ? userProfile.cart 
        : [];

      // Merge local and remote
      const map = new Map<string, CartItem>();
      for (const item of remoteCart) {
        map.set(item.id, item);
      }
      for (const item of localCart) {
        if (map.has(item.id)) {
          const existing = map.get(item.id)!;
          map.set(item.id, { ...existing, quantity: Math.max(existing.quantity, item.quantity) });
        } else {
          map.set(item.id, item);
        }
      }

      const merged = Array.from(map.values());
      setItems(merged);
      localStorage.setItem('ksp_cart', JSON.stringify(merged));

      // Push merged back to user document in Firestore
      if (isFirebaseInitialized && db) {
        setDoc(doc(db, 'users', user.uid), {
          cart: merged,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch((err) => console.warn('Cart sync notice:', err));
      }

      setTimeout(() => {
        isMergingRef.current = false;
      }, 500);
    }
  }, [user, userProfile]);

  // Persist items to localStorage and Firestore on change
  useEffect(() => {
    localStorage.setItem('ksp_cart', JSON.stringify(items));

    if (user && isFirebaseInitialized && db && !isMergingRef.current) {
      setDoc(doc(db, 'users', user.uid), {
        cart: items,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch((err) => console.warn('Sync cart item update notice:', err));
    }
  }, [items, user]);

  const addItem = (product: Product, variant: ProductVariant, quantity: number = 1, slot?: string) => {
    const itemId = `${product.id}-${variant.id}`;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing) {
        return prev.map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          id: itemId,
          product,
          selectedVariant: variant,
          quantity,
          deliverySlot: slot || selectedDeliverySlot,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const applyDiscountCode = (code: string): { success: boolean; message: string } => {
    const clean = code.trim().toUpperCase();
    if (clean === 'FIRSTBHOPAL') {
      setDiscountCode('FIRSTBHOPAL');
      setDiscountPercentage(0.15);
      localStorage.setItem('ksp_discount_code', 'FIRSTBHOPAL');
      return { success: true, message: '15% First Order Bhopal Privilege applied!' };
    }
    if (clean === 'SHYAM10') {
      setDiscountCode('SHYAM10');
      setDiscountPercentage(0.10);
      localStorage.setItem('ksp_discount_code', 'SHYAM10');
      return { success: true, message: '10% Khatu Shri discount applied!' };
    }
    return { success: false, message: 'Invalid coupon code. Try SHYAM10 or FIRSTBHOPAL.' };
  };

  const removeDiscountCode = () => {
    setDiscountCode('');
    setDiscountPercentage(0);
    localStorage.removeItem('ksp_discount_code');
  };

  const subtotal = items.reduce((sum, item) => {
    const itemPrice = item.product.price + (item.selectedVariant.priceModifier || 0);
    return sum + itemPrice * item.quantity;
  }, 0);

  const discountAmount = subtotal * discountPercentage;
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const shippingFee = subtotal >= FREE_DELIVERY_THRESHOLD || items.length === 0 ? 0 : STANDARD_DELIVERY_FEE;
  const tax = 0; 
  const total = taxableSubtotal + shippingFee;
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const amountNeededForFreeShipping = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const progressToFreeShipping = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        toggleCart: () => setIsCartOpen((prev) => !prev),
        subtotal,
        discountPercentage,
        discountCode,
        applyDiscountCode,
        removeDiscountCode,
        shippingFee,
        tax,
        total,
        itemCount,
        freeShippingThreshold: FREE_DELIVERY_THRESHOLD,
        progressToFreeShipping,
        amountNeededForFreeShipping,
        selectedDeliverySlot,
        setSelectedDeliverySlot,
        selectedBhopalArea,
        setSelectedBhopalArea,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
