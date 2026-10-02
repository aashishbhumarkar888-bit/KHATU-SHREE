import React, { useState } from 'react';
import { X, Trash2, ArrowRight, ShieldCheck, Tag, ShoppingBag, Clock, MapPin } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useCursor } from '../../context/CursorContext';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
  onExploreProducts: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  onProceedToCheckout,
  onExploreProducts,
}) => {
  const {
    items,
    isCartOpen,
    closeCart,
    removeItem,
    updateQuantity,
    subtotal,
    discountCode,
    discountPercentage,
    applyDiscountCode,
    removeDiscountCode,
    shippingFee,
    total,
    freeShippingThreshold,
    amountNeededForFreeShipping,
    progressToFreeShipping,
    selectedDeliverySlot,
    selectedBhopalArea,
  } = useCart();

  const { setCursor, resetCursor } = useCursor();
  const [couponInput, setCouponInput] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ text: string; error?: boolean } | null>(null);

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    const res = applyDiscountCode(couponInput);
    setCouponMessage({ text: res.message, error: !res.success });
    if (res.success) setCouponInput('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
        <div className="w-screen max-w-md bg-[#FBF9F5] border-l border-[#E8E5DF] text-[#1C1917] flex flex-col shadow-2xl">
          
          {/* Header */}
          <div className="p-5 bg-white border-b border-[#E8E5DF] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#1B4332]" />
              <div>
                <h2 className="font-serif text-lg font-bold text-[#1B4332]">Bhopal Fresh Cart</h2>
                <span className="text-[11px] text-[#78716C] block leading-none">
                  Delivering to: {selectedBhopalArea.split('(')[0]}
                </span>
              </div>
            </div>
            <button
              onClick={closeCart}
              onMouseEnter={() => setCursor('hover')}
              onMouseLeave={resetCursor}
              className="p-1.5 text-[#78716C] hover:text-[#1C1917] rounded-md transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Delivery Bar */}
          <div className="px-5 py-3 bg-[#ECFDF5] border-b border-[#A7F3D0] text-xs">
            {amountNeededForFreeShipping === 0 ? (
              <span className="text-[#065F46] font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#059669]" />
                🎉 You've unlocked FREE Doorstep Delivery in Bhopal!
              </span>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-[#065F46] font-medium text-[11px]">
                  <span>Add ₹{amountNeededForFreeShipping.toFixed(0)} more for Free Delivery</span>
                  <span>Goal: ₹{freeShippingThreshold}</span>
                </div>
                <div className="w-full h-1.5 bg-[#D1FAE5] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#059669] transition-all duration-300"
                    style={{ width: `${progressToFreeShipping}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Delivery Slot Indicator */}
          <div className="px-5 py-2 bg-white border-b border-[#E8E5DF] flex items-center gap-2 text-xs text-[#78716C]">
            <Clock className="w-3.5 h-3.5 text-[#D97706]" />
            <span className="truncate">Slot: <strong className="text-[#1C1917]">{selectedDeliverySlot}</strong></span>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-14 h-14 rounded-full bg-[#E8E5DF]/50 flex items-center justify-center text-[#78716C] mb-3">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <p className="font-serif text-xl font-bold text-[#1B4332] mb-1">Your cart is empty</p>
                <p className="text-xs text-[#78716C] max-w-xs mb-5">
                  Add farm-fresh A2 milk, bilona ghee, or MP Sharbati aata to begin your order.
                </p>
                <button
                  onClick={() => {
                    closeCart();
                    onExploreProducts();
                  }}
                  className="px-5 py-2.5 bg-[#1B4332] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Explore Products
                </button>
              </div>
            ) : (
              items.map((item) => {
                const itemPrice = item.product.price + (item.selectedVariant.priceModifier || 0);
                return (
                  <div
                    key={item.id}
                    className="p-3 bg-white border border-[#E8E5DF] rounded-xl flex gap-3 shadow-2xs"
                  >
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-16 h-18 object-cover rounded-lg bg-[#FBF9F5] border border-[#E8E5DF] shrink-0"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-serif text-xs font-bold text-[#1C1917] leading-snug line-clamp-1">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-[#78716C] hover:text-red-600 p-0.5 cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-[#78716C] mt-0.5">
                          {item.selectedVariant.weightOrVolume}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        {/* Stepper */}
                        <div className="flex items-center border border-[#E8E5DF] bg-[#FBF9F5] rounded">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-0.5 text-xs font-bold text-[#78716C] hover:text-[#1C1917] cursor-pointer"
                          >
                            −
                          </button>
                          <span className="font-sans text-xs px-2.5 font-bold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-0.5 text-xs font-bold text-[#78716C] hover:text-[#1C1917] cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-sans text-xs font-bold text-[#1C1917] tabular-nums">
                          ₹{itemPrice * item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Billing & Checkout */}
          {items.length > 0 && (
            <div className="p-5 border-t border-[#E8E5DF] bg-white space-y-3.5 shadow-lg">
              
              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Coupon (SHYAM10 or FIRSTBHOPAL)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 bg-[#FBF9F5] border border-[#E8E5DF] px-3 py-1.5 text-xs rounded text-[#1C1917] focus:outline-none uppercase font-mono"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-[#1B4332] text-white text-xs font-bold rounded cursor-pointer hover:bg-[#2D6A4F]"
                >
                  Apply
                </button>
              </form>

              {couponMessage && (
                <p className={`text-[11px] font-medium ${couponMessage.error ? 'text-red-600' : 'text-emerald-700'}`}>
                  {couponMessage.text}
                </p>
              )}

              {discountCode && (
                <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
                  <span className="flex items-center gap-1 font-bold">
                    <Tag className="w-3 h-3" />
                    {discountCode} ({(discountPercentage * 100).toFixed(0)}% Off)
                  </span>
                  <button onClick={removeDiscountCode} className="text-red-600 text-[11px] hover:underline">
                    Remove
                  </button>
                </div>
              )}

              {/* Price Details */}
              <div className="space-y-1.5 text-xs text-[#78716C] pt-2 border-t border-[#E8E5DF]">
                <div className="flex justify-between">
                  <span>Item Subtotal</span>
                  <span className="text-[#1C1917] font-semibold tabular-nums">₹{subtotal.toFixed(2)}</span>
                </div>
                {discountPercentage > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount</span>
                    <span className="tabular-nums">-₹{(subtotal * discountPercentage).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Bhopal Doorstep Delivery</span>
                  <span className="text-[#1C1917] font-semibold tabular-nums">
                    {shippingFee === 0 ? 'FREE' : `₹${shippingFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-[#1C1917] font-bold pt-2 border-t border-[#E8E5DF]">
                  <span>Total Payable</span>
                  <span className="text-[#1B4332] tabular-nums">₹{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => {
                  closeCart();
                  onProceedToCheckout();
                }}
                className="w-full py-3.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Order (₹{total.toFixed(2)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[10px] text-center text-[#78716C]">
                Cash on Delivery (COD) · Google Pay / UPI · 100% Purity Guarantee
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
