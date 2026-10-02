import React, { useState } from 'react';
import { 
  X, 
  LogOut, 
  Package, 
  Heart, 
  Shield, 
  CheckCircle2, 
  Clock, 
  Truck, 
  MapPin, 
  User as UserIcon, 
  Lock, 
  Mail, 
  Phone, 
  ArrowRight, 
  Sparkles, 
  Calendar,
  AlertCircle,
  Edit2,
  Check,
  Search,
  SlidersHorizontal,
  FileText,
  Award,
  HardDrive,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { PRODUCTS } from '../../data/products';
import { Product, Order } from '../../types';
import { OrderStatusTracker } from './OrderStatusTracker';
import { InvoiceModal } from './InvoiceModal';
import { KhatuPointsRewards } from './KhatuPointsRewards';
import { GoogleDriveManager } from './GoogleDriveManager';
import { WHATSAPP_NUMBER } from '../../config/adminConfig';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  initialTab?: 'orders' | 'wishlist' | 'points' | 'subscription' | 'drive' | 'profile';
}

const BHOPAL_AREAS = [
  'Arera Colony (E-1 to E-7)',
  'MP Nagar (Zone 1 & 2)',
  'Kolar Road (Chunabhatti to Sarvdharm)',
  'TT Nagar & New Market',
  'Hoshangabad Road & Misrod',
  'Ayodhya Bypass & Minal',
  'Shahpura & Bawadiya Kalan',
  'BHEL & Govindpura',
  'Idgah Hills & Old City',
  'Katara Hills & Bagsewaniya'
];

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  initialTab = 'orders',
}) => {
  const { 
    user, 
    userProfile, 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    resetPassword,
    signInAsDemoUser,
    updateProfileDetails,
    signOut, 
    wishlist, 
    orders, 
    refreshOrders,
    updateOrderStatus,
    updateOrderInstructions,
    cancelOrder,
    authError,
    clearAuthError,
    khatuPoints,
    isDriveConnected
  } = useAuth();
  
  const { addItem, selectedBhopalArea } = useCart();
  
  // Navigation inside modal
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'points' | 'subscription' | 'drive' | 'profile'>(initialTab);
  
  // Auth Form State
  const [authMode, setAuthMode] = useState<'google' | 'email_login' | 'email_signup' | 'forgot_password' | 'demo'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bhopalArea, setBhopalArea] = useState(selectedBhopalArea);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Profile Edit State
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editStreetAddress, setEditStreetAddress] = useState('');
  const [editPincode, setEditPincode] = useState('462016');
  const [editPhone, setEditPhone] = useState('');

  // Amazon-style Order Tracker & Invoice State
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [orderFilter, setOrderFilter] = useState<'all' | 'processing' | 'out_for_delivery' | 'delivered'>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [previewTrackerAsGuest, setPreviewTrackerAsGuest] = useState(false);

  if (!isOpen) return null;

  const wishlistedProducts = PRODUCTS.filter((p) => wishlist.includes(p.id));

  // Filter orders by status and search keyword
  const filteredOrders = orders.filter((o) => {
    if (orderFilter !== 'all' && o.status !== orderFilter) return false;
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase();
      const matchesId = o.id.toLowerCase().includes(q);
      const matchesItem = o.items.some(
        (it) => it.productName.toLowerCase().includes(q) || it.variantName.toLowerCase().includes(q)
      );
      return matchesId || matchesItem;
    }
    return true;
  });

  const processingCount = orders.filter((o) => o.status === 'processing').length;
  const outForDeliveryCount = orders.filter((o) => o.status === 'out_for_delivery').length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    clearAuthError();
    try {
      const signedInUser = await signInWithGoogle();
      if (signedInUser) {
        await refreshOrders();
        setSuccessMessage('Successfully signed in with Google!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (e: any) {
      if (e?.code !== 'auth/popup-closed-by-user' && e?.code !== 'auth/cancelled-popup-request') {
        console.warn('Sign-in notice:', e);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearAuthError();
    try {
      if (authMode === 'email_login') {
        await signInWithEmail(email, password);
        setSuccessMessage('Welcome back to Khatu Shri!');
      } else if (authMode === 'email_signup') {
        await signUpWithEmail(email, password, displayName || 'Khatu Shri Member', phoneNumber, bhopalArea);
        setSuccessMessage('Account created successfully! Welcome to Khatu Shri.');
      } else if (authMode === 'forgot_password') {
        await resetPassword(email);
        setSuccessMessage('Password reset link sent to your email.');
      }
      setTimeout(() => setSuccessMessage(''), 3500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSignIn = async (persona: 'bhopal_customer' | 'temple_mandir') => {
    setIsSubmitting(true);
    clearAuthError();
    try {
      await signInAsDemoUser(persona);
      setSuccessMessage(persona === 'bhopal_customer' ? 'Signed in as Bhopal Resident!' : 'Signed in as Mandir Seva Trust!');
      setTimeout(() => setSuccessMessage(''), 3500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSubmitting(true);
    try {
      await updateProfileDetails({
        phoneNumber: editPhone || userProfile?.phoneNumber,
        address: editStreetAddress || userProfile?.address,
        pincode: editPincode || userProfile?.pincode,
        bhopalArea: bhopalArea || userProfile?.bhopalArea
      });
      setIsEditingAddress(false);
      setSuccessMessage('Delivery details updated!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReorder = (order: Order) => {
    let count = 0;
    order.items.forEach((item) => {
      const prod = PRODUCTS.find((p) => p.id === item.productId || p.name === item.productName);
      if (prod) {
        const variant = prod.variants.find((v) => v.name === item.variantName) || prod.variants[0];
        addItem(prod, variant, item.quantity);
        count += item.quantity;
      }
    });
    setSuccessMessage(`Added ${count} items from ${order.id} back to your cart!`);
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-[#FBF9F5] border border-[#E8E5DF] text-[#1C1917] w-full max-w-4xl rounded-2xl shadow-2xl relative overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#E8E5DF] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1B4332] flex items-center justify-center text-[#D97706] font-bold text-sm shadow-xs">
              ॐ
            </div>
            <div>
              <span className="font-serif text-lg font-bold text-[#1B4332] block leading-none">
                KHATU SHYAM PARIVAR
              </span>
              <span className="text-[10px] text-[#78716C] tracking-wide mt-0.5 block">
                Pure Desi Dairy & Authentic Natural Products · Bhopal, MP
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!user && (
              <button
                type="button"
                onClick={() => setPreviewTrackerAsGuest(!previewTrackerAsGuest)}
                className="px-2.5 py-1 text-[11px] font-bold text-[#1B4332] hover:bg-[#1B4332]/10 rounded border border-[#1B4332]/30 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5 text-[#D97706]" />
                <span>{previewTrackerAsGuest ? 'Back to Sign-In' : 'Preview Order Tracker'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-[#78716C] hover:text-[#1C1917] rounded-md transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {authError && (
          <div className="px-5 py-3 bg-red-50 border-b border-red-200 text-red-700 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{authError}</span>
            </div>
            <button onClick={clearAuthError} className="text-red-500 hover:text-red-800 text-xs font-bold ml-2">
              Dismiss
            </button>
          </div>
        )}

        {successMessage && (
          <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* EITHER GUEST PREVIEWING ORDER TRACKER OR SIGNED IN USER */}
        {user || previewTrackerAsGuest ? (
          <div>
            {/* User Profile Bar (If logged in) or Guest Preview Banner */}
            {user ? (
              <div className="p-4 sm:p-5 bg-white border-b border-[#E8E5DF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Member'}
                      className="w-11 h-11 rounded-full border-2 border-[#1B4332] object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-[#1B4332] text-[#D97706] font-bold text-base flex items-center justify-center shadow-xs">
                      {(userProfile?.displayName || user.displayName || user.email || 'S').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-base sm:text-lg font-bold text-[#1B4332] leading-tight">
                        {userProfile?.displayName || user.displayName || 'Khatu Shri Member'}
                      </h3>
                      <span className="bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                        Gold Patron
                      </span>
                    </div>
                    <p className="text-xs text-[#78716C] mt-0.5">{user.email}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <p className="text-[11px] text-[#B45309] flex items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3" />
                        <span>{userProfile?.bhopalArea || selectedBhopalArea}</span>
                      </p>
                      <button
                        onClick={() => setActiveTab('points')}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#FDE68A] text-[#B45309] text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                        title="View Khatu Points & Rewards Progress Bar"
                      >
                        <Award className="w-3 h-3 text-[#D97706]" />
                        <span>{khatuPoints} Khatu Points</span>
                        <span className="text-[9px] text-[#78716C] font-normal">· Rewards ➔</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('drive')}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold transition-all cursor-pointer shadow-2xs ${
                          isDriveConnected
                            ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                            : 'bg-[#FAF7F2] hover:bg-[#E8E5DF] border-[#E8E5DF] text-[#78716C]'
                        }`}
                        title="Manage Google Drive Invoices & Backup"
                      >
                        <HardDrive className={`w-3 h-3 ${isDriveConnected ? 'text-emerald-600' : 'text-[#DDA15E]'}`} />
                        <span>{isDriveConnected ? 'Google Drive Synced ✓' : 'Link Google Drive'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => setIsEditingAddress(!isEditingAddress)}
                    className="px-3 py-1.5 border border-[#E8E5DF] hover:border-[#1B4332] text-[#1C1917] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#78716C]" />
                    <span>{isEditingAddress ? 'Close Edit' : 'Edit Address'}</span>
                  </button>
                  <button
                    onClick={signOut}
                    className="px-3 py-1.5 border border-[#E8E5DF] text-[#78716C] hover:text-red-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#FFFBEB] border-b border-[#FDE68A] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#B45309]">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#D97706]" />
                  <span>
                    <strong>Guest Preview Mode:</strong> Viewing live Amazon-style dairy order status tracker for Bhopal deliveries.
                  </span>
                </div>
                <button
                  onClick={() => setPreviewTrackerAsGuest(false)}
                  className="font-bold underline text-[#1B4332] hover:text-[#2D6A4F] cursor-pointer"
                >
                  Sign In / Register
                </button>
              </div>
            )}

            {/* Address Edit Drawer */}
            {isEditingAddress && (
              <div className="p-4 bg-[#FFFBEB] border-b border-[#FDE68A] space-y-3 animate-in fade-in duration-150">
                <span className="font-bold text-xs text-[#B45309] block">
                  Update Your Bhopal Delivery Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="House/Flat No, Landmark"
                    value={editStreetAddress}
                    onChange={(e) => setEditStreetAddress(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-[#E8E5DF] rounded-md text-xs sm:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="Pincode (e.g. 462016)"
                    value={editPincode}
                    onChange={(e) => setEditPincode(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-[#E8E5DF] rounded-md text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-[#1B4332] text-white text-xs font-bold rounded-md hover:bg-[#2D6A4F] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save to Profile</span>
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex border-b border-[#E8E5DF] bg-white text-xs font-bold overflow-x-auto">
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex-1 min-w-[130px] py-3 border-b-2 flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  activeTab === 'orders'
                    ? 'border-[#1B4332] text-[#1B4332] bg-[#FBF9F5]'
                    : 'border-transparent text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Your Orders ({orders.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('points')}
                className={`flex-1 min-w-[140px] py-3 border-b-2 flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  activeTab === 'points'
                    ? 'border-[#1B4332] text-[#1B4332] bg-[#FBF9F5]'
                    : 'border-transparent text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                <Award className="w-4 h-4 text-[#D97706]" />
                <span>Khatu Points ({khatuPoints})</span>
              </button>
              <button
                onClick={() => setActiveTab('wishlist')}
                className={`flex-1 min-w-[130px] py-3 border-b-2 flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  activeTab === 'wishlist'
                    ? 'border-[#1B4332] text-[#1B4332] bg-[#FBF9F5]'
                    : 'border-transparent text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>Saved Items ({wishlistedProducts.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('subscription')}
                className={`flex-1 min-w-[140px] py-3 border-b-2 flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  activeTab === 'subscription'
                    ? 'border-[#1B4332] text-[#1B4332] bg-[#FBF9F5]'
                    : 'border-transparent text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Daily Milk Pass</span>
              </button>
              <button
                onClick={() => setActiveTab('drive')}
                className={`flex-1 min-w-[140px] py-3 border-b-2 flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  activeTab === 'drive'
                    ? 'border-[#1B4332] text-[#1B4332] bg-[#FBF9F5]'
                    : 'border-transparent text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                <HardDrive className={`w-4 h-4 ${isDriveConnected ? 'text-emerald-600' : 'text-[#DDA15E]'}`} />
                <span>Google Drive {isDriveConnected ? '✓' : ''}</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-4 sm:p-6 max-h-[500px] overflow-y-auto">
              
              {/* ========================================================================= */}
              {/* TAB 1: AMAZON-STYLE ORDERS WITH VISUAL STATUS TRACKER                      */}
              {/* ========================================================================= */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  
                  {/* Amazon-style Orders Search & Status Filter Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E8E5DF]">
                    
                    {/* Search Bar */}
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#78716C]" />
                      <input
                        type="text"
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        placeholder="Search all orders by item name or order ID..."
                        className="w-full pl-9 pr-3 py-1.5 bg-[#FBF9F5] border border-[#E8E5DF] rounded-lg text-xs focus:outline-none focus:border-[#1B4332]"
                      />
                    </div>

                    {/* Status Pill Filters */}
                    <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold">
                      <button
                        onClick={() => setOrderFilter('all')}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                          orderFilter === 'all'
                            ? 'bg-[#1B4332] text-white'
                            : 'bg-[#FBF9F5] text-[#78716C] hover:text-[#1C1917]'
                        }`}
                      >
                        All ({orders.length})
                      </button>

                      <button
                        onClick={() => setOrderFilter('processing')}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                          orderFilter === 'processing'
                            ? 'bg-amber-700 text-white'
                            : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>Processing ({processingCount})</span>
                      </button>

                      <button
                        onClick={() => setOrderFilter('out_for_delivery')}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                          orderFilter === 'out_for_delivery'
                            ? 'bg-[#D97706] text-white'
                            : 'bg-[#FFFBEB] text-[#B45309] hover:bg-[#FEF3C7] border border-[#FDE68A]'
                        }`}
                      >
                        <Truck className="w-3 h-3" />
                        <span>Out for Delivery ({outForDeliveryCount})</span>
                      </button>

                      <button
                        onClick={() => setOrderFilter('delivered')}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                          orderFilter === 'delivered'
                            ? 'bg-emerald-700 text-white'
                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Delivered ({deliveredCount})</span>
                      </button>
                    </div>

                  </div>

                  {/* Orders List */}
                  {filteredOrders.length === 0 ? (
                    <div className="py-12 text-center text-[#78716C] bg-white border border-[#E8E5DF] rounded-xl p-8">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-30 text-[#1B4332]" />
                      <p className="font-serif text-lg font-bold text-[#1B4332]">No Matching Orders Found</p>
                      <p className="text-xs mt-1">Try resetting the filter or search query.</p>
                      <button
                        onClick={() => { setOrderFilter('all'); setOrderSearchQuery(''); }}
                        className="mt-3 px-3 py-1.5 text-xs font-bold text-[#1B4332] bg-[#FBF9F5] border border-[#E8E5DF] rounded-lg hover:bg-[#1B4332]/5 cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredOrders.map((ord) => (
                        <OrderStatusTracker
                          key={ord.id}
                          order={ord}
                          onUpdateStatus={updateOrderStatus}
                          onReorder={handleReorder}
                          onViewInvoice={(orderToView) => setSelectedInvoiceOrder(orderToView)}
                          onCancelOrder={cancelOrder}
                          onSaveInstructions={updateOrderInstructions}
                        />
                      ))}
                    </div>
                  )}

                </div>
              )}

              {/* TAB 2: WISHLIST */}
              {activeTab === 'wishlist' && (
                wishlistedProducts.length === 0 ? (
                  <div className="py-12 text-center text-[#78716C] bg-white border border-[#E8E5DF] rounded-xl">
                    <Heart className="w-12 h-12 mx-auto mb-2 opacity-30 text-[#D97706]" />
                    <p className="font-serif text-lg font-bold text-[#1B4332]">No Saved Items</p>
                    <p className="text-xs mt-1">Tap the heart icon on any product to save it here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {wishlistedProducts.map((p) => (
                      <div key={p.id} className="p-3 bg-white border border-[#E8E5DF] rounded-xl flex items-center gap-3">
                        <img src={p.images[0]} alt={p.name} className="w-14 h-16 object-cover rounded-lg bg-[#FBF9F5]" />
                        <div className="flex-1 min-w-0">
                          <h4 
                            onClick={() => {
                              onSelectProduct(p);
                              onClose();
                            }}
                            className="font-serif text-xs font-bold text-[#1C1917] hover:text-[#1B4332] cursor-pointer truncate"
                          >
                            {p.name}
                          </h4>
                          <p className="text-xs font-bold text-[#D97706] mt-0.5">₹{p.price}</p>
                          <button
                            onClick={() => addItem(p, p.variants[0], 1)}
                            className="mt-1.5 text-[11px] font-bold text-[#1B4332] hover:underline cursor-pointer"
                          >
                            + Add to Bag
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* TAB 3: DAILY MILK PASS */}
              {activeTab === 'subscription' && (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white rounded-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#D97706] font-bold">
                          Daily Farm Fresh Pass · Bhopal
                        </span>
                        <h4 className="font-serif text-lg font-bold mt-0.5">
                          Morning 6:00 – 8:30 AM Slot
                        </h4>
                        <p className="text-xs text-white/80 mt-1 max-w-sm">
                          Pure chilled A2 Gir cow milk glass bottle delivered to your doorstep every morning without ringing the bell.
                        </p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg text-center">
                        <span className="text-[10px] text-white/70 block">Daily Status</span>
                        <span className="text-xs font-bold text-[#FDE68A]">Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 bg-white border border-[#E8E5DF] rounded-xl space-y-1">
                      <span className="text-[10px] text-[#78716C] uppercase font-bold block">
                        Assigned Bhopal Hub
                      </span>
                      <p className="font-bold text-[#1C1917]">{userProfile?.bhopalArea || selectedBhopalArea}</p>
                      <p className="text-[11px] text-[#78716C]">Van Dispatch: 5:15 AM from Sehore Gaushala</p>
                    </div>

                    <div className="p-3.5 bg-white border border-[#E8E5DF] rounded-xl space-y-1">
                      <span className="text-[10px] text-[#78716C] uppercase font-bold block">
                        Milk Quality Guarantee
                      </span>
                      <p className="font-bold text-[#1B4332]">Fat: 4.8% · SNF: 8.9%</p>
                      <p className="text-[11px] text-[#78716C]">Daily batch tested zero synthetic hormones</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: KHATU POINTS & LOYALTY REWARDS PROGRESS TRACKER */}
              {activeTab === 'points' && (
                <KhatuPointsRewards />
              )}

              {/* TAB 5: GOOGLE DRIVE INVOICE & RECEIPT BACKUP VAULT */}
              {activeTab === 'drive' && (
                <GoogleDriveManager orders={orders} />
              )}

              {/* Dedicated Contact Support Section */}
              <div className="mt-8 pt-5 border-t border-[#E8E5DF] bg-[#FAF7F2] p-4 sm:p-5 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-serif text-sm font-bold text-[#1B4332] flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-[#D97706]" />
                      <span>Dedicated Customer &amp; Reseller Support</span>
                    </h4>
                    <p className="text-[11px] text-[#78716C] mt-0.5">
                      Assistance with live Bhopal van dispatch, COD reconciliation, and wholesale orders.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hi Khatu Shri Support! I need help with my account/orders.')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <span>WhatsApp Care</span>
                    </a>
                    <a
                      href="mailto:care@khatushri.in"
                      className="px-3 py-1.5 bg-white border border-[#E8E5DF] hover:border-[#1B4332] text-[#1C1917] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>care@khatushri.in</span>
                    </a>
                  </div>
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* ========================================================================= */
          /* SIGN-IN & REGISTRATION SUITE (Google + Email/Password + Demo 1-Click)     */
          /* ========================================================================= */
          <div className="p-6 sm:p-10 max-w-xl mx-auto">
            
            {/* Top Badge */}
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFBEB] text-[#B45309] text-[11px] font-bold border border-[#FDE68A] uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                Customer & Member Sign-In
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1B4332]">
                Welcome to Khatu Shri
              </h2>
              <p className="text-xs text-[#78716C] mt-1.5 max-w-sm mx-auto">
                Sign in to track morning milk slots, view past orders, and manage Bhopal deliveries.
              </p>
            </div>

            {/* Auth Mode Toggle Tabs */}
            <div className="flex rounded-lg bg-[#EFECE6] p-1 mb-6 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setAuthMode('google'); clearAuthError(); }}
                className={`flex-1 py-2 rounded-md transition-all cursor-pointer ${
                  authMode === 'google' 
                    ? 'bg-white text-[#1B4332] shadow-xs' 
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                Google 1-Tap
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('email_login'); clearAuthError(); }}
                className={`flex-1 py-2 rounded-md transition-all cursor-pointer ${
                  authMode === 'email_login' 
                    ? 'bg-white text-[#1B4332] shadow-xs' 
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                Email Login
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('email_signup'); clearAuthError(); }}
                className={`flex-1 py-2 rounded-md transition-all cursor-pointer ${
                  authMode === 'email_signup' 
                    ? 'bg-white text-[#1B4332] shadow-xs' 
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                New Account
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('demo'); clearAuthError(); }}
                className={`flex-1 py-2 rounded-md transition-all cursor-pointer ${
                  authMode === 'demo' 
                    ? 'bg-white text-[#D97706] shadow-xs' 
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                Instant Test
              </button>
            </div>

            {/* MODE 1: GOOGLE 1-CLICK AUTH */}
            {authMode === 'google' && (
              <div className="space-y-4">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-white border border-[#E8E5DF] hover:border-[#1B4332] text-[#1C1917] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-xs hover:shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isSubmitting ? 'Authenticating with Google...' : 'Continue with Google Account'}</span>
                </button>

                <div className="p-4 bg-white border border-[#E8E5DF] rounded-xl text-left space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-[#1B4332] font-bold">
                    <Shield className="w-4 h-4 text-[#1B4332]" />
                    <span>Secure Bhopal Member Protection</span>
                  </div>
                  <p className="text-[#78716C] leading-relaxed text-[11px]">
                    Firebase Auth secures your credentials. We never store passwords. Access your saved cart, 
                    order delivery tracking in Bhopal, and express checkout across all devices.
                  </p>
                </div>
              </div>
            )}

            {/* MODE 2: EMAIL LOGIN */}
            {authMode === 'email_login' && (
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#57534E] mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-[#78716C]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E8E5DF] rounded-xl text-xs focus:outline-none focus:border-[#1B4332]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-[#57534E]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot_password')}
                      className="text-[11px] text-[#B45309] hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-[#78716C]" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E8E5DF] rounded-xl text-xs focus:outline-none focus:border-[#1B4332]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Signing In...' : 'Sign In to Account'}
                </button>
              </form>
            )}

            {/* MODE 3: EMAIL SIGNUP */}
            {authMode === 'email_signup' && (
              <form onSubmit={handleEmailAuth} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#57534E] mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-3 text-[#78716C]" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Aashish Sharma"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-[#E8E5DF] rounded-xl text-xs focus:outline-none focus:border-[#1B4332]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#57534E] mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-[#78716C]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-[#E8E5DF] rounded-xl text-xs focus:outline-none focus:border-[#1B4332]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#57534E] mb-1">
                      Phone Number (Bhopal)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-3 text-[#78716C]" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+91 98260 00000"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-[#E8E5DF] rounded-xl text-xs focus:outline-none focus:border-[#1B4332]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#57534E] mb-1">
                    Bhopal Locality
                  </label>
                  <select
                    value={bhopalArea}
                    onChange={(e) => setBhopalArea(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E8E5DF] rounded-xl text-xs focus:outline-none focus:border-[#1B4332]"
                  >
                    {BHOPAL_AREAS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#57534E] mb-1">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-[#78716C]" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-[#E8E5DF] rounded-xl text-xs focus:outline-none focus:border-[#1B4332]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer mt-2"
                >
                  {isSubmitting ? 'Creating Account...' : 'Register & Join Shyam Parivar'}
                </button>
              </form>
            )}

            {/* MODE 4: FORGOT PASSWORD */}
            {authMode === 'forgot_password' && (
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <p className="text-xs text-[#78716C]">
                  Enter your registered email address and we will send you a password reset link.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-[#57534E] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3 py-2.5 bg-white border border-[#E8E5DF] rounded-xl text-xs focus:outline-none focus:border-[#1B4332]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAuthMode('email_login')}
                    className="flex-1 py-2.5 border border-[#E8E5DF] text-[#78716C] text-xs font-semibold rounded-xl hover:bg-white cursor-pointer"
                  >
                    Back to Login
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-[#1B4332] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#2D6A4F] cursor-pointer"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}

            {/* MODE 5: FAST 1-CLICK DEMO TEST LOGIN */}
            {authMode === 'demo' && (
              <div className="space-y-3">
                <p className="text-xs text-[#78716C] text-center mb-2">
                  Instant testing credentials with pre-seeded Bhopal addresses and real Firebase persistence:
                </p>

                <button
                  type="button"
                  onClick={() => handleDemoSignIn('bhopal_customer')}
                  disabled={isSubmitting}
                  className="w-full p-3.5 bg-white border border-[#E8E5DF] hover:border-[#1B4332] rounded-xl text-left flex items-center justify-between group transition-all cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center font-bold text-xs">
                      AB
                    </div>
                    <div>
                      <span className="font-bold text-xs text-[#1C1917] block group-hover:text-[#1B4332]">
                        Aashish Bhumarkar
                      </span>
                      <span className="text-[11px] text-[#78716C]">
                        Arera Colony, Bhopal · Daily Milk & Ghee Subscriber
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#78716C] group-hover:text-[#1B4332] group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoSignIn('temple_mandir')}
                  disabled={isSubmitting}
                  className="w-full p-3.5 bg-white border border-[#E8E5DF] hover:border-[#1B4332] rounded-xl text-left flex items-center justify-between group transition-all cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#D97706]/15 text-[#B45309] flex items-center justify-center font-bold text-xs">
                      SM
                    </div>
                    <div>
                      <span className="font-bold text-xs text-[#1C1917] block group-hover:text-[#1B4332]">
                        Shyam Mandir Seva Trust
                      </span>
                      <span className="text-[11px] text-[#78716C]">
                        MP Nagar Zone-1, Bhopal · Bulk Havan Samagri & Puja Ghee
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#78716C] group-hover:text-[#1B4332] group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            )}

          </div>
        )}

        {/* Amazon-style Printable Tax Invoice Modal */}
        <InvoiceModal
          order={selectedInvoiceOrder}
          isOpen={!!selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />

      </div>
    </div>
  );
};
