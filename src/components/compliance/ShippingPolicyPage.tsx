import React, { useEffect } from 'react';
import { ArrowLeft, Truck, Package, Clock, ShieldCheck, MapPin, CheckCircle2 } from 'lucide-react';

interface ShippingPolicyPageProps {
  onBackToHome: () => void;
}

export const ShippingPolicyPage: React.FC<ShippingPolicyPageProps> = ({ onBackToHome }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'Shipping & Delivery Policy | Khatu Shri Bhopal';
  }, []);

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1C1917] pt-24 sm:pt-28 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Navigation Breadcrumb */}
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B4332] hover:text-[#2D6A4F] mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Marketplace</span>
        </button>

        {/* Page Header */}
        <div className="bg-white border border-[#E8E5DF] p-6 sm:p-8 rounded-2xl shadow-sm mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] text-xs font-bold mb-3 uppercase tracking-wider">
            <Truck className="w-3.5 h-3.5" />
            <span>Fulfillment &amp; Cold-Chain Log</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1B4332] tracking-tight">
            Shipping &amp; Delivery Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#78716C] mt-2 leading-relaxed">
            Speed, temperature safety, and pan-India dropshipping packaging standards operated from Bhopal, MP.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 text-xs sm:text-sm text-[#57534E] leading-relaxed">
          
          {/* Section 1: Bhopal Same-Day Chilled Express */}
          <section className="bg-white border border-[#E8E5DF] p-6 rounded-2xl shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-[#1B4332] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#D97706]" />
                <span>1. Bhopal Local Same-Day Chilled Express</span>
              </h2>
              <span className="text-[10px] bg-[#DCFCE7] text-[#15803D] font-bold px-2 py-0.5 rounded-full uppercase">
                Cutoff 6:00 PM
              </span>
            </div>
            <p>
              For addresses within Bhopal municipal limits, orders placed <strong>before 6:00 PM daily</strong> qualify for same-day or early next-morning farm-fresh delivery:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E8E5DF]">
                <span className="font-bold text-[#1B4332] block text-xs">Morning Chilled Slot:</span>
                <span className="text-[11px] text-[#57534E] block mt-0.5">6:00 AM – 8:30 AM (Farm raw milk, fresh paneer, makkhan)</span>
              </div>
              <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E8E5DF]">
                <span className="font-bold text-[#1B4332] block text-xs">Evening Sunset Slot:</span>
                <span className="text-[11px] text-[#57534E] block mt-0.5">5:30 PM – 8:30 PM (Organic groceries, apparel, puja items)</span>
              </div>
            </div>
            <p className="text-xs text-[#78716C]">
              Dispatched via refrigerated electric delivery vans directly from our central MP Nagar Zone 1 logistics depot.
            </p>
          </section>

          {/* Section 2: Pan-India Express Delivery */}
          <section className="bg-white border border-[#E8E5DF] p-6 rounded-2xl shadow-2xs space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#1B4332] flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#1B4332]" />
              <span>2. Pan-India Express Courier (3–5 Business Days)</span>
            </h2>
            <p>
              For tier-1, tier-2, and rural pin codes across India, shipments are dispatched via national air and surface express couriers (Bluedart, Delhivery, Xpressbees, Shadowfax).
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#1C1917]">
              <li><strong>Free Delivery Threshold:</strong> All orders over <strong>₹499</strong> ship free of charge. Orders under ₹499 carry a nominal ₹40 standard delivery fee.</li>
              <li><strong>Cash on Delivery (COD):</strong> Full COD availability across 19,000+ Indian postal codes with zero additional COD surcharge.</li>
              <li><strong>Real-time Tracking:</strong> An automated SMS and WhatsApp link with live courier GPS tracking is sent the moment your parcel leaves our central Bhopal hub.</li>
            </ul>
          </section>

          {/* Section 3: Specialized Packaging Choices */}
          <section className="bg-white border border-[#E8E5DF] p-6 rounded-2xl shadow-2xs space-y-4">
            <h2 className="font-serif text-lg font-bold text-[#1B4332] flex items-center gap-2">
              <Package className="w-5 h-5 text-[#D97706]" />
              <span>3. Specialized Packaging Options</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E5DF]">
                <h4 className="font-bold text-[#1B4332] text-xs mb-1">Standard Eco-Kraft</h4>
                <p className="text-[11px] text-[#57534E]">
                  100% biodegradable corrugated cardboard with paper honeycomb cushioning. Completely plastic-neutral.
                </p>
              </div>

              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E5DF]">
                <h4 className="font-bold text-[#B45309] text-xs mb-1">Devotional Gift Box</h4>
                <p className="text-[11px] text-[#57534E]">
                  Embossed sacred saffron gift box tied with sacred mauli Rakshasutra and fresh Tulsi leaves for auspicious puja gifting.
                </p>
              </div>

              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E5DF]">
                <h4 className="font-bold text-[#15803D] text-xs mb-1">Cold-Chain Insulated</h4>
                <p className="text-[11px] text-[#57534E]">
                  Double-walled insulated food box packed with frozen reusable dry gel packs keeping dairy fresh below 4°C for 24+ hours.
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
