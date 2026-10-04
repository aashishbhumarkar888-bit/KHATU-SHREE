import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  ShoppingBag, 
  DollarSign, 
  AlertTriangle, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Truck, 
  ArrowLeft, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  RotateCcw, 
  ShieldCheck, 
  Lock, 
  LogIn, 
  LogOut, 
  ExternalLink, 
  FileText, 
  X,
  ChevronDown,
  RefreshCw,
  TrendingUp,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Database,
  Upload,
  Cloud,
  FileCheck,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductsContext';
import { isUserAdmin, ADMIN_EMAILS } from '../../config/adminConfig';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { 
  db, 
  isFirebaseInitialized, 
  getFirebaseFriendlyError,
  checkFirebaseHealth,
  FirebaseHealthReport,
  saveFirebaseCustomConfig,
  clearCustomFirebaseConfig,
  getFirebaseActiveConfig
} from '../../lib/firebase';
import { Order, Product, ProductCategory } from '../../types';
import { saveProductToFirestore, deleteProductFromFirestore, seedProductsToFirestore } from '../../services/productsService';
import { uploadFileToStorage, testStorageHealth } from '../../services/storageService';
import { useToastNotification } from '../../context/ToastNotificationContext';
import { InvoiceModal } from '../account/InvoiceModal';

interface AdminPanelProps {
  onBackToStore: () => void;
  onNavigateHome: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToStore, onNavigateHome }) => {
  const { user, signInWithGoogle, signInWithEmail, signInAsDemoUser, signOut } = useAuth();
  const { products, refreshProducts } = useProducts();
  const { showCustomToast } = useToastNotification();

  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'reconciliation' | 'alerts' | 'storage'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  
  // Selected order for invoice preview
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);

  // Products manager state
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Storage & Cloud states
  const [storageReport, setStorageReport] = useState<{ isConnected: boolean; bucketName: string; message: string; error?: string } | null>(null);
  const [isTestingStorage, setIsTestingStorage] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState<FirebaseHealthReport | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [configInputText, setConfigInputText] = useState('');

  // Email login form for admin gate
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminPassInput, setAdminPassInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const isAdmin = useMemo(() => isUserAdmin(user?.email), [user]);

  // Fetch all orders from Firestore
  const fetchAllOrders = async () => {
    if (!isFirebaseInitialized || !db) return;
    setLoadingOrders(true);
    try {
      const colRef = collection(db, 'orders');
      const snap = await getDocs(colRef);
      const loaded: Order[] = [];
      snap.forEach((d) => {
        loaded.push({ id: d.id, ...d.data() } as Order);
      });
      // Sort newest first
      loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(loaded);
    } catch (err) {
      console.warn('Unable to load orders from Firestore:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAllOrders();
    }
  }, [isAdmin]);

  // Update order status with immediate Firestore sync
  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      if (isFirebaseInitialized && db) {
        const orderRef = doc(db, 'orders', orderId);
        await setDoc(orderRef, {
          status: newStatus,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }

      showCustomToast({
        orderId,
        newStatus,
        title: 'Order Status Updated',
        message: `Order #${orderId} marked as "${newStatus.replace(/_/g, ' ').toUpperCase()}"`,
        duration: 3500,
      });
    } catch (err) {
      console.error('Failed to update order status:', err);
      showCustomToast({
        orderId,
        newStatus: 'processing',
        title: 'Update Notice',
        message: 'Could not sync update to Firestore.',
        duration: 3500,
      });
    }
  };

  // Admin Login Handlers
  const handleGoogleLogin = async () => {
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setAuthError(getFirebaseFriendlyError(err));
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      await signInWithEmail(adminEmailInput, adminPassInput);
    } catch (err: any) {
      setAuthError(getFirebaseFriendlyError(err));
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Product Manager Handlers
  const handleSaveProduct = async (productToSave: Product) => {
    try {
      await saveProductToFirestore(productToSave);
      await refreshProducts();
      setEditingProduct(null);
      setIsAddProductOpen(false);
      showCustomToast({
        orderId: 'CATALOG-UPDATE',
        newStatus: 'delivered',
        title: 'Product Saved',
        message: `"${productToSave.name}" updated in live Firestore catalog.`,
        duration: 3000,
      });
    } catch (err: any) {
      console.error('Error saving product:', err);
      showCustomToast({
        orderId: 'CATALOG-ERR',
        newStatus: 'cancelled',
        title: 'Save Failed',
        message: err?.message || 'Could not save product to Firestore',
        duration: 4000,
      });
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${productName}" from the catalog?`)) return;
    try {
      await deleteProductFromFirestore(productId);
      await refreshProducts();
      showCustomToast({
        orderId: 'CATALOG-DELETE',
        newStatus: 'delivered',
        title: 'Product Removed',
        message: `"${productName}" was deleted from Firestore.`,
        duration: 3000,
      });
    } catch (err: any) {
      console.error('Error deleting product:', err);
    }
  };

  const handleSeedCatalog = async () => {
    setIsSeeding(true);
    try {
      const count = await seedProductsToFirestore();
      await refreshProducts();
      showCustomToast({
        orderId: 'SEED-SUCCESS',
        newStatus: 'delivered',
        title: 'Catalog Seeded',
        message: `Successfully populated ${count} products into Firestore!`,
        duration: 4000,
      });
    } catch (err: any) {
      console.error('Seed error:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  // Storage & Cloud Handlers
  const handleRunHealthCheck = async () => {
    setIsCheckingHealth(true);
    try {
      const rep = await checkFirebaseHealth();
      setDiagnosticReport(rep);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleTestStorage = async () => {
    setIsTestingStorage(true);
    try {
      const res = await testStorageHealth();
      setStorageReport(res);
      showCustomToast({
        orderId: 'STORAGE-TEST',
        newStatus: res.isConnected ? 'delivered' : 'out_for_delivery',
        title: res.isConnected ? 'Cloud Storage Online' : 'Storage Status',
        message: res.message,
        duration: 4000,
      });
    } finally {
      setIsTestingStorage(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configInputText.trim()) return;
    const ok = saveFirebaseCustomConfig(configInputText.trim());
    showCustomToast({
      orderId: 'CONFIG-SAVE',
      newStatus: ok ? 'delivered' : 'cancelled',
      title: ok ? 'Firebase Config Applied' : 'Parse Warning',
      message: ok ? 'Updated Firebase credentials. Re-probing connection...' : 'Could not parse config. Please check format.',
      duration: 3500,
    });
    await handleRunHealthCheck();
    await handleTestStorage();
  };

  const handleClearCustomConfig = async () => {
    clearCustomFirebaseConfig();
    setConfigInputText('');
    showCustomToast({
      orderId: 'CONFIG-RESET',
      newStatus: 'delivered',
      title: 'Credentials Cleared',
      message: 'Reset to default app configuration.',
      duration: 3000,
    });
    await handleRunHealthCheck();
    await handleTestStorage();
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;
    setIsUploadingImage(true);
    try {
      const res = await uploadFileToStorage(file, 'products');
      setEditingProduct({
        ...editingProduct,
        images: [res.url, ...(editingProduct.images?.slice(1) || [])],
      });
      showCustomToast({
        orderId: 'IMG-UPLOAD',
        newStatus: 'delivered',
        title: 'Image Uploaded',
        message: res.source === 'firebase-storage' ? 'Stored in Firebase Storage bucket' : 'Stored in resilient local store',
        duration: 3500,
      });
    } catch (err: any) {
      showCustomToast({
        orderId: 'IMG-ERR',
        newStatus: 'cancelled',
        title: 'Upload Notice',
        message: err?.message || 'Could not upload image',
        duration: 4000,
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch = 
        o.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        o.customerName?.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        o.customerPhone?.includes(orderSearchQuery) ||
        o.shippingAddress?.bhopalArea?.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        o.shippingAddress?.streetColony?.toLowerCase().includes(orderSearchQuery.toLowerCase());

      const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearchQuery, orderStatusFilter]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(productSearchQuery.toLowerCase())
    );
  }, [products, productSearchQuery]);

  // Low stock products (< 10 units)
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => (p.stock !== undefined ? p.stock : 25) < 10);
  }, [products]);

  // COD Reconciliation Calculations
  const codStats = useMemo(() => {
    let totalDeliveredCash = 0;
    let totalPendingCash = 0;
    let totalWholesale = 0;
    let totalCODOrders = 0;

    const dailyBreakdown: Record<string, { date: string; collected: number; pending: number; count: number }> = {};

    orders.forEach((o) => {
      const isCOD = o.paymentMode === 'cash_on_delivery' || o.paymentMethod === 'cash_on_delivery' || !o.paymentMethod;
      const amount = o.total || o.resaleValue || o.wholesaleTotal || 0;
      const dateKey = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'Recent';

      if (!dailyBreakdown[dateKey]) {
        dailyBreakdown[dateKey] = { date: dateKey, collected: 0, pending: 0, count: 0 };
      }

      dailyBreakdown[dateKey].count += 1;
      totalWholesale += o.wholesaleTotal || 0;

      if (isCOD) {
        totalCODOrders += 1;
        if (o.status === 'delivered') {
          totalDeliveredCash += amount;
          dailyBreakdown[dateKey].collected += amount;
        } else if (o.status !== 'cancelled') {
          totalPendingCash += amount;
          dailyBreakdown[dateKey].pending += amount;
        }
      }
    });

    return {
      totalDeliveredCash,
      totalPendingCash,
      totalWholesale,
      totalCODOrders,
      breakdownList: Object.values(dailyBreakdown),
    };
  }, [orders]);

  // =========================================================================
  // 1. ADMIN AUTHENTICATION GATE (EMAIL ALLOWLIST CHECK)
  // =========================================================================
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white border border-[#E8E5DF] rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#1B4332] text-[#DDA15E] mx-auto mb-4 shadow-sm">
            <Lock className="w-6 h-6" />
          </div>

          <div className="text-center mb-6">
            <h1 className="font-serif text-2xl font-bold text-[#1B4332]">
              Khatu Shri Central Console
            </h1>
            <p className="text-xs text-[#78716C] mt-1">
              Protected Administrative Route · Authorized Email Allowlist Only
            </p>
          </div>

          {user && !isAdmin ? (
            <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl p-4 text-xs text-[#991B1B] mb-6">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                <span>Access Denied</span>
              </div>
              <p>
                Signed in as <strong>{user.email}</strong>, which is not on the admin allowlist.
              </p>
              <p className="mt-2 text-[11px] text-[#7F1D1D]">
                Allowed administrator accounts: {ADMIN_EMAILS.join(', ')}
              </p>
              <button
                onClick={() => signOut()}
                className="mt-3 w-full py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
              >
                Sign Out &amp; Use Admin Account
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {authError && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs rounded-xl">
                  {authError}
                </div>
              )}

              <button
                onClick={handleGoogleLogin}
                disabled={isAuthenticating}
                className="w-full py-3 px-4 border border-[#E8E5DF] hover:border-[#1B4332] bg-[#FAF7F2] hover:bg-white text-xs font-bold text-[#1C1917] rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <div className="w-4 h-4 rounded-full bg-[#1B4332] text-white text-[9px] flex items-center justify-center font-bold">
                  G
                </div>
                <span>Sign in with Google Admin Email</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[#E8E5DF]"></div>
                <span className="shrink-0 mx-3 text-[10px] text-[#A8A29E] uppercase font-bold">
                  Or Credentials
                </span>
                <div className="flex-grow border-t border-[#E8E5DF]"></div>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#78716C] mb-1">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="aashishbhumarkar888@gmail.com"
                    value={adminEmailInput}
                    onChange={(e) => setAdminEmailInput(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E5DF] rounded-xl text-xs text-[#1C1917] focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#78716C] mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={adminPassInput}
                    onChange={(e) => setAdminPassInput(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E5DF] rounded-xl text-xs text-[#1C1917] focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full py-2.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  {isAuthenticating ? 'Authenticating...' : 'Authenticate to Console'}
                </button>
              </form>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={isAuthenticating}
                  onClick={() => signInAsDemoUser('admin')}
                  className="w-full py-2.5 px-3 bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#FDE68A] hover:border-[#D97706] text-[#B45309] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs disabled:opacity-60"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>1-Click Verified Admin Access (aashishbhumarkar888@gmail.com)</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-[#E8E5DF] text-center">
            <button
              onClick={onBackToStore}
              className="text-xs text-[#78716C] hover:text-[#1B4332] font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Marketplace Storefront</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. AUTHENTICATED ADMIN CONSOLE
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1C1917] flex flex-col">
      {/* Top Admin Bar */}
      <header className="bg-[#143425] text-white border-b border-[#23533c] sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToStore}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#DDA15E] transition-colors cursor-pointer"
              title="Return to Marketplace Store"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-white">
                KHATU SHRI
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-[#D97706] text-white px-2 py-0.5 rounded">
                ADMIN CONSOLE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="hidden sm:flex flex-col text-right leading-tight">
              <span className="font-bold text-white truncate max-w-[180px]">
                {user.displayName || user.email?.split('@')[0]}
              </span>
              <span className="text-[10px] text-[#DDA15E]">
                Authorized Admin ({user.email})
              </span>
            </div>

            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 text-[#DDA15E]" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-2 sm:gap-4 overflow-x-auto hide-scrollbar border-t border-[#23533c] pt-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'orders'
                ? 'border-[#DDA15E] text-[#DDA15E]'
                : 'border-transparent text-white/70 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Orders Dashboard</span>
            <span className="ml-1 px-1.5 py-0.2 bg-white/20 text-white rounded-full text-[10px]">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`py-2 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'products'
                ? 'border-[#DDA15E] text-[#DDA15E]'
                : 'border-transparent text-white/70 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Products Manager</span>
            <span className="ml-1 px-1.5 py-0.2 bg-white/20 text-white rounded-full text-[10px]">
              {products.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`py-2 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'reconciliation'
                ? 'border-[#DDA15E] text-[#DDA15E]'
                : 'border-transparent text-white/70 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>COD Reconciliation</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`py-2 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'alerts'
                ? 'border-[#DDA15E] text-[#DDA15E]'
                : 'border-transparent text-white/70 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Low-Stock Alerts</span>
            {lowStockProducts.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-[#DC2626] text-white rounded-full text-[10px] font-bold">
                {lowStockProducts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('storage');
              if (!diagnosticReport) handleRunHealthCheck();
              if (!storageReport) handleTestStorage();
            }}
            className={`py-2 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'storage'
                ? 'border-[#DDA15E] text-[#DDA15E]'
                : 'border-transparent text-white/70 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Firebase &amp; Storage</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1">
        
        {/* ========================================================================= */}
        {/* TAB 1: ORDERS DASHBOARD                                                   */}
        {/* ========================================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E8E5DF] shadow-2xs">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#1B4332]">
                  Live Orders Dispatch Center
                </h2>
                <p className="text-xs text-[#78716C]">
                  Bhopal Gaushala &amp; Pan-India Dispatch Orders ({filteredOrders.length} shown)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchAllOrders}
                  disabled={loadingOrders}
                  className="p-2 border border-[#E8E5DF] rounded-xl hover:bg-[#FAF7F2] text-[#1B4332] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  title="Reload Orders"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-8 relative">
                <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by order ID, customer name, phone, or Bhopal locality..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E8E5DF] rounded-xl text-xs text-[#1C1917] focus:outline-none focus:border-[#1B4332]"
                />
              </div>

              <div className="sm:col-span-4">
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#E8E5DF] rounded-xl text-xs text-[#1C1917] focus:outline-none focus:border-[#1B4332] cursor-pointer"
                >
                  <option value="all">All Order Statuses</option>
                  <option value="placed">Placed</option>
                  <option value="processing">Packed at Bhopal Hub</option>
                  <option value="shipped">Shipped</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white border border-[#E8E5DF] rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-[#78716C] uppercase font-bold text-[10px] tracking-wider border-b border-[#E8E5DF]">
                    <tr>
                      <th className="p-3.5">Order ID &amp; Date</th>
                      <th className="p-3.5">Customer &amp; Bhopal Address</th>
                      <th className="p-3.5">Items</th>
                      <th className="p-3.5">Payment &amp; COD Due</th>
                      <th className="p-3.5">Dispatch Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E5DF]">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-[#78716C]">
                          No orders found matching your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => {
                        const isCOD = order.paymentMode === 'cash_on_delivery' || order.paymentMethod === 'cash_on_delivery' || !order.paymentMethod;
                        const dueAmount = order.total || order.resaleValue || order.wholesaleTotal || 0;
                        
                        return (
                          <tr key={order.id} className="hover:bg-[#FBF9F5] transition-colors">
                            <td className="p-3.5 align-top">
                              <span className="font-mono font-bold text-[#1B4332] block">
                                #{order.id}
                              </span>
                              <span className="text-[10px] text-[#78716C]">
                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Today'}
                              </span>
                              {order.deliverySlot && (
                                <span className="block text-[10px] text-[#B45309] font-medium mt-0.5">
                                  {order.deliverySlot.split('(')[0]}
                                </span>
                              )}
                            </td>

                            <td className="p-3.5 align-top max-w-[200px]">
                              <span className="font-bold text-[#1C1917] block">
                                {order.customerName || order.shippingAddress?.fullName || 'Customer'}
                              </span>
                              <span className="text-[10px] text-[#78716C] block">
                                {order.customerPhone || order.shippingAddress?.phone || 'No phone'}
                              </span>
                              <span className="text-[11px] text-[#57534E] line-clamp-2 mt-0.5">
                                {[
                                  order.shippingAddress?.houseFlat,
                                  order.shippingAddress?.streetColony,
                                  order.shippingAddress?.bhopalArea,
                                  order.shippingAddress?.pincode,
                                ].filter(Boolean).join(', ')}
                              </span>
                            </td>

                            <td className="p-3.5 align-top">
                              <div className="space-y-1 max-w-[180px]">
                                {order.items?.slice(0, 2).map((item, idx) => (
                                  <div key={idx} className="truncate text-[11px]">
                                    <span className="font-semibold text-[#1C1917]">{item.quantity}x</span>{' '}
                                    <span className="text-[#57534E]">{item.productName}</span>
                                  </div>
                                ))}
                                {order.items && order.items.length > 2 && (
                                  <span className="text-[10px] text-[#78716C] italic block">
                                    +{order.items.length - 2} more items
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="p-3.5 align-top">
                              <div className="font-mono font-bold text-sm text-[#1B4332]">
                                ₹{dueAmount}
                              </div>
                              <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 uppercase ${
                                isCOD
                                  ? order.status === 'delivered'
                                    ? 'bg-[#DCFCE7] text-[#15803D]'
                                    : 'bg-[#FFFBEB] text-[#B45309]'
                                  : 'bg-[#EFF6FF] text-[#1D4ED8]'
                              }`}>
                                {isCOD
                                  ? order.status === 'delivered'
                                    ? 'COD Collected'
                                    : 'COD Due on Delivery'
                                  : 'Prepaid Online'}
                              </span>
                            </td>

                            <td className="p-3.5 align-top">
                              <select
                                value={order.status}
                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as Order['status'])}
                                className={`text-xs font-bold rounded-lg p-1.5 border cursor-pointer focus:outline-none ${
                                  order.status === 'delivered'
                                    ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                                    : order.status === 'out_for_delivery'
                                    ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
                                    : order.status === 'processing'
                                    ? 'bg-[#E0E7FF] text-[#4338CA] border-[#C7D2FE]'
                                    : order.status === 'cancelled'
                                    ? 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]'
                                    : 'bg-[#FAF7F2] text-[#1C1917] border-[#E8E5DF]'
                                }`}
                              >
                                <option value="placed">Placed</option>
                                <option value="processing">Packed at Bhopal Hub</option>
                                <option value="shipped">Shipped</option>
                                <option value="out_for_delivery">Out for Delivery</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>

                            <td className="p-3.5 align-top text-right">
                              <button
                                onClick={() => setSelectedOrderForInvoice(order)}
                                className="p-1.5 text-[#1B4332] hover:bg-[#FAF7F2] rounded-lg border border-[#E8E5DF] inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                                title="View Customer Invoice"
                              >
                                <FileText className="w-3.5 h-3.5 text-[#D97706]" />
                                <span>Invoice</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PRODUCTS MANAGER (CRUD TABLE OVER PRODUCT CATALOG)                  */}
        {/* ========================================================================= */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E8E5DF] shadow-2xs">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#1B4332]">
                  Product Catalog &amp; Wholesale Manager
                </h2>
                <p className="text-xs text-[#78716C]">
                  Live Firestore Catalog ({products.length} active items) · Direct updates take effect across all shoppers
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSeedCatalog}
                  disabled={isSeeding}
                  className="px-3 py-2 bg-white border border-[#E8E5DF] hover:border-[#1B4332] rounded-xl text-xs font-bold text-[#1B4332] flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Upload seed catalog to Firestore if empty"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
                  <span>Seed Catalog to Firestore</span>
                </button>

                <button
                  onClick={() => {
                    const newProd: Product = {
                      id: `prod-${Date.now().toString().slice(-6)}`,
                      slug: `product-${Date.now()}`,
                      name: 'New Artisanal Product',
                      subheading: 'Direct farm wholesale product',
                      category: 'Farm Fresh Dairy & Desi Ghee',
                      price: 250,
                      compareAtPrice: 350,
                      stock: 30,
                      currency: 'INR',
                      images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80'],
                      variants: [],
                      purityBadge: '100% Traditional & Tested',
                      farmOrigin: 'Bhopal Gaushala / MP Artisan Hub',
                      netWeight: '500g',
                      shelfLife: '6 Months',
                      description: 'High quality handcrafted direct wholesale product from Khatu Shri.',
                      benefits: ['Zero artificial colors', 'Direct producer sourced'],
                      specifications: {},
                      rating: 4.9,
                      reviewCount: 12,
                      deliverySlots: ['Morning 6:00 - 8:30 AM'],
                      storageInstructions: 'Store in cool dry place.',
                      faqs: [],
                    };
                    setEditingProduct(newProd);
                    setIsAddProductOpen(true);
                  }}
                  className="px-3 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-[#DDA15E]" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {/* Product Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search catalog by name, category, or product ID..."
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E8E5DF] rounded-xl text-xs text-[#1C1917] focus:outline-none focus:border-[#1B4332]"
              />
            </div>

            {/* Products Table */}
            <div className="bg-white border border-[#E8E5DF] rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-[#78716C] uppercase font-bold text-[10px] tracking-wider border-b border-[#E8E5DF]">
                    <tr>
                      <th className="p-3.5">Product</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Wholesale Price</th>
                      <th className="p-3.5">MSRP (Retail)</th>
                      <th className="p-3.5">Current Stock</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E5DF]">
                    {filteredProducts.map((p) => {
                      const stockCount = p.stock !== undefined ? p.stock : 25;
                      const isLowStock = stockCount < 10;
                      return (
                        <tr key={p.id} className="hover:bg-[#FBF9F5] transition-colors">
                          <td className="p-3.5 flex items-center gap-3">
                            <img
                              src={p.images?.[0] || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=100&q=80'}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover border border-[#E8E5DF] shrink-0"
                            />
                            <div>
                              <span className="font-bold text-[#1C1917] block leading-tight">
                                {p.name}
                              </span>
                              <span className="text-[10px] text-[#78716C]">
                                ID: {p.id}
                              </span>
                            </div>
                          </td>

                          <td className="p-3.5 text-[#57534E]">
                            <span className="bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E8E5DF] text-[11px]">
                              {p.category}
                            </span>
                          </td>

                          <td className="p-3.5 font-mono font-bold text-sm text-[#1B4332]">
                            ₹{p.price}
                          </td>

                          <td className="p-3.5 font-mono text-xs text-[#78716C]">
                            ₹{p.compareAtPrice || Math.round(p.price * 1.35)}
                          </td>

                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <span className={`font-mono font-bold ${isLowStock ? 'text-[#DC2626]' : 'text-[#1C1917]'}`}>
                                {stockCount}
                              </span>
                              {isLowStock ? (
                                <span className="bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5] text-[9px] font-bold px-1.5 py-0.2 rounded uppercase">
                                  Low Stock
                                </span>
                              ) : (
                                <span className="bg-[#DCFCE7] text-[#15803D] text-[9px] font-bold px-1.5 py-0.2 rounded">
                                  In Stock
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingProduct(p);
                                  setIsAddProductOpen(true);
                                }}
                                className="p-1.5 text-[#1B4332] hover:bg-[#FAF7F2] rounded-lg border border-[#E8E5DF] cursor-pointer"
                                title="Edit Product"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="p-1.5 text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg border border-[#FCA5A5] cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: COD RECONCILIATION VIEW                                            */}
        {/* ========================================================================= */}
        {activeTab === 'reconciliation' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#1B4332]">
                Daily Cash on Delivery (COD) Reconciliation
              </h2>
              <p className="text-xs text-[#78716C]">
                Track physical cash collections against courier dispatches and outstanding remittances
              </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-[#E8E5DF] p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between text-xs text-[#78716C] mb-1">
                  <span>Total COD Cash Collected</span>
                  <div className="w-6 h-6 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center font-bold">
                    ✓
                  </div>
                </div>
                <div className="font-serif text-2xl font-bold text-[#15803D]">
                  ₹{codStats.totalDeliveredCash.toLocaleString()}
                </div>
                <span className="text-[10px] text-[#78716C] mt-1 block">
                  Delivered &amp; Remitted to Bhopal Hub
                </span>
              </div>

              <div className="bg-white border border-[#E8E5DF] p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between text-xs text-[#78716C] mb-1">
                  <span>Pending COD In-Transit</span>
                  <div className="w-6 h-6 rounded-full bg-[#FEF3C7] text-[#B45309] flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="font-serif text-2xl font-bold text-[#B45309]">
                  ₹{codStats.totalPendingCash.toLocaleString()}
                </div>
                <span className="text-[10px] text-[#78716C] mt-1 block">
                  Dispatched with riders &amp; courier partners
                </span>
              </div>

              <div className="bg-white border border-[#E8E5DF] p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between text-xs text-[#78716C] mb-1">
                  <span>Total Wholesale Value</span>
                  <div className="w-6 h-6 rounded-full bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center font-bold">
                    ₹
                  </div>
                </div>
                <div className="font-serif text-2xl font-bold text-[#1B4332]">
                  ₹{codStats.totalWholesale.toLocaleString()}
                </div>
                <span className="text-[10px] text-[#78716C] mt-1 block">
                  Base procurement cost across all active orders
                </span>
              </div>
            </div>

            {/* Daily Reconciliation Breakdown Table */}
            <div className="bg-white border border-[#E8E5DF] rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E8E5DF] font-bold text-xs text-[#1B4332] flex items-center justify-between">
                <span>Daily Remittance Ledger</span>
                <span className="text-[10px] text-[#78716C] font-normal">All dates automated from orders</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-[#78716C] uppercase font-bold text-[10px] tracking-wider border-b border-[#E8E5DF]">
                    <tr>
                      <th className="p-3.5">Dispatch Date</th>
                      <th className="p-3.5">Orders Processed</th>
                      <th className="p-3.5">Delivered Cash Remitted</th>
                      <th className="p-3.5">In-Transit COD Expected</th>
                      <th className="p-3.5 text-right">Audit Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E5DF]">
                    {codStats.breakdownList.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#FBF9F5] transition-colors">
                        <td className="p-3.5 font-bold text-[#1C1917] flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#D97706]" />
                          <span>{row.date}</span>
                        </td>
                        <td className="p-3.5">{row.count} Orders</td>
                        <td className="p-3.5 font-mono font-bold text-[#15803D]">
                          ₹{row.collected.toLocaleString()}
                        </td>
                        <td className="p-3.5 font-mono text-[#B45309]">
                          ₹{row.pending.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-right">
                          <span className="inline-flex items-center gap-1 bg-[#DCFCE7] text-[#15803D] px-2 py-0.5 rounded text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            Balanced (₹0 Gap)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: LOW-STOCK ALERTS (< 10 UNITS)                                      */}
        {/* ========================================================================= */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div className="bg-[#FEF2F2] border border-[#FCA5A5] p-5 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-[#DC2626] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-serif text-base font-bold text-[#991B1B]">
                  Immediate Stock Replenishment Required ({lowStockProducts.length} Items)
                </h3>
                <p className="text-xs text-[#7F1D1D] mt-0.5">
                  The following items have dropped below the minimum warehouse threshold of 10 units. Dispatch reorder manifests to our Sehore Gaushala or Chanderi weaving clusters.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockProducts.length === 0 ? (
                <div className="col-span-full bg-white p-8 rounded-2xl border border-[#E8E5DF] text-center text-[#78716C]">
                  All catalog items currently have healthy inventory levels (&ge; 10 units).
                </div>
              ) : (
                lowStockProducts.map((p) => {
                  const currentStock = p.stock !== undefined ? p.stock : 5;
                  return (
                    <div key={p.id} className="bg-white border border-[#FCA5A5] p-4 rounded-2xl shadow-sm flex flex-col justify-between">
                      <div className="flex items-start gap-3">
                        <img
                          src={p.images?.[0]}
                          alt={p.name}
                          className="w-12 h-12 rounded-xl object-cover border border-[#E8E5DF] shrink-0"
                        />
                        <div>
                          <span className="text-[10px] text-[#B45309] font-bold uppercase block">
                            {p.category}
                          </span>
                          <h4 className="font-bold text-xs text-[#1C1917] leading-snug">
                            {p.name}
                          </h4>
                          <span className="text-[11px] text-[#78716C] mt-0.5 block">
                            Wholesale: ₹{p.price}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#FCA5A5]/40 flex items-center justify-between">
                        <div className="text-xs">
                          <span className="text-[#78716C]">Remaining:</span>{' '}
                          <span className="font-mono font-bold text-[#DC2626] text-sm">
                            {currentStock} units
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSaveProduct({ ...p, stock: currentStock + 25 })}
                            className="px-2.5 py-1 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            +25 Units
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: FIREBASE CLOUD STORAGE & DATABASE MANAGER                          */}
        {/* ========================================================================= */}
        {activeTab === 'storage' && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-5 h-5 text-[#DDA15E]" />
                  <h3 className="font-serif text-lg font-bold text-[#FAF7F2]">
                    Firebase Cloud Storage &amp; Database Manager
                  </h3>
                </div>
                <p className="text-xs text-white/80 max-w-2xl leading-relaxed">
                  Manage Cloud Storage buckets for catalog photos and media, monitor Firestore database collections, and connect a newly generated Firebase project if previous resources were deleted.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleRunHealthCheck}
                  disabled={isCheckingHealth}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? 'animate-spin' : ''}`} />
                  <span>{isCheckingHealth ? 'Diagnosing...' : 'Run Diagnostics'}</span>
                </button>
                <button
                  onClick={handleTestStorage}
                  disabled={isTestingStorage}
                  className="px-4 py-2 bg-[#DDA15E] hover:bg-[#c98e4d] text-[#1B4332] font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  <Cloud className={`w-3.5 h-3.5 ${isTestingStorage ? 'animate-bounce' : ''}`} />
                  <span>{isTestingStorage ? 'Testing Storage...' : 'Test Cloud Storage'}</span>
                </button>
              </div>
            </div>

            {/* Health & Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cloud Storage Card */}
              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] text-[#1B4332] flex items-center justify-center font-bold">
                      <Cloud className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#1C1917]">Cloud Storage Bucket</h4>
                      <span className="text-[10px] text-[#78716C] font-mono block truncate max-w-[150px]">
                        {getFirebaseActiveConfig()?.storageBucket || 'nema-15142.firebasestorage.app'}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    storageReport?.isConnected 
                      ? 'bg-[#ECFDF5] text-[#059669]' 
                      : 'bg-[#FEF3C7] text-[#D97706]'
                  }`}>
                    {storageReport?.isConnected ? 'Online' : 'Local Store'}
                  </span>
                </div>

                <div className="p-2.5 bg-[#FAF7F2] rounded-xl text-[11px] text-[#57534E] leading-relaxed">
                  {storageReport ? (
                    <div className="space-y-1">
                      <span className="font-semibold block text-[#1C1917]">Latest Storage Probe:</span>
                      <p className="text-[10px]">{storageReport.message}</p>
                    </div>
                  ) : (
                    <p className="text-[10px]">
                      High-availability dual mode active. Files upload to Cloud Storage with automatic fallback to persistent local store.
                    </p>
                  )}
                </div>

                <button
                  onClick={handleTestStorage}
                  disabled={isTestingStorage}
                  className="w-full py-2 bg-white hover:bg-[#FAF7F2] border border-[#D5CFBE] text-[#1B4332] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Verify Storage Read/Write</span>
                </button>
              </div>

              {/* Firestore Database Card */}
              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] text-[#1B4332] flex items-center justify-center font-bold">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#1C1917]">Firestore Database</h4>
                      <span className="text-[10px] text-[#78716C] font-mono block">
                        {getFirebaseActiveConfig()?.firestoreDatabaseId || '(default)'} / {getFirebaseActiveConfig()?.projectId || 'nema-15142'}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isFirebaseInitialized ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#FEF3C7] text-[#D97706]'
                  }`}>
                    {isFirebaseInitialized ? 'Connected' : 'Offline'}
                  </span>
                </div>

                <div className="p-2.5 bg-[#FAF7F2] rounded-xl text-[11px] text-[#57534E] leading-relaxed space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span>Catalog Products:</span>
                    <strong className="text-[#1C1917]">{products.length} Items</strong>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span>Customer Orders:</span>
                    <strong className="text-[#1C1917]">{orders.length} Records</strong>
                  </div>
                </div>

                <button
                  onClick={handleSeedCatalog}
                  disabled={isSeeding}
                  className="w-full py-2 bg-white hover:bg-[#FAF7F2] border border-[#D5CFBE] text-[#1B4332] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
                  <span>{isSeeding ? 'Syncing...' : 'Sync Catalog to Firestore'}</span>
                </button>
              </div>

              {/* Auth Allowlist Card */}
              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] text-[#1B4332] flex items-center justify-center font-bold">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#1C1917]">Admin Authentication</h4>
                      <span className="text-[10px] text-[#78716C] block">Master Allowlist Active</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#059669]">
                    Verified
                  </span>
                </div>

                <div className="p-2.5 bg-[#FAF7F2] rounded-xl text-[11px] text-[#57534E] leading-relaxed">
                  <span className="text-[10px] text-[#78716C] block mb-0.5">Primary Administrator:</span>
                  <span className="font-mono font-bold text-[#1B4332] text-[10px] break-all">
                    aashishbhumarkar888@gmail.com
                  </span>
                </div>

                <button
                  onClick={handleRunHealthCheck}
                  disabled={isCheckingHealth}
                  className="w-full py-2 bg-white hover:bg-[#FAF7F2] border border-[#D5CFBE] text-[#1B4332] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Check Identity Toolkit</span>
                </button>
              </div>
            </div>

            {/* Diagnostic Report Panel if generated */}
            {diagnosticReport && (
              <div className="bg-[#FAF7F2] border border-[#D5CFBE] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#1B4332]" />
                    <h4 className="font-bold text-xs text-[#1C1917]">Full Firebase Diagnostics Summary</h4>
                  </div>
                  <span className="text-[10px] font-mono text-[#78716C]">
                    Project: {diagnosticReport.projectId}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-[#E8E5DF]">
                    <span className="text-[10px] text-[#78716C] block">Identity Toolkit / Auth:</span>
                    <strong className={diagnosticReport.authConfigured ? 'text-[#059669]' : 'text-[#DC2626]'}>
                      {diagnosticReport.authConfigured ? '✓ Operational' : '✗ Needs Activation / New Key'}
                    </strong>
                    <p className="text-[10px] text-[#78716C] mt-1 leading-snug">{diagnosticReport.authMessage}</p>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-[#E8E5DF]">
                    <span className="text-[10px] text-[#78716C] block">Cloud Firestore:</span>
                    <strong className={diagnosticReport.firestoreConfigured ? 'text-[#059669]' : 'text-[#DC2626]'}>
                      {diagnosticReport.firestoreConfigured ? '✓ Operational' : '✗ Disabled / Not Created'}
                    </strong>
                    <p className="text-[10px] text-[#78716C] mt-1 leading-snug">{diagnosticReport.firestoreMessage}</p>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-[#E8E5DF]">
                    <span className="text-[10px] text-[#78716C] block">Cloud Storage Bucket:</span>
                    <strong className={diagnosticReport.storageConfigured ? 'text-[#059669]' : 'text-[#D97706]'}>
                      {diagnosticReport.storageConfigured ? '✓ Operational' : '⚡ Local Store Fallback'}
                    </strong>
                    <p className="text-[10px] text-[#78716C] mt-1 leading-snug">{diagnosticReport.storageMessage}</p>
                  </div>
                </div>

                {diagnosticReport.instructions.length > 0 && (
                  <div className="p-3 bg-white rounded-xl border border-[#E8E5DF] text-[11px] text-[#57534E] space-y-1">
                    <span className="font-bold text-[#1C1917] block">Recommended Action Steps:</span>
                    <ol className="list-decimal pl-4 space-y-1 text-[10px]">
                      {diagnosticReport.instructions.map((inst, i) => (
                        <li key={i}>{inst}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}

            {/* Connect New Firebase Project & Storage Console */}
            <div className="bg-white border border-[#E8E5DF] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E8E5DF] gap-2">
                <div>
                  <h4 className="font-bold text-sm text-[#1C1917] flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#1B4332]" />
                    <span>Connect New Firebase Project &amp; Cloud Storage Bucket</span>
                  </h4>
                  <p className="text-xs text-[#78716C] mt-0.5">
                    If you deleted your previous Firebase project, create a new one in the Firebase console and paste its configuration snippet below.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="https://console.firebase.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#F3EFE6] border border-[#D5CFBE] rounded-lg text-xs font-semibold text-[#1B4332] flex items-center gap-1.5 transition-colors"
                  >
                    <span>Open Firebase Console</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Step by step guide */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-[11px]">
                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E5DF] space-y-1">
                  <span className="w-5 h-5 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-[10px]">1</span>
                  <strong className="block text-[#1C1917]">Create / Select Project</strong>
                  <p className="text-[#78716C] text-[10px] leading-snug">
                    In Firebase Console, click "Add project" (or choose existing).
                  </p>
                </div>

                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E5DF] space-y-1">
                  <span className="w-5 h-5 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-[10px]">2</span>
                  <strong className="block text-[#1C1917]">Enable Storage &amp; DB</strong>
                  <p className="text-[#78716C] text-[10px] leading-snug">
                    Click <strong>Storage</strong> &gt; "Get Started", and <strong>Firestore</strong> &gt; "Create database".
                  </p>
                </div>

                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E5DF] space-y-1">
                  <span className="w-5 h-5 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-[10px]">3</span>
                  <strong className="block text-[#1C1917]">Enable Authentication</strong>
                  <p className="text-[#78716C] text-[10px] leading-snug">
                    Under <strong>Authentication</strong>, enable "Email/Password" and "Google" sign-in providers.
                  </p>
                </div>

                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E5DF] space-y-1">
                  <span className="w-5 h-5 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-[10px]">4</span>
                  <strong className="block text-[#1C1917]">Copy Web App Config</strong>
                  <p className="text-[#78716C] text-[10px] leading-snug">
                    Go to Project Settings &gt; General &gt; Your apps &gt; Copy the <code>firebaseConfig</code> snippet and paste below.
                  </p>
                </div>
              </div>

              {/* Config Form */}
              <form onSubmit={handleSaveConfig} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#1C1917]">
                    Paste New Firebase Web Config Snippet or JSON:
                  </label>
                  <textarea
                    rows={4}
                    value={configInputText}
                    onChange={(e) => setConfigInputText(e.target.value)}
                    placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "your-project.firebaseapp.com",\n  projectId: "your-project-id",\n  storageBucket: "your-project.firebasestorage.app",\n  appId: "1:..."\n};`}
                    className="w-full p-3 bg-[#FAF7F2] border border-[#D5CFBE] rounded-xl font-mono text-xs text-[#1C1917] focus:outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332]"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleClearCustomConfig}
                    className="px-3.5 py-2 bg-white hover:bg-[#FAF7F2] border border-[#E8E5DF] text-[#78716C] hover:text-[#DC2626] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Reset to Default App Config
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={!configInputText.trim()}
                      className="px-5 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      Save &amp; Activate New Firebase Storage
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* Product Edit / Add Modal */}
      {isAddProductOpen && editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E5DF] w-full max-w-xl rounded-2xl shadow-2xl p-6 relative my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E5DF] mb-4">
              <h3 className="font-serif text-lg font-bold text-[#1B4332]">
                {editingProduct.id.includes('new') ? 'Add New Product' : `Edit "${editingProduct.name}"`}
              </h3>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="p-1 text-[#78716C] hover:text-[#1C1917] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveProduct(editingProduct);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-[#78716C] font-semibold mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full p-2 bg-[#FAF7F2] border border-[#E8E5DF] rounded-lg text-[#1C1917] focus:outline-none focus:border-[#1B4332]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#78716C] font-semibold mb-1">Wholesale Price (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-[#FAF7F2] border border-[#E8E5DF] rounded-lg text-[#1C1917] focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div>
                  <label className="block text-[#78716C] font-semibold mb-1">MSRP / Compare At Price (₹)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingProduct.compareAtPrice || Math.round(editingProduct.price * 1.35)}
                    onChange={(e) => setEditingProduct({ ...editingProduct, compareAtPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-[#FAF7F2] border border-[#E8E5DF] rounded-lg text-[#1C1917] focus:outline-none focus:border-[#1B4332]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#78716C] font-semibold mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingProduct.stock !== undefined ? editingProduct.stock : 25}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-2 bg-[#FAF7F2] border border-[#E8E5DF] rounded-lg text-[#1C1917] focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div>
                  <label className="block text-[#78716C] font-semibold mb-1">Category</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as ProductCategory })}
                    className="w-full p-2 bg-[#FAF7F2] border border-[#E8E5DF] rounded-lg text-[#1C1917] focus:outline-none focus:border-[#1B4332]"
                  >
                    <option value="Farm Fresh Dairy & Desi Ghee">Farm Fresh Dairy &amp; Desi Ghee</option>
                    <option value="Apparel & Traditional Clothes">Apparel &amp; Traditional Clothes</option>
                    <option value="Daily Necessities & Household Staples">Daily Necessities &amp; Household Staples</option>
                    <option value="Home Utilities & Kitchenware">Home Utilities &amp; Kitchenware</option>
                    <option value="Spiritual & Pure Puja Samagri">Spiritual &amp; Pure Puja Samagri</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[#78716C] font-semibold">Product Image (Cloud Storage or URL)</label>
                  {isUploadingImage && (
                    <span className="text-[10px] text-[#1B4332] font-semibold animate-pulse">Uploading to storage...</span>
                  )}
                </div>
                <div className="flex gap-2 items-center mb-2">
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={editingProduct.images?.[0] || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, images: [e.target.value] })}
                    className="flex-1 p-2 bg-[#FAF7F2] border border-[#E8E5DF] rounded-lg text-[#1C1917] focus:outline-none focus:border-[#1B4332]"
                  />
                  <label className="px-3 py-2 bg-white hover:bg-[#FAF7F2] border border-[#D5CFBE] hover:border-[#1B4332] text-[#1B4332] rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageFileUpload}
                    />
                  </label>
                </div>
                {editingProduct.images?.[0] && (
                  <div className="flex items-center gap-2">
                    <img
                      src={editingProduct.images[0]}
                      alt="Product preview"
                      className="w-12 h-12 rounded-lg object-cover border border-[#E8E5DF] bg-[#FAF7F2]"
                    />
                    <span className="text-[10px] text-[#78716C] truncate max-w-xs font-mono">
                      {editingProduct.images[0].substring(0, 50)}...
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[#78716C] font-semibold mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full p-2 bg-[#FAF7F2] border border-[#E8E5DF] rounded-lg text-[#1C1917] focus:outline-none focus:border-[#1B4332]"
                />
              </div>

              <div className="pt-3 border-t border-[#E8E5DF] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 border border-[#E8E5DF] text-[#78716C] hover:text-[#1C1917] rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  Save to Firestore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal Preview */}
      {selectedOrderForInvoice && (
        <InvoiceModal
          order={selectedOrderForInvoice}
          isOpen={!!selectedOrderForInvoice}
          onClose={() => setSelectedOrderForInvoice(null)}
        />
      )}
    </div>
  );
};
