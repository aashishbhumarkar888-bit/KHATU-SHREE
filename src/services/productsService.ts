import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  Unsubscribe 
} from 'firebase/firestore';
import { db, isFirebaseInitialized } from '../lib/firebase';
import { Product } from '../types';
import { PRODUCTS as SEED_PRODUCTS } from '../data/products';

const PRODUCTS_COLLECTION = 'products';

/**
 * Normalizes a product object ensuring fallback defaults for newly added fields.
 */
export function normalizeProduct(raw: any): Product {
  return {
    ...raw,
    stock: typeof raw.stock === 'number' ? raw.stock : 25,
    compareAtPrice: typeof raw.compareAtPrice === 'number' ? raw.compareAtPrice : Math.round(raw.price * 1.35),
    images: Array.isArray(raw.images) && raw.images.length > 0 ? raw.images : ['https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80'],
    variants: Array.isArray(raw.variants) ? raw.variants : [],
    benefits: Array.isArray(raw.benefits) ? raw.benefits : [],
    deliverySlots: Array.isArray(raw.deliverySlots) ? raw.deliverySlots : ['Morning 6:00 - 8:30 AM', 'Evening 5:30 - 8:30 PM'],
    faqs: Array.isArray(raw.faqs) ? raw.faqs : [],
  };
}

/**
 * Fetches products from Firestore, falling back to seed products if collection is empty.
 */
export async function getLiveProducts(): Promise<Product[]> {
  if (!isFirebaseInitialized || !db) {
    return SEED_PRODUCTS.map(normalizeProduct);
  }

  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      return SEED_PRODUCTS.map(normalizeProduct);
    }

    const liveProducts: Product[] = [];
    snapshot.forEach((docSnap) => {
      liveProducts.push(normalizeProduct({ ...docSnap.data(), id: docSnap.id }));
    });

    return liveProducts.length > 0 ? liveProducts : SEED_PRODUCTS.map(normalizeProduct);
  } catch (error) {
    console.warn('Unable to fetch live products from Firestore, using seed file:', error);
    return SEED_PRODUCTS.map(normalizeProduct);
  }
}

/**
 * Attaches a real-time onSnapshot listener for products from Firestore.
 */
export function subscribeToLiveProducts(
  onProductsUpdate: (products: Product[]) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  if (!isFirebaseInitialized || !db) {
    onProductsUpdate(SEED_PRODUCTS.map(normalizeProduct));
    return null;
  }

  const colRef = collection(db, PRODUCTS_COLLECTION);

  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        onProductsUpdate(SEED_PRODUCTS.map(normalizeProduct));
        return;
      }

      const products: Product[] = [];
      snapshot.forEach((docSnap) => {
        products.push(normalizeProduct({ ...docSnap.data(), id: docSnap.id }));
      });

      onProductsUpdate(products.length > 0 ? products : SEED_PRODUCTS.map(normalizeProduct));
    },
    (err) => {
      console.warn('Live products onSnapshot warning, falling back to seed catalog:', err);
      onProductsUpdate(SEED_PRODUCTS.map(normalizeProduct));
      if (onError) onError(err);
    }
  );
}

/**
 * Saves or updates a product in Firestore.
 */
export async function saveProductToFirestore(product: Product): Promise<void> {
  if (!isFirebaseInitialized || !db) {
    throw new Error('Firebase is not initialized.');
  }

  const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
  const payload = {
    ...product,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(docRef, payload, { merge: true });
}

/**
 * Deletes a product from Firestore.
 */
export async function deleteProductFromFirestore(productId: string): Promise<void> {
  if (!isFirebaseInitialized || !db) {
    throw new Error('Firebase is not initialized.');
  }

  const docRef = doc(db, PRODUCTS_COLLECTION, productId);
  await deleteDoc(docRef);
}

/**
 * Seeds initial catalog to Firestore if the collection is currently empty.
 */
export async function seedProductsToFirestore(): Promise<number> {
  if (!isFirebaseInitialized || !db) {
    throw new Error('Firebase is not initialized.');
  }

  let count = 0;
  for (const p of SEED_PRODUCTS) {
    const docRef = doc(db, PRODUCTS_COLLECTION, p.id);
    await setDoc(docRef, normalizeProduct(p), { merge: true });
    count++;
  }

  return count;
}
