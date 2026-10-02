export type ProductCategory = 
  | 'Farm Fresh Dairy & Desi Ghee'
  | 'Apparel & Traditional Clothes'
  | 'Daily Necessities & Household Staples'
  | 'Home Utilities & Kitchenware'
  | 'MP Grains & Organic Staples'
  | 'Cold-Pressed Kachi Ghani Oils'
  | 'Raw Honey, Dry Fruits & Superfoods'
  | 'Spiritual & Pure Puja Samagri'
  | 'Bhopal Artisanal Sweets & Mawa';

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  weightOrVolume: string;
  inStock: boolean;
  priceModifier?: number;
  imageIndex?: number;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  title: string;
  content: string;
  verifiedPurchase: boolean;
  date: string;
  location?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  hindiName?: string;
  subheading: string;
  category: ProductCategory;
  price: number;
  compareAtPrice?: number;
  currency: string;
  images: string[];
  variants: ProductVariant[];
  purityBadge: string;
  farmOrigin: string; // e.g. "Sehore Organic Gaushala, MP"
  netWeight: string;
  shelfLife: string;
  description: string;
  benefits: string[];
  specifications: Record<string, string>;
  rating: number;
  reviewCount: number;
  isBestseller?: boolean;
  isFreshDairy?: boolean;
  deliverySlots: string[]; // e.g. ["Morning 6:00 - 8:30 AM", "Evening 5:30 - 8:30 PM"]
  storageInstructions: string;
  faqs: { question: string; answer: string }[];
  stock?: number;
  // Dropshipping & Meesho/Amazon Wholesale Fields
  wholesalePrice?: number;
  resellerMargin?: number;
  supplierName?: string;
  supplierRating?: number;
  dispatchTime?: string;
  codAvailable?: boolean;
  resellerDiscount?: number;
}

export interface CartItem {
  id: string;
  product: Product;
  selectedVariant: ProductVariant;
  quantity: number;
  deliverySlot?: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email?: string;
  houseFlat: string;
  streetColony: string;
  landmark?: string;
  bhopalArea: string; // e.g. "MP Nagar", "Arera Colony", "Kolar Road"
  pincode: string;
  deliverySlot?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  variantName: string;
  quantity: number;
  price: number;
  imageUrl: string;
}

export interface TrackingEvent {
  timestamp: string;
  status: 'placed' | 'processing' | 'out_for_delivery' | 'delivered';
  title: string;
  location: string;
  details: string;
}

export interface Order {
  id: string;
  orderId?: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: ShippingAddress;
  address?: any;
  items: OrderItem[];
  subtotal: number;
  wholesaleTotal?: number;
  resaleValue?: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  currency: string;
  status: 'placed' | 'processing' | 'out_for_delivery' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'UPI' | 'COD' | 'Card' | string;
  paymentMode?: string;
  deliveryMethod?: string;
  packagingChoice?: string;
  deliverySlot: string;
  trackingNumber?: string;
  deliveryPartner?: string;
  deliveryAgentPhone?: string;
  deliveryInstructions?: string;
  estimatedDelivery?: string;
  trackingEvents?: TrackingEvent[];
  statusTimeline?: TrackingEvent[];
  createdAt: string;
}

export interface UserProfile {
  userId: string;
  email: string;
  name?: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  bhopalArea?: string;
  address?: string;
  pincode?: string;
  khatuPoints?: number;
  resellerMarkup?: number;
  referralCode?: string;
  cart?: any[];
  wishlist?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PointsTransaction {
  id: string;
  type: 'earned' | 'redeemed' | 'bonus';
  points: number;
  description: string;
  orderId?: string;
  date: string;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  code: string;
  pointsRequired: number;
  discountValue: number;
  description: string;
  badge: string;
}

