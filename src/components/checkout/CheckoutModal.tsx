import React, { useState } from 'react';
import { X, ShieldCheck, Lock, CheckCircle2, ArrowRight, Truck, CreditCard, Banknote, Smartphone, Clock, MapPin, Award, HardDrive, UploadCloud, ExternalLink } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useCursor } from '../../context/CursorContext';
import { Order, OrderItem, ShippingAddress, TrackingEvent } from '../../types';
import { BHOPAL_AREAS } from '../../data/products';
import { db, isFirebaseInitialized } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { uploadInvoiceToDrive } from '../../services/googleDrive';
import { useToastNotification } from '../../context/ToastNotificationContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewOrderInAccount: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onViewOrderInAccount,
}) => {
  const { 
    items, 
    subtotal, 
    discountPercentage, 
    shippingFee, 
    total, 
    clearCart,
    selectedDeliverySlot,
    selectedBhopalArea,
  } = useCart();
  const { user, userProfile, khatuPoints, refreshOrders, addKhatuPoints, driveAccessToken, connectGoogleDrive } = useAuth();
  const { setCursor, resetCursor } = useCursor();
  const { showCustomToast } = useToastNotification();

  const [step, setStep] = useState<'details' | 'confirmation'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [driveSavedLink, setDriveSavedLink] = useState<string | null>(null);

  const handleSaveToDrive = async () => {
    if (!completedOrder) return;
    setIsSavingToDrive(true);
    try {
      let token = driveAccessToken;
      if (!token) {
        token = await connectGoogleDrive();
      }
      if (!token) return;
      const uploaded = await uploadInvoiceToDrive(completedOrder, token);
      const driveViewUrl = uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`;
      setDriveSavedLink(driveViewUrl);

      showCustomToast({
        orderId: completedOrder.id,
        newStatus: 'delivered',
        title: 'Invoice Backed Up to Drive',
        message: `Saved ${uploaded.name} to "Khatu Shri Invoices" folder.`,
        actionLink: {
          label: 'Open in Drive',
          url: driveViewUrl,
        },
        duration: 7000,
      });
    } catch (err: any) {
      if (err?.code === 'popup_closed_by_user' || err?.message?.includes('closed') || err?.message?.includes('cancelled')) {
        showCustomToast({
          orderId: completedOrder.id,
          newStatus: 'processing',
          title: 'Google Drive Cancelled',
          message: 'Google Drive authorization window was closed. Invoice was not backed up.',
          duration: 4000,
        });
      } else {
        showCustomToast({
          orderId: completedOrder.id,
          newStatus: 'processing',
          title: 'Drive Backup Notice',
          message: err?.message || 'Could not back up invoice to Google Drive.',
          duration: 4000,
        });
      }
    } finally {
      setIsSavingToDrive(false);
    }
  };

  // Address & Checkout fields
  const [fullName, setFullName] = useState(userProfile?.name || user?.displayName || '');
  const [phone, setPhone] = useState(userProfile?.phoneNumber || '+91 98260 12345');
  const [email, setEmail] = useState(user?.email || 'customer@khatushri.in');
  const [houseFlat, setHouseFlat] = useState('B-42, Gulmohar Enclave');
  const [streetColony, setStreetColony] = useState('Near Bittan Market, E-3 Arera Colony');
  const [landmark, setLandmark] = useState('Opposite Jain Temple');
  const [bhopalArea, setBhopalArea] = useState(userProfile?.bhopalArea || selectedBhopalArea);
  const [pincode, setPincode] = useState(userProfile?.pincode || '462016');
  const [deliverySlot, setDeliverySlot] = useState(selectedDeliverySlot);
  const [packagingChoice, setPackagingChoice] = useState<'Standard Khatu Shri Packaging' | 'Plain White-Label (Dropship)'>('Standard Khatu Shri Packaging');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'COD' | 'Card'>('UPI');
  const [upiId, setUpiId] = useState('customer@okhdfcbank');

  if (!isOpen) return null;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const orderId = `KSP-BPL-${Date.now().toString().slice(-6)}`;
    const orderItems: OrderItem[] = items.map((i) => ({
      productId: i.product.id,
      productName: i.product.name,
      variantName: i.selectedVariant.weightOrVolume,
      quantity: i.quantity,
      price: i.product.price + (i.selectedVariant.priceModifier || 0),
      imageUrl: i.product.images[0],
    }));

    const shippingAddress: ShippingAddress = {
      fullName,
      phone,
      email,
      houseFlat,
      streetColony,
      landmark,
      bhopalArea,
      pincode,
      deliverySlot,
    };

    const wholesaleTotal = Math.round(subtotal);
    const resaleValue = Math.round(subtotal * (userProfile?.resellerMarkup ? (1 + userProfile.resellerMarkup) : 1.35));
    // 1 Khatu Point per ₹10 wholesale spend
    const earnedPts = Math.max(1, Math.floor(wholesaleTotal / 10));

    const initialTimeline: TrackingEvent[] = [
      {
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        status: 'placed',
        title: 'Order Confirmed & Logged',
        location: `${bhopalArea}, Bhopal MP`,
        details: `Slot: ${deliverySlot}. Packaging: ${packagingChoice}. Payment: ${paymentMethod}.`
      }
    ];

    const orderData: Order = {
      id: orderId,
      orderId,
      userId: user?.uid || 'guest-bhopal-customer',
      customerName: fullName,
      customerPhone: phone,
      customerEmail: email,
      shippingAddress,
      address: shippingAddress,
      items: orderItems,
      subtotal,
      wholesaleTotal,
      resaleValue,
      deliveryMethod: deliverySlot,
      packagingChoice,
      paymentMode: paymentMethod,
      statusTimeline: initialTimeline,
      deliveryCharge: shippingFee,
      discount: subtotal * discountPercentage,
      total,
      currency: 'INR',
      status: 'placed',
      paymentMethod,
      deliverySlot,
      createdAt: new Date().toISOString(),
    };

    try {
      if (user && isFirebaseInitialized && db) {
        // 1. Write order to Firestore "orders" collection
        await setDoc(doc(db, 'orders', orderId), {
          orderId,
          userId: user.uid,
          customerName: fullName,
          customerPhone: phone,
          customerEmail: email,
          shippingAddress,
          address: shippingAddress,
          items: orderItems,
          subtotal,
          wholesaleTotal,
          resaleValue,
          deliveryMethod: deliverySlot,
          packagingChoice,
          paymentMode: paymentMethod,
          statusTimeline: initialTimeline,
          deliveryCharge: shippingFee,
          discount: subtotal * discountPercentage,
          total,
          currency: 'INR',
          status: 'placed',
          paymentMethod,
          deliverySlot,
          createdAt: new Date().toISOString(),
        });

        // 2. Write Khatu Points earned to Firestore on order placement (1 point per ₹10 wholesale spend)
        const userRef = doc(db, 'users', user.uid);
        const nextPoints = (userProfile?.khatuPoints !== undefined ? userProfile.khatuPoints : khatuPoints) + earnedPts;
        await setDoc(userRef, {
          khatuPoints: nextPoints,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        await refreshOrders();
      }

      setCompletedOrder(orderData);
      if (addKhatuPoints) {
        addKhatuPoints(earnedPts, `Purchase Reward (Order #${orderId} - ₹${wholesaleTotal} spent)`, orderId);
      }
      clearCart();
      setStep('confirmation');
    } catch (err) {
      console.warn('Saving order fallback:', err);
      setCompletedOrder(orderData);
      if (addKhatuPoints) {
        addKhatuPoints(earnedPts, `Purchase Reward (Order #${orderId} - ₹${wholesaleTotal} spent)`, orderId);
      }
      clearCart();
      setStep('confirmation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-[#FBF9F5] border border-[#E8E5DF] text-[#1C1917] w-full max-w-4xl rounded-2xl shadow-2xl relative overflow-hidden my-auto">
        
        {/* Header */}
        <div className="p-5 bg-white border-b border-[#E8E5DF] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#1B4332] flex items-center justify-center text-[#D97706] font-bold text-xs">
              ॐ
            </div>
            <div>
              <span className="font-serif text-lg font-bold text-[#1B4332] block leading-none">
                KHATU SHRI EXPRESS CHECKOUT
              </span>
              <span className="text-[10px] text-[#78716C]">
                Same-Day Doorstep Dispatch · Bhopal, Madhya Pradesh
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#78716C] hover:text-[#1C1917] rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'details' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#E8E5DF]">
            
            {/* Form */}
            <form onSubmit={handlePlaceOrder} className="lg:col-span-7 p-6 space-y-5 bg-white">
              
              {/* Customer Contact */}
              <div>
                <h3 className="font-serif text-base font-bold text-[#1B4332] mb-1">
                  1. Customer & Delivery Contact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[#78716C] font-semibold mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#FBF9F5] border border-[#E8E5DF] rounded-lg p-2.5 text-[#1C1917] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#78716C] font-semibold mb-1">Phone Number (For Delivery OTP)</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98260 12345"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#FBF9F5] border border-[#E8E5DF] rounded-lg p-2.5 text-[#1C1917] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bhopal Delivery Address */}
              <div className="pt-3 border-t border-[#E8E5DF]">
                <h3 className="font-serif text-base font-bold text-[#1B4332] mb-1">
                  2. Bhopal Address Details
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[#78716C] font-semibold mb-1">House / Flat / Plot No.</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Flat 302, Royal Residency"
                      value={houseFlat}
                      onChange={(e) => setHouseFlat(e.target.value)}
                      className="w-full bg-[#FBF9F5] border border-[#E8E5DF] rounded-lg p-2.5 text-[#1C1917] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#78716C] font-semibold mb-1">Street / Colony / Landmark</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Near Habibganj Station / Bittan Market"
                      value={streetColony}
                      onChange={(e) => setStreetColony(e.target.value)}
                      className="w-full bg-[#FBF9F5] border border-[#E8E5DF] rounded-lg p-2.5 text-[#1C1917] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#78716C] font-semibold mb-1">Bhopal Area</label>
                      <select
                        value={bhopalArea}
                        onChange={(e) => setBhopalArea(e.target.value)}
                        className="w-full bg-[#FBF9F5] border border-[#E8E5DF] rounded-lg p-2.5 text-[#1C1917] focus:outline-none font-medium"
                      >
                        {BHOPAL_AREAS.map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#78716C] font-semibold mb-1">Pin Code</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="462016"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full bg-[#FBF9F5] border border-[#E8E5DF] rounded-lg p-2.5 text-[#1C1917] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Timing Slot */}
              <div className="pt-3 border-t border-[#E8E5DF]">
                <h3 className="font-serif text-base font-bold text-[#1B4332] mb-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#D97706]" />
                  <span>3. Desired Delivery Slot</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label
                    onClick={() => setDeliverySlot('Morning 6:00 AM – 8:30 AM (Farm Chilled)')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      deliverySlot.includes('Morning')
                        ? 'border-[#1B4332] bg-[#1B4332]/5 font-semibold text-[#1B4332]'
                        : 'border-[#E8E5DF] text-[#1C1917]'
                    }`}
                  >
                    <span>Morning 6:00 – 8:30 AM</span>
                    {deliverySlot.includes('Morning') && <CheckCircle2 className="w-4 h-4 text-[#1B4332]" />}
                  </label>

                  <label
                    onClick={() => setDeliverySlot('Evening 5:30 PM – 8:00 PM')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      deliverySlot.includes('Evening')
                        ? 'border-[#1B4332] bg-[#1B4332]/5 font-semibold text-[#1B4332]'
                        : 'border-[#E8E5DF] text-[#1C1917]'
                    }`}
                  >
                    <span>Evening 5:30 – 8:00 PM</span>
                    {deliverySlot.includes('Evening') && <CheckCircle2 className="w-4 h-4 text-[#1B4332]" />}
                  </label>
                </div>
              </div>

              {/* Packaging Choice (Dropship vs Standard) */}
              <div className="pt-3 border-t border-[#E8E5DF]">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-serif text-base font-bold text-[#1B4332]">
                    4. Packaging &amp; Reseller Dispatch
                  </h3>
                  <span className="text-[10px] text-[#B45309] bg-[#FFFBEB] px-2 py-0.5 rounded border border-[#FDE68A] uppercase font-bold">
                    Dropship Ready
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label
                    onClick={() => setPackagingChoice('Standard Khatu Shri Packaging')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      packagingChoice === 'Standard Khatu Shri Packaging'
                        ? 'border-[#1B4332] bg-[#1B4332]/5 font-semibold text-[#1B4332]'
                        : 'border-[#E8E5DF] text-[#1C1917]'
                    }`}
                  >
                    <div>
                      <span className="font-bold block text-left">Standard Khatu Shri Packaging</span>
                      <span className="text-[10px] text-[#78716C] block text-left">Branded box with sacred seal</span>
                    </div>
                    {packagingChoice === 'Standard Khatu Shri Packaging' && <CheckCircle2 className="w-4 h-4 text-[#1B4332] shrink-0" />}
                  </label>

                  <label
                    onClick={() => setPackagingChoice('Plain White-Label (Dropship)')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      packagingChoice === 'Plain White-Label (Dropship)'
                        ? 'border-[#1B4332] bg-[#1B4332]/5 font-semibold text-[#1B4332]'
                        : 'border-[#E8E5DF] text-[#1C1917]'
                    }`}
                  >
                    <div>
                      <span className="font-bold block text-left">Plain White-Label (Dropship)</span>
                      <span className="text-[10px] text-[#78716C] block text-left">Zero store logo/prices on parcel</span>
                    </div>
                    {packagingChoice === 'Plain White-Label (Dropship)' && <CheckCircle2 className="w-4 h-4 text-[#1B4332] shrink-0" />}
                  </label>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="pt-3 border-t border-[#E8E5DF]">
                <h3 className="font-serif text-base font-bold text-[#1B4332] mb-2">
                  5. Payment Method
                </h3>
                <div className="grid grid-cols-3 gap-2.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      paymentMethod === 'UPI'
                        ? 'border-[#1B4332] bg-[#1B4332]/5 font-bold text-[#1B4332]'
                        : 'border-[#E8E5DF] text-[#78716C]'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>UPI (GPay/PhonePe)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      paymentMethod === 'COD'
                        ? 'border-[#1B4332] bg-[#1B4332]/5 font-bold text-[#1B4332]'
                        : 'border-[#E8E5DF] text-[#78716C]'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Cash on Delivery</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Card')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      paymentMethod === 'Card'
                        ? 'border-[#1B4332] bg-[#1B4332]/5 font-bold text-[#1B4332]'
                        : 'border-[#E8E5DF] text-[#78716C]'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Card / NetBanking</span>
                  </button>
                </div>

                {paymentMethod === 'UPI' && (
                  <div className="mt-3 p-3 rounded-lg bg-[#FBF9F5] border border-[#E8E5DF] text-xs">
                    <label className="block text-[#78716C] font-semibold mb-1">Enter UPI ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="username@okhdfcbank"
                      className="w-full bg-white border border-[#E8E5DF] rounded p-2 text-[#1C1917] focus:outline-none"
                    />
                    <span className="text-[10px] text-[#78716C] mt-1 block">
                      A payment request will be sent upon placing order.
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold text-sm uppercase tracking-wider rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-4 h-4 text-[#D97706]" />
                <span>
                  {isSubmitting ? 'Confirming Order...' : `Confirm Bhopal Delivery (₹${total.toFixed(2)})`}
                </span>
              </button>
            </form>

            {/* Right Summary */}
            <div className="lg:col-span-5 p-6 bg-[#FBF9F5] flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-[#1B4332] mb-3">
                  Items in Delivery
                </h3>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1 divide-y divide-[#E8E5DF]">
                  {items.map((i) => {
                    const price = i.product.price + (i.selectedVariant.priceModifier || 0);
                    return (
                      <div key={i.id} className="pt-2.5 flex items-center gap-3 text-xs">
                        <img
                          src={i.product.images[0]}
                          alt={i.product.name}
                          className="w-12 h-14 object-cover rounded bg-white border border-[#E8E5DF]"
                        />
                        <div className="flex-1">
                          <p className="font-bold text-[#1C1917] line-clamp-1">{i.product.name}</p>
                          <p className="text-[11px] text-[#78716C]">
                            {i.selectedVariant.weightOrVolume} × {i.quantity}
                          </p>
                        </div>
                        <span className="font-bold text-[#1C1917] tabular-nums">
                          ₹{price * i.quantity}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-[#E8E5DF] space-y-2 text-xs text-[#78716C]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[#1C1917] tabular-nums">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discountPercentage > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Discount</span>
                      <span className="tabular-nums">-₹{(subtotal * discountPercentage).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Bhopal Delivery Fee</span>
                    <span className="font-semibold text-[#1C1917] tabular-nums">
                      {shippingFee === 0 ? 'FREE' : `₹${shippingFee.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[#1B4332] pt-2 border-t border-[#E8E5DF]">
                    <span>Total Amount</span>
                    <span className="tabular-nums">₹{total.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#B45309] bg-[#FFFBEB] p-2.5 rounded-lg border border-[#FDE68A] mt-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Award className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>Khatu Points Earned:</span>
                    </div>
                    <span className="font-mono font-bold">+{Math.max(1, Math.floor(total / 10))} Pts</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-[#E8E5DF] space-y-2 text-[11px] text-[#78716C]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#1B4332]" />
                  <span>100% Pure Vedic Farm Origin & FSSAI Certified</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#D97706]" />
                  <span>Delivering in: {bhopalArea}</span>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* Confirmation Screen */
          <div className="p-8 sm:p-12 text-center max-w-lg mx-auto space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 mx-auto flex items-center justify-center text-[#1B4332]">
              <CheckCircle2 className="w-10 h-10 text-[#1B4332]" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#D97706] block mb-1">
                जय श्री श्याम · Order Confirmed!
              </span>
              <h3 className="font-serif text-3xl font-bold text-[#1B4332]">
                Order {completedOrder?.id}
              </h3>
              <p className="text-xs text-[#78716C] mt-2">
                Delivering to <strong>{completedOrder?.shippingAddress.fullName}</strong> in <strong>{completedOrder?.shippingAddress.bhopalArea}</strong>
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-[#E8E5DF] text-xs text-left space-y-2">
              <div className="flex justify-between text-[#78716C]">
                <span>Scheduled Delivery Slot:</span>
                <span className="font-bold text-[#1B4332]">{completedOrder?.deliverySlot}</span>
              </div>
              <div className="flex justify-between text-[#78716C]">
                <span>Payment Mode:</span>
                <span className="font-bold text-[#1C1917]">{completedOrder?.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-[#78716C]">
                <span>Total Amount:</span>
                <span className="font-bold text-[#1C1917]">₹{completedOrder?.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Khatu Points Rewards Earned Celebration Card */}
            <div className="p-3.5 bg-[#FFFBEB] rounded-xl border border-[#FDE68A] text-xs flex items-center justify-between gap-3 text-[#B45309]">
              <div className="flex items-center gap-2.5 text-left">
                <Award className="w-5 h-5 text-[#D97706] shrink-0" />
                <div>
                  <span className="font-bold text-[#1B4332] block">
                    +{Math.max(1, Math.floor((completedOrder?.total || 0) / 10))} Khatu Points Earned!
                  </span>
                  <span className="text-[11px] text-[#78716C]">
                    Credited to your rewards wallet. Track your progress toward discount vouchers in Account.
                  </span>
                </div>
              </div>
              <span className="font-mono text-xs font-bold bg-white text-[#B45309] px-2.5 py-1 rounded-full border border-[#FDE68A] shrink-0">
                +{Math.max(1, Math.floor((completedOrder?.total || 0) / 10))} Pts
              </span>
            </div>

            {/* Google Drive Invoice Backup Card */}
            <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8E5DF] text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-left">
                <HardDrive className="w-5 h-5 text-[#2D6A4F] shrink-0" />
                <div>
                  <span className="font-bold text-[#1C1917] block">
                    Google Drive Invoice Backup
                  </span>
                  <span className="text-[11px] text-[#78716C]">
                    Save an official GST text receipt directly into your Google Drive &quot;Khatu Shri Invoices&quot; folder.
                  </span>
                </div>
              </div>
              {driveSavedLink ? (
                <a
                  href={driveSavedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View in Drive ✓</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveToDrive}
                  disabled={isSavingToDrive}
                  className="px-3 py-1.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-[#DDA15E]" />
                  <span>{isSavingToDrive ? 'Backing up...' : 'Backup to Google Drive'}</span>
                </button>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  onClose();
                  onViewOrderInAccount();
                }}
                className="w-full sm:w-auto px-6 py-3 bg-[#1B4332] text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Track in My Account
              </button>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 bg-white border border-[#E8E5DF] text-[#1C1917] text-xs font-bold rounded-lg cursor-pointer"
              >
                Back to Store
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
