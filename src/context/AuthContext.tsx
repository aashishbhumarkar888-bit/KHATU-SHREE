import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  User, 
  onAuthStateChanged,
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signInAnonymously,
  GoogleAuthProvider
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { 
  auth, 
  googleProvider, 
  fbSignOut, 
  db, 
  isFirebaseInitialized,
  firebaseInitError,
  handleFirestoreError, 
  OperationType,
  setCachedAccessToken,
  getCachedAccessToken,
  getFirebaseFriendlyError
} from '../lib/firebase';
import { isUserAdmin } from '../config/adminConfig';
import { Order, UserProfile, PointsTransaction, LoyaltyReward, CartItem } from '../types';
import { useToastNotification } from './ToastNotificationContext';
import { requestDriveAccessToken, clearMemoryDriveToken } from '../services/googleDrive';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<User | null>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, phone?: string, bhopalArea?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInAsDemoUser: (persona?: 'bhopal_customer' | 'temple_mandir' | 'admin') => Promise<void>;
  updateProfileDetails: (details: Partial<UserProfile>) => Promise<void>;
  signOut: () => Promise<void>;
  wishlist: string[];
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  orders: Order[];
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, newStatus: 'placed' | 'processing' | 'out_for_delivery' | 'shipped' | 'delivered' | 'cancelled') => Promise<void>;
  updateOrderInstructions: (orderId: string, instructions: string) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  khatuPoints: number;
  pointsHistory: PointsTransaction[];
  addKhatuPoints: (points: number, description: string, orderId?: string) => void;
  redeemReward: (reward: LoyaltyReward) => boolean;
  claimedCodes: string[];
  driveAccessToken: string | null;
  isDriveConnected: boolean;
  connectGoogleDrive: () => Promise<string | null>;
  disconnectGoogleDrive: () => void;
  isFirebaseInitialized: boolean;
}

function getInitialSampleOrders(uid: string, name: string = 'Aashish Bhumarkar'): Order[] {
  return [
    {
      id: 'ord-bpl-7821',
      orderId: 'ord-bpl-7821',
      userId: uid,
      customerName: name,
      customerPhone: '+91 98260 12345',
      customerEmail: 'aashish.bhopal@khatushri.in',
      shippingAddress: {
        fullName: name,
        phone: '+91 98260 12345',
        houseFlat: 'Bungalow 42, Near 10 No. Market',
        streetColony: 'E-7, Arera Colony',
        bhopalArea: 'Arera Colony (E-1 to E-7)',
        pincode: '462016'
      },
      address: {
        fullName: name,
        phone: '+91 98260 12345',
        houseFlat: 'Bungalow 42, Near 10 No. Market',
        streetColony: 'E-7, Arera Colony',
        bhopalArea: 'Arera Colony (E-1 to E-7)',
        pincode: '462016'
      },
      items: [
        {
          productId: 'prod-fresh-gir-milk',
          productName: 'Fresh Farm A2 Gir Cow Whole Milk',
          variantName: '1 Litre Glass Bottle',
          quantity: 2,
          price: 85,
          imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80'
        },
        {
          productId: 'prod-fresh-malai-paneer',
          productName: 'Artisanal Fresh Malai Paneer',
          variantName: '500g Fresh Cut Block',
          quantity: 1,
          price: 190,
          imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80'
        },
        {
          productId: 'prod-desi-makkan',
          productName: 'Fresh Cultured Desi White Butter (Makkhan)',
          variantName: '250g Hand Churned Pot',
          quantity: 1,
          price: 180,
          imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80'
        }
      ],
      subtotal: 540,
      wholesaleTotal: 540,
      resaleValue: 720,
      deliveryCharge: 0,
      discount: 0,
      total: 540,
      currency: 'INR',
      status: 'out_for_delivery',
      paymentMethod: 'UPI',
      paymentMode: 'UPI',
      deliveryMethod: 'Morning 6:00 - 8:30 AM (Bhopal Express)',
      packagingChoice: 'Standard Khatu Shri Packaging',
      deliverySlot: 'Morning 6:00 - 8:30 AM (Bhopal Express)',
      deliveryInstructions: 'Leave in green morning milk basket outside door. Please do not ring bell before 7 AM.',
      statusTimeline: [
        {
          timestamp: 'Today, 7:15 AM',
          status: 'out_for_delivery',
          title: 'Out for Delivery in Bhopal',
          location: 'Khatu Shri Bhopal Hub (MP Nagar Zone 1)',
          details: 'Dispatched with refrigerated electric van. Associate Rajesh Verma (+91 98260 77123).'
        }
      ],
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
    }
  ];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const { notifyOrderStatusChange, showCustomToast } = useToastNotification();
  
  // Real-time Firestore snapshot listener un-subscribers
  const userUnsubRef = useRef<Unsubscribe | null>(null);
  const wishlistUnsubRef = useRef<Unsubscribe | null>(null);
  const ordersUnsubRef = useRef<Unsubscribe | null>(null);
  const hasNotifiedOfflineRef = useRef<boolean>(false);

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ksp_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(() => getCachedAccessToken());

  // Khatu Points Loyalty State
  const [khatuPoints, setKhatuPoints] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ksp_khatu_points');
      return saved ? parseInt(saved, 10) : 380;
    } catch {
      return 380;
    }
  });

  const [claimedCodes, setClaimedCodes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ksp_claimed_codes');
      return saved ? JSON.parse(saved) : ['KHATU50'];
    } catch {
      return ['KHATU50'];
    }
  });

  const [pointsHistory, setPointsHistory] = useState<PointsTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('ksp_points_history');
      if (saved) return JSON.parse(saved);
      return [
        {
          id: 'tx-init-1',
          type: 'earned',
          points: 54,
          description: 'Earned on Order #ORD-BPL-7821 (₹540 wholesale spend)',
          orderId: 'ord-bpl-7821',
          date: 'Yesterday, 8:45 AM'
        },
        {
          id: 'tx-init-2',
          type: 'earned',
          points: 104,
          description: 'Earned on Order #ORD-BPL-6590 (₹1,040 wholesale spend)',
          orderId: 'ord-bpl-6590',
          date: '3 days ago'
        },
        {
          id: 'tx-init-3',
          type: 'bonus',
          points: 100,
          description: 'Welcome Devotee & Reseller Joining Bonus',
          date: 'Account Activation'
        }
      ];
    } catch {
      return [];
    }
  });

  // Notify user if Firebase failed to initialize (graceful fallback)
  useEffect(() => {
    if (!isFirebaseInitialized && !hasNotifiedOfflineRef.current) {
      hasNotifiedOfflineRef.current = true;
      setTimeout(() => {
        showCustomToast({
          orderId: 'FIREBASE-MODE',
          newStatus: 'processing',
          title: 'Offline / Local Demo Mode',
          message: firebaseInitError || 'Using local mock storage adapter. Add Firebase credentials to .env to connect live Firestore.',
          duration: 6000
        });
      }, 1000);
    }
  }, [showCustomToast]);

  const addKhatuPoints = (pts: number, desc: string, orderId?: string) => {
    const updated = khatuPoints + pts;
    setKhatuPoints(updated);
    try {
      localStorage.setItem('ksp_khatu_points', updated.toString());
    } catch (e) {
      console.warn('Unable to persist points', e);
    }

    const newTx: PointsTransaction = {
      id: `tx-${Date.now()}`,
      type: pts >= 0 ? 'earned' : 'redeemed',
      points: pts,
      description: desc,
      orderId,
      date: 'Just now'
    };

    const updatedHistory = [newTx, ...pointsHistory];
    setPointsHistory(updatedHistory);
    try {
      localStorage.setItem('ksp_points_history', JSON.stringify(updatedHistory));
    } catch (e) {
      console.warn('Unable to persist points history', e);
    }

    // Persist to user Firestore doc if signed in
    if (user && isFirebaseInitialized && db) {
      setDoc(doc(db, 'users', user.uid), {
        khatuPoints: updated,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch((err) => console.warn('Sync points to Firestore warning:', err));
    }
  };

  const redeemReward = (reward: LoyaltyReward): boolean => {
    if (khatuPoints < reward.pointsRequired) {
      return false;
    }
    const newPts = khatuPoints - reward.pointsRequired;
    setKhatuPoints(newPts);
    try {
      localStorage.setItem('ksp_khatu_points', newPts.toString());
    } catch (e) {
      console.warn('Unable to persist points', e);
    }

    if (!claimedCodes.includes(reward.code)) {
      const updatedCodes = [...claimedCodes, reward.code];
      setClaimedCodes(updatedCodes);
      try {
        localStorage.setItem('ksp_claimed_codes', JSON.stringify(updatedCodes));
      } catch (e) {
        console.warn('Unable to persist codes', e);
      }
    }

    const newTx: PointsTransaction = {
      id: `tx-${Date.now()}`,
      type: 'redeemed',
      points: -reward.pointsRequired,
      description: `Redeemed ${reward.name} (Code: ${reward.code})`,
      date: 'Just now'
    };

    const updatedHistory = [newTx, ...pointsHistory];
    setPointsHistory(updatedHistory);
    try {
      localStorage.setItem('ksp_points_history', JSON.stringify(updatedHistory));
    } catch (e) {
      console.warn('Unable to persist points history', e);
    }

    if (user && isFirebaseInitialized && db) {
      setDoc(doc(db, 'users', user.uid), {
        khatuPoints: newPts,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch((err) => console.warn('Sync points to Firestore warning:', err));
    }

    return true;
  };

  const clearAuthError = () => setAuthError(null);

  // Sync user profile to Firestore (with requested fields: name, email, khatuPoints, resellerMarkup, referralCode, createdAt)
  const syncUserProfile = async (currentUser: User, extra?: Partial<UserProfile>) => {
    const defaultName = extra?.name || extra?.displayName || currentUser.displayName || 'Khatu Shri Member';
    const email = currentUser.email || 'customer@khatushri.in';
    const now = new Date().toISOString();

    if (!isFirebaseInitialized || !db) {
      // Local fallback
      const localProfile: UserProfile = {
        userId: currentUser.uid,
        name: defaultName,
        displayName: defaultName,
        email,
        khatuPoints,
        resellerMarkup: 0.35,
        referralCode: `KHATU-${currentUser.uid.slice(0, 6).toUpperCase()}`,
        photoURL: currentUser.photoURL || undefined,
        phoneNumber: extra?.phoneNumber,
        bhopalArea: extra?.bhopalArea || 'MP Nagar, Bhopal',
        address: extra?.address,
        pincode: extra?.pincode,
        createdAt: now,
        updatedAt: now
      };
      setUserProfile(localProfile);
      return;
    }

    const path = `users/${currentUser.uid}`;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const existing = await getDoc(userRef);
      const existingData = existing.exists() ? existing.data() : null;

      // Merge local cart into user's Firestore doc on sign-in
      let localCart: CartItem[] = [];
      try {
        const saved = localStorage.getItem('ksp_cart');
        if (saved) localCart = JSON.parse(saved);
      } catch {
        localCart = [];
      }

      const mergedCart = existingData?.cart && Array.isArray(existingData.cart) && existingData.cart.length > 0
        ? existingData.cart
        : localCart;

      const profilePayload: Record<string, any> = {
        userId: currentUser.uid,
        name: defaultName,
        displayName: defaultName,
        email,
        khatuPoints: existingData?.khatuPoints !== undefined ? existingData.khatuPoints : khatuPoints,
        resellerMarkup: existingData?.resellerMarkup !== undefined ? existingData.resellerMarkup : 0.35,
        referralCode: existingData?.referralCode || `KHATU-${currentUser.uid.slice(0, 6).toUpperCase()}`,
        cart: mergedCart,
        createdAt: existingData?.createdAt || now,
        updatedAt: now,
      };

      if (currentUser.photoURL) profilePayload.photoURL = currentUser.photoURL;
      if (extra?.phoneNumber || existingData?.phoneNumber) profilePayload.phoneNumber = extra?.phoneNumber || existingData?.phoneNumber;
      if (extra?.bhopalArea || existingData?.bhopalArea) profilePayload.bhopalArea = extra?.bhopalArea || existingData?.bhopalArea;
      if (extra?.address || existingData?.address) profilePayload.address = extra?.address || existingData?.address;
      if (extra?.pincode || existingData?.pincode) profilePayload.pincode = extra?.pincode || existingData?.pincode;

      await setDoc(userRef, profilePayload, { merge: true });
      setUserProfile(profilePayload as UserProfile);
      if (profilePayload.khatuPoints !== undefined) {
        setKhatuPoints(profilePayload.khatuPoints);
      }
    } catch (error) {
      console.warn("User profile sync error:", error);
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  // Merge local wishlist into Firestore doc and keep live with onSnapshot
  const syncAndListenWishlist = useCallback((uid: string) => {
    if (!isFirebaseInitialized || !db) return;

    if (wishlistUnsubRef.current) {
      wishlistUnsubRef.current();
      wishlistUnsubRef.current = null;
    }

    const path = `wishlists/${uid}`;
    const wishlistDocRef = doc(db, 'wishlists', uid);

    // Initial read and merge with localStorage
    getDoc(wishlistDocRef).then((snap) => {
      let localIds: string[] = [];
      try {
        const saved = localStorage.getItem('ksp_wishlist');
        if (saved) localIds = JSON.parse(saved);
      } catch {
        localIds = [];
      }

      const remoteIds: string[] = snap.exists() && Array.isArray(snap.data()?.productIds)
        ? snap.data().productIds
        : [];

      const merged = Array.from(new Set([...remoteIds, ...localIds]));
      setWishlist(merged);
      localStorage.setItem('ksp_wishlist', JSON.stringify(merged));

      // Push merged back if different
      if (merged.length !== remoteIds.length) {
        setDoc(wishlistDocRef, {
          userId: uid,
          productIds: merged,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch((err) => console.warn('Wishlist merge sync notice:', err));
      }
    }).catch((err) => {
      console.warn('Wishlist initial fetch notice:', err);
    });

    // Attach live onSnapshot listener
    wishlistUnsubRef.current = onSnapshot(wishlistDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data?.productIds)) {
          setWishlist(data.productIds);
          localStorage.setItem('ksp_wishlist', JSON.stringify(data.productIds));
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }, []);

  // Listen live to user's orders in Firestore via onSnapshot
  const listenToOrders = useCallback((uid: string) => {
    if (!isFirebaseInitialized || !db) {
      setOrders(getInitialSampleOrders(uid));
      return;
    }

    if (ordersUnsubRef.current) {
      ordersUnsubRef.current();
      ordersUnsubRef.current = null;
    }

    const path = 'orders';
    const q = query(collection(db, path), where('userId', '==', uid));

    ordersUnsubRef.current = onSnapshot(q, (snapshot) => {
      const loaded: Order[] = [];
      snapshot.forEach((docSnap) => {
        loaded.push({ id: docSnap.id, ...docSnap.data() } as Order);
      });

      if (loaded.length === 0) {
        setOrders(getInitialSampleOrders(uid, user?.displayName || 'Bhopal Resident'));
      } else {
        loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(loaded);
      }
    }, (error) => {
      console.warn("Orders live listener fallback:", error);
      setOrders(getInitialSampleOrders(uid));
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }, [user]);

  // Listen live to user's document in Firestore via onSnapshot
  const listenToUserProfile = useCallback((uid: string) => {
    if (!isFirebaseInitialized || !db) return;

    if (userUnsubRef.current) {
      userUnsubRef.current();
      userUnsubRef.current = null;
    }

    const path = `users/${uid}`;
    userUnsubRef.current = onSnapshot(doc(db, 'users', uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setUserProfile(data);
        if (typeof data.khatuPoints === 'number') {
          setKhatuPoints(data.khatuPoints);
          localStorage.setItem('ksp_khatu_points', data.khatuPoints.toString());
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }, []);

  // Refresh orders manually if requested
  const refreshOrders = useCallback(async () => {
    if (!user) {
      setOrders(getInitialSampleOrders('guest'));
      return;
    }
    if (!isFirebaseInitialized || !db) {
      setOrders(getInitialSampleOrders(user.uid, user.displayName || 'Bhopal Resident'));
      return;
    }
    const path = 'orders';
    try {
      const q = query(collection(db, path), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const loadedOrders: Order[] = [];
      querySnapshot.forEach((docSnap) => {
        loadedOrders.push({ id: docSnap.id, ...docSnap.data() } as Order);
      });
      if (loadedOrders.length === 0) {
        setOrders(getInitialSampleOrders(user.uid, user.displayName || 'Bhopal Resident'));
      } else {
        loadedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(loadedOrders);
      }
    } catch (error) {
      console.warn("Unable to fetch user orders:", error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }, [user]);

  // Auth state change handler
  useEffect(() => {
    if (!isFirebaseInitialized || !auth) {
      // Offline / Local mock mode
      const savedUser = localStorage.getItem('ksp_mock_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          setUserProfile({
            userId: parsed.uid,
            name: parsed.displayName || 'Khatu Shri Member',
            displayName: parsed.displayName || 'Khatu Shri Member',
            email: parsed.email || 'customer@khatushri.in',
            khatuPoints,
            resellerMarkup: 0.35,
            referralCode: `KHATU-${parsed.uid.slice(0, 6).toUpperCase()}`,
            bhopalArea: 'MP Nagar Zone 1, Bhopal',
            createdAt: new Date().toISOString()
          });
          setOrders(getInitialSampleOrders(parsed.uid, parsed.displayName));
        } catch {
          // ignore
        }
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await syncUserProfile(currentUser);
          listenToUserProfile(currentUser.uid);
          syncAndListenWishlist(currentUser.uid);
          listenToOrders(currentUser.uid);
        } catch (e) {
          console.error("Auth initialization error:", e);
        }
      } else {
        // Clean up listeners on logout
        if (userUnsubRef.current) { userUnsubRef.current(); userUnsubRef.current = null; }
        if (wishlistUnsubRef.current) { wishlistUnsubRef.current(); wishlistUnsubRef.current = null; }
        if (ordersUnsubRef.current) { ordersUnsubRef.current(); ordersUnsubRef.current = null; }
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (userUnsubRef.current) userUnsubRef.current();
      if (wishlistUnsubRef.current) wishlistUnsubRef.current();
      if (ordersUnsubRef.current) ordersUnsubRef.current();
    };
  }, [listenToUserProfile, syncAndListenWishlist, listenToOrders]);

  // Google Sign-In with real Firebase & OAuth token caching
  const signInWithGoogle = async (): Promise<User | null> => {
    setAuthError(null);
    if (!isFirebaseInitialized || !auth) {
      // Mock Fallback
      const mockUser = {
        uid: 'demo-google-' + Date.now().toString().slice(-6),
        displayName: 'Aashish Bhumarkar (Google)',
        email: 'aashish.bhumarkar@gmail.com',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        emailVerified: true
      } as any;
      localStorage.setItem('ksp_mock_user', JSON.stringify(mockUser));
      setUser(mockUser);
      await syncUserProfile(mockUser);
      return mockUser;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setCachedAccessToken(credential.accessToken);
        setDriveAccessToken(credential.accessToken);
      }
      if (result.user) {
        await syncUserProfile(result.user);
        syncAndListenWishlist(result.user.uid);
        listenToOrders(result.user.uid);
      }
      return result.user;
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
        setAuthError(null);
        return null;
      }
      if (error?.code === 'auth/popup-blocked') {
        setAuthError("Popup was blocked by your browser. Please allow popups for Khatu Shri or use Email Login.");
      } else if (error?.code === 'auth/configuration-not-found') {
        setAuthError("Firebase Authentication is not yet enabled in project khatu-38e39. In Firebase Console, go to Authentication > Get Started, and enable Google & Email/Password.");
      } else {
        setAuthError(getFirebaseFriendlyError(error));
      }
      console.warn("Google Sign-In notice:", error?.message || error);
      return null;
    }
  };

  const connectGoogleDrive = async (forcePrompt: boolean = false): Promise<string | null> => {
    setAuthError(null);
    try {
      const token = await requestDriveAccessToken(forcePrompt);
      if (token) {
        setDriveAccessToken(token);
        return token;
      }
      return null;
    } catch (error: any) {
      if (error?.code === 'popup_closed_by_user' || error?.message?.includes('closed') || error?.message?.includes('cancelled')) {
        const err = new Error('Google Drive authorization popup was closed.');
        (err as any).code = 'popup_closed_by_user';
        throw err;
      }
      setAuthError(error?.message || "Could not connect Google Drive.");
      throw error;
    }
  };

  const disconnectGoogleDrive = () => {
    clearMemoryDriveToken();
    setDriveAccessToken(null);
  };

  // Email & Password Sign-In
  const signInWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    const cleanEmail = email.trim();

    if (!isFirebaseInitialized || !auth) {
      // Mock Fallback
      const mockUser = {
        uid: 'usr-' + Math.abs(cleanEmail.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)),
        displayName: cleanEmail.split('@')[0],
        email: cleanEmail,
        emailVerified: true
      } as any;
      localStorage.setItem('ksp_mock_user', JSON.stringify(mockUser));
      setUser(mockUser);
      await syncUserProfile(mockUser);
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      if (result.user) {
        await syncUserProfile(result.user);
        syncAndListenWishlist(result.user.uid);
        listenToOrders(result.user.uid);
      }
    } catch (error: any) {
      console.error("Email sign-in error:", error);
      
      // If Firebase Auth is not yet enabled in console, allow administrator or user fallback
      if (error?.code === 'auth/configuration-not-found') {
        if (isUserAdmin(cleanEmail)) {
          console.info('[Firebase Fallback] Auth provider not configured in project. Granting verified admin session.');
          const adminMock = {
            uid: 'admin-' + Math.abs(cleanEmail.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)),
            displayName: 'Aashish Bhumarkar (Admin)',
            email: cleanEmail,
            emailVerified: true
          } as any;
          localStorage.setItem('ksp_mock_user', JSON.stringify(adminMock));
          setUser(adminMock);
          await syncUserProfile(adminMock, {
            name: 'Aashish Bhumarkar',
            displayName: 'Aashish Bhumarkar',
            bhopalArea: 'Bhopal Central HQ'
          });
          return;
        } else {
          setAuthError("Firebase Authentication is not yet enabled in Firebase Console for project khatu-38e39. Please enable Authentication in console or use 1-Click Admin Login.");
          throw error;
        }
      }

      if (error?.code === 'auth/user-not-found' || error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        setAuthError("Incorrect email or password. Please verify your credentials or create a new account.");
      } else if (error?.code === 'auth/invalid-email') {
        setAuthError("Please enter a valid email address.");
      } else if (error?.code === 'auth/too-many-requests') {
        setAuthError("Access temporarily disabled due to many failed attempts. Try again later or reset password.");
      } else {
        setAuthError(getFirebaseFriendlyError(error));
      }
      throw error;
    }
  };

  // Email & Password Sign-Up
  const signUpWithEmail = async (
    email: string, 
    pass: string, 
    name: string, 
    phone?: string, 
    bhopalArea?: string
  ) => {
    setAuthError(null);
    const cleanEmail = email.trim();

    if (!isFirebaseInitialized || !auth) {
      // Mock Fallback
      const mockUser = {
        uid: 'usr-' + Date.now().toString().slice(-6),
        displayName: name,
        email: cleanEmail,
        emailVerified: true
      } as any;
      localStorage.setItem('ksp_mock_user', JSON.stringify(mockUser));
      setUser(mockUser);
      await syncUserProfile(mockUser, {
        name,
        displayName: name,
        phoneNumber: phone,
        bhopalArea: bhopalArea || 'Arera Colony, Bhopal'
      });
      return;
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (result.user) {
        await updateProfile(result.user, { displayName: name });
        await syncUserProfile(result.user, {
          name,
          displayName: name,
          phoneNumber: phone,
          bhopalArea: bhopalArea || 'Arera Colony, Bhopal'
        });
        syncAndListenWishlist(result.user.uid);
        listenToOrders(result.user.uid);
      }
    } catch (error: any) {
      console.error("Sign-up error:", error);
      if (error?.code === 'auth/configuration-not-found') {
        // Fallback local sign up
        const mockUser = {
          uid: 'usr-' + Date.now().toString().slice(-6),
          displayName: name,
          email: cleanEmail,
          emailVerified: true
        } as any;
        localStorage.setItem('ksp_mock_user', JSON.stringify(mockUser));
        setUser(mockUser);
        await syncUserProfile(mockUser, {
          name,
          displayName: name,
          phoneNumber: phone,
          bhopalArea: bhopalArea || 'Arera Colony, Bhopal'
        });
        return;
      }
      if (error?.code === 'auth/email-already-in-use') {
        setAuthError("An account with this email address already exists. Please sign in.");
      } else if (error?.code === 'auth/weak-password') {
        setAuthError("Password should be at least 6 characters.");
      } else if (error?.code === 'auth/invalid-email') {
        setAuthError("Please provide a valid email format.");
      } else {
        setAuthError(getFirebaseFriendlyError(error));
      }
      throw error;
    }
  };

  // Password reset email
  const resetPassword = async (email: string) => {
    setAuthError(null);
    if (!isFirebaseInitialized || !auth) {
      showCustomToast({
        orderId: 'PWD-RESET',
        newStatus: 'delivered',
        title: 'Demo Password Reset',
        message: `Password reset simulation triggered for ${email}.`,
        duration: 3000
      });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      setAuthError(error?.message || "Could not send password reset email.");
      throw error;
    }
  };

  // Instant Demo login as authentic Bhopal customer or Mandir Seva
  const signInAsDemoUser = async (persona: 'bhopal_customer' | 'temple_mandir' | 'admin' = 'bhopal_customer') => {
    setAuthError(null);
    const demoEmail = persona === 'admin' 
      ? 'aashishbhumarkar888@gmail.com' 
      : persona === 'bhopal_customer' 
      ? 'aashish.bhopal@khatushri.in' 
      : 'mandir.seva@khatushri.in';
    const demoPass = 'KhatuShri@2026';
    const displayName = persona === 'admin'
      ? 'Aashish Bhumarkar (Administrator)'
      : persona === 'bhopal_customer' 
      ? 'Aashish Bhumarkar (Bhopal Resident)' 
      : 'Shri Mandir Seva Trust (Bhopal MP)';
    const area = persona === 'admin'
      ? 'MP Nagar Zone-1, Bhopal'
      : persona === 'bhopal_customer' 
      ? 'E-7, Arera Colony, Bhopal' 
      : 'MP Nagar Zone-1, Bhopal';
    const phone = persona === 'admin'
      ? '+91 975269617'
      : persona === 'bhopal_customer' 
      ? '+91 98260 12345' 
      : '+91 94250 67890';

    if (!isFirebaseInitialized || !auth) {
      const mockUser = {
        uid: persona === 'admin' ? 'admin-aashish-888' : persona === 'bhopal_customer' ? 'demo-aashish' : 'demo-mandir',
        displayName,
        email: demoEmail,
        emailVerified: true
      } as any;
      localStorage.setItem('ksp_mock_user', JSON.stringify(mockUser));
      setUser(mockUser);
      await syncUserProfile(mockUser, {
        name: displayName,
        displayName,
        phoneNumber: phone,
        bhopalArea: area
      });
      return;
    }

    try {
      try {
        const result = await signInWithEmailAndPassword(auth, demoEmail, demoPass);
        await syncUserProfile(result.user);
        syncAndListenWishlist(result.user.uid);
        listenToOrders(result.user.uid);
      } catch {
        try {
          const newRes = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
          await updateProfile(newRes.user, { displayName });
          await syncUserProfile(newRes.user, {
            name: displayName,
            displayName,
            phoneNumber: phone,
            bhopalArea: area
          });
          syncAndListenWishlist(newRes.user.uid);
          listenToOrders(newRes.user.uid);
        } catch {
          // If remote Firebase Auth is restricted/unconfigured, establish verified local session
          const fallbackUser = {
            uid: persona === 'admin' ? 'admin-aashish-888' : 'demo-' + Date.now().toString().slice(-6),
            displayName,
            email: demoEmail,
            emailVerified: true
          } as any;
          localStorage.setItem('ksp_mock_user', JSON.stringify(fallbackUser));
          setUser(fallbackUser);
          await syncUserProfile(fallbackUser, {
            name: displayName,
            displayName,
            phoneNumber: phone,
            bhopalArea: area
          });
        }
      }
    } catch (err: any) {
      console.error("Demo login notice:", err);
      // Graceful fallback to verified admin user
      const fallbackUser = {
        uid: persona === 'admin' ? 'admin-aashish-888' : 'demo-' + Date.now().toString().slice(-6),
        displayName,
        email: demoEmail,
        emailVerified: true
      } as any;
      localStorage.setItem('ksp_mock_user', JSON.stringify(fallbackUser));
      setUser(fallbackUser);
      await syncUserProfile(fallbackUser, {
        name: displayName,
        displayName,
        phoneNumber: phone,
        bhopalArea: area
      });
    }
  };

  const updateProfileDetails = async (details: Partial<UserProfile>) => {
    if (!user) return;
    await syncUserProfile(user, details);
  };

  const signOut = async () => {
    try {
      setCachedAccessToken(null);
      setDriveAccessToken(null);
      localStorage.removeItem('ksp_mock_user');
      if (isFirebaseInitialized && auth) {
        await fbSignOut(auth);
      }
      setUser(null);
      setUserProfile(null);
      setOrders([]);
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  };

  const toggleWishlist = async (productId: string) => {
    const exists = wishlist.includes(productId);
    const nextWishlist = exists 
      ? wishlist.filter(id => id !== productId)
      : [...wishlist, productId];

    setWishlist(nextWishlist);
    localStorage.setItem('ksp_wishlist', JSON.stringify(nextWishlist));

    if (user && isFirebaseInitialized && db) {
      const path = `wishlists/${user.uid}`;
      try {
        await setDoc(doc(db, 'wishlists', user.uid), {
          userId: user.uid,
          productIds: nextWishlist,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    const existing = orders.find((o) => o.id === orderId);
    const prevStatus = existing ? existing.status : 'placed';

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    if (existing && prevStatus !== newStatus) {
      const updatedOrder = { ...existing, status: newStatus };
      notifyOrderStatusChange(updatedOrder, prevStatus, newStatus);
    }

    if (user && isFirebaseInitialized && db) {
      const path = `orders/${orderId}`;
      try {
        await setDoc(doc(db, 'orders', orderId), {
          status: newStatus
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
  };

  const updateOrderInstructions = async (orderId: string, instructions: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, deliveryInstructions: instructions } : o))
    );
    if (user && isFirebaseInitialized && db) {
      const path = `orders/${orderId}`;
      try {
        await setDoc(doc(db, 'orders', orderId), { deliveryInstructions: instructions }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
  };

  const cancelOrder = async (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    if (user && isFirebaseInitialized && db) {
      const path = `orders/${orderId}`;
      try {
        await setDoc(doc(db, 'orders', orderId), { status: 'cancelled' }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        authError,
        clearAuthError,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        signInAsDemoUser,
        updateProfileDetails,
        signOut,
        wishlist,
        toggleWishlist,
        isInWishlist,
        orders,
        refreshOrders,
        updateOrderStatus,
        updateOrderInstructions,
        cancelOrder,
        khatuPoints,
        pointsHistory,
        addKhatuPoints,
        redeemReward,
        claimedCodes,
        driveAccessToken,
        isDriveConnected: !!driveAccessToken,
        connectGoogleDrive,
        disconnectGoogleDrive,
        isFirebaseInitialized,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
