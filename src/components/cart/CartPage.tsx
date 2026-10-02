import React, { useState } from 'react';
import { ArrowLeft, Trash2, ArrowRight, ShieldCheck, Tag, ShoppingBag, Clock, MapPin } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useCursor } from '../../context/CursorContext';
import { Product } from '../../types';
import { PRODUCTS, BHOPAL_AREAS } from '../../data/products';

interface CartPageProps {
  onContinueShopping: () => void;
  onProceedToCheckout: () => void;
  onSelectProduct: (p: Product) => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  onContinueShopping,
  onProceedToCheckout,
  onSelectProduct,
}) => {
  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    discountCode,
    discountPercentage,
    applyDiscountCode,
    removeDiscountCode,
    shippingFee,
    total,
    amountNeededForFreeShipping,
    freeShippingThreshold,
    progressToFreeShipping,
    selectedDeliverySlot,
    setSelectedDeliverySlot,
    selectedBhopalArea,
    setSelectedBhopalArea,
  } = useCart();

  const { setCursor, resetCursor } = useCursor();
  const [couponInput, setCouponInput] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    const res = applyDiscountCode(couponInput);
    setCouponMessage({ text: res.message, error: !res.success });
    if (res.success) setCouponInput('');
  };

  const suggestedAdditions = PRODUCTS.filter(
    (p) => !items.some((i) => i.product.id === p.id)
  ).slice(0, 3);

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-8 text-[#1C1917]">
      {/* Return button */}
      <button
        onClick={onContinueShopping}
        onMouseEnter={() => setCursor('hover')}
        onMouseLeave={resetCursor}
        className="flex items-center gap-2 text-xs font-semibold text-[#78716C] hover:text-[#1B4332] transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Continue Shopping Fresh Produce</span>
      </button>

      <div className="pb-6 border-b border-[#E8E5DF] flex items-baseline justify-between">
        <div>
          <span className="text-xs uppercase font-bold text-[#D97706] tracking-wider block mb-1">
            Bhopal Doorstep Delivery
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1B4332] font-bold">
            Shopping Cart ({items.length} Items)
          </h1>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-20 text-center border border-[#E8E5DF] bg-white rounded-2xl mt-8 shadow-xs">
          <ShoppingBag className="w-12 h-12 text-[#78716C] mx-auto mb-3 opacity-40" />
          <h3 className="font-serif text-2xl text-[#1B4332] font-bold mb-1">Your Cart is Empty</h3>
          <p className="text-sm text-[#78716C] max-w-sm mx-auto mb-5">
            Add pure A2 Gir cow milk, Vedic bilona ghee, or MP Sharbati wheat flour to start your order.
          </p>
          <button
            onClick={onContinueShopping}
            className="px-6 py-2.5 bg-[#1B4332] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-8">
          
          {/* Items List */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Free Delivery Bar */}
            <div className="p-4 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-xs">
              {amountNeededForFreeShipping === 0 ? (
                <div className="text-[#065F46] font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#059669]" />
                  <span>Complimentary Doorstep Delivery Unlocked across Bhopal!</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[#065F46] font-medium text-xs">
                    <span>Add ₹{amountNeededForFreeShipping.toFixed(0)} more for FREE Delivery in Bhopal</span>
                    <span>Goal: ₹{freeShippingThreshold}</span>
                  </div>
                  <div className="w-full h-2 bg-[#D1FAE5] rounded-full overflow-hidden">
                    <div className="h-full bg-[#059669]" style={{ width: `${progressToFreeShipping}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Area and Slot Customizer */}
            <div className="p-4 bg-white border border-[#E8E5DF] rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[#78716C] font-semibold mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#1B4332]" />
                  <span>Bhopal Locality:</span>
                </label>
                <select
                  value={selectedBhopalArea}
                  onChange={(e) => setSelectedBhopalArea(e.target.value)}
                  className="w-full bg-[#FBF9F5] border border-[#E8E5DF] rounded-lg p-2 text-xs font-medium focus:outline-none"
                >
                  {BHOPAL_AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#78716C] font-semibold mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Delivery Slot:</span>
                </label>
                <select
                  value={selectedDeliverySlot}
                  onChange={(e) => setSelectedDeliverySlot(e.target.value)}
                  className="w-full bg-[#FBF9F5] border border-[#E8E5DF] rounded-lg p-2 text-xs font-medium focus:outline-none"
                >
                  <option value="Morning 6:00 AM – 8:30 AM (Farm Chilled)">Morning 6:00 AM – 8:30 AM (Farm Chilled)</option>
                  <option value="Evening 5:30 PM – 8:00 PM">Evening 5:30 PM – 8:00 PM</option>
                  <option value="Same-Day 90 Mins Express Slot">Same-Day 90 Mins Express Slot</option>
                </select>
              </div>
            </div>

            {/* Items */}
            <div className="divide-y divide-[#E8E5DF] border border-[#E8E5DF] bg-white rounded-xl shadow-xs overflow-hidden">
              {items.map((item) => {
                const itemPrice = item.product.price + (item.selectedVariant.priceModifier || 0);
                return (
                  <div key={item.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-18 h-20 object-cover rounded-lg bg-[#FBF9F5] border border-[#E8E5DF] shrink-0"
                      />
                      <div>
                        <span className="text-[10px] text-[#D97706] font-bold uppercase tracking-wide">
                          {item.product.category}
                        </span>
                        <h4 
                          onClick={() => onSelectProduct(item.product)}
                          className="font-serif text-base font-bold text-[#1C1917] hover:text-[#1B4332] cursor-pointer"
                        >
                          {item.product.name}
                        </h4>
                        <p className="text-xs text-[#78716C]">
                          Pack: {item.selectedVariant.weightOrVolume}
                        </p>
                        <p className="text-xs text-[#1C1917] font-bold mt-1">
                          ₹{itemPrice} each
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto sm:gap-6">
                      {/* Stepper */}
                      <div className="flex items-center border border-[#E8E5DF] bg-[#FBF9F5] rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-1.5 text-xs font-bold text-[#78716C] hover:text-[#1C1917] cursor-pointer"
                        >
                          −
                        </button>
                        <span className="font-sans text-xs px-2.5 font-bold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1.5 text-xs font-bold text-[#78716C] hover:text-[#1C1917] cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-sans text-base font-bold tabular-nums text-[#1C1917]">
                        ₹{itemPrice * item.quantity}
                      </span>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-[#78716C] hover:text-red-600 p-2 cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Suggested Pairings */}
            {suggestedAdditions.length > 0 && (
              <div className="pt-8">
                <span className="text-xs uppercase font-bold text-[#78716C] tracking-wider block mb-3">
                  Frequently Ordered Together in Bhopal
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {suggestedAdditions.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => onSelectProduct(p)}
                      className="p-3 bg-white border border-[#E8E5DF] hover:border-[#1B4332] rounded-xl flex items-center gap-3 cursor-pointer group transition-all"
                    >
                      <img src={p.images[0]} alt={p.name} className="w-14 h-16 object-cover rounded-md bg-[#FBF9F5]" />
                      <div>
                        <p className="text-xs font-bold text-[#1C1917] group-hover:text-[#1B4332] line-clamp-1">
                          {p.name}
                        </p>
                        <p className="text-xs font-semibold text-[#D97706] mt-0.5">₹{p.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-4">
            <div className="p-6 bg-white border border-[#E8E5DF] rounded-2xl space-y-5 lg:sticky lg:top-36 shadow-xs">
              <h3 className="font-serif text-lg font-bold text-[#1B4332]">Order Summary</h3>

              {/* Coupon Form */}
              <form onSubmit={handleApply} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Coupon (SHYAM10)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 bg-[#FBF9F5] border border-[#E8E5DF] p-2 text-xs rounded uppercase font-mono text-[#1C1917] focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded cursor-pointer"
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
                <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded border border-emerald-200">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Tag className="w-3.5 h-3.5" />
                    {discountCode} ({(discountPercentage * 100).toFixed(0)}% Off)
                  </span>
                  <button onClick={removeDiscountCode} className="text-red-600 text-xs hover:underline">
                    Remove
                  </button>
                </div>
              )}

              {/* Price Table */}
              <div className="space-y-2 text-xs text-[#78716C] pt-2 border-t border-[#E8E5DF]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-[#1C1917] font-semibold tabular-nums">₹{subtotal.toFixed(2)}</span>
                </div>
                {discountPercentage > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount</span>
                    <span className="tabular-nums">-₹{(subtotal * discountPercentage).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery to {selectedBhopalArea.split('(')[0]}</span>
                  <span className="text-[#1C1917] font-semibold tabular-nums">
                    {shippingFee === 0 ? 'FREE' : `₹${shippingFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-base text-[#1C1917] font-bold pt-3 border-t border-[#E8E5DF]">
                  <span>Total Amount</span>
                  <span className="text-[#1B4332] tabular-nums">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={onProceedToCheckout}
                className="w-full py-3.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-[11px] text-center text-[#78716C] space-y-1">
                <p>✓ UPI (Google Pay/PhonePe) & Cash on Delivery available</p>
                <p>✓ Lab Certified A2 Purity Guarantee</p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
