import React, { useEffect } from 'react';
import { ArrowLeft, RotateCcw, AlertCircle, CheckCircle2, ShieldCheck, Clock, FileText } from 'lucide-react';

interface ReturnsPolicyPageProps {
  onBackToHome: () => void;
}

export const ReturnsPolicyPage: React.FC<ReturnsPolicyPageProps> = ({ onBackToHome }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = '7-Day Return & Refund Policy | Khatu Shri Bhopal';
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
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Customer &amp; Reseller Protection</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1B4332] tracking-tight">
            7-Day Return &amp; Refund Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#78716C] mt-2 leading-relaxed">
            Transparent, fair, and prompt return standards for Bhopal residents and pan-India dropshipping orders. Last updated: October 2026.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 text-xs sm:text-sm text-[#57534E] leading-relaxed">
          
          {/* Section 1: Standard 7-Day Window */}
          <section className="bg-white border border-[#E8E5DF] p-6 rounded-2xl shadow-2xs space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#1B4332] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#D97706]" />
              <span>1. 7-Day Return Window &amp; Timelines</span>
            </h2>
            <p>
              For handloom apparel, sarees, copperware, spiritual puja brass utensils, and non-perishable pantry staples, buyers and resellers have <strong>7 calendar days</strong> from the date of confirmed doorstep delivery to initiate an exchange or return.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#1C1917]">
              <li><strong>Pickup Dispatch:</strong> Reverse courier pickup is scheduled within 24–48 hours of return acceptance.</li>
              <li><strong>Refund Processing:</strong> Refunds for prepaid orders are credited back to the original UPI / Bank account within 3–5 business days post warehouse quality check. COD orders are refunded via direct bank transfer or UPI.</li>
            </ul>
          </section>

          {/* Section 2: FSSAI Fresh Dairy Exemption */}
          <section className="bg-[#FFFDF9] border border-[#FDE68A] p-6 rounded-2xl shadow-2xs space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#B45309] flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#D97706]" />
              <span>2. Perishable Fresh Dairy Items (FSSAI Practice Notice)</span>
            </h2>
            <p>
              Under Food Safety and Standards Authority of India (FSSAI) guidelines and temperature cold-chain integrity rules, <strong>raw A2 Gir cow whole milk, freshly cut malai paneer, and hand-churned white butter (makkhan) cannot be returned once physically accepted and unsealed</strong>.
            </p>
            <div className="bg-white border border-[#E8E5DF] p-4 rounded-xl">
              <h4 className="font-bold text-[#1B4332] mb-1">Cold-Chain Replacement Guarantee:</h4>
              <p className="text-xs">
                If your dairy shipment arrives damaged, leaked, or curdled due to transit delay, take a photo and alert our Bhopal Hub Care team via WhatsApp (+91 98260 77123) within <strong>2 hours of morning delivery</strong>. We issue an instant 100% replacement dispatch or immediate wallet/bank refund.
              </p>
            </div>
          </section>

          {/* Section 3: Condition Requirements */}
          <section className="bg-white border border-[#E8E5DF] p-6 rounded-2xl shadow-2xs space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#1B4332] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#1B4332]" />
              <span>3. Product Condition Requirements for Acceptance</span>
            </h2>
            <p>
              To ensure hygiene, temple purity, and artisan integrity:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#1C1917]">
              <li><strong>Apparel:</strong> Must be unwashed, unworn, without perfume or deodorant scents, with all khadi authenticity tags intact.</li>
              <li><strong>Copper &amp; Utensils:</strong> Must be free from water stains, scratches, or abrasive cleaning marks with original protective box.</li>
              <li><strong>Bilona Ghee:</strong> Must remain sealed with the tamper-evident gold neck foil intact.</li>
              <li><strong>Puja Samagri:</strong> Bhimseni camphor, dhoop, and sandalwood items must have unopened factory seals.</li>
            </ul>
          </section>

          {/* Section 4: Return Initiation Steps */}
          <section className="bg-white border border-[#E8E5DF] p-6 rounded-2xl shadow-2xs space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#1B4332] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#1B4332]" />
              <span>4. How to Request a Return or Replacement</span>
            </h2>
            <p>
              Open your <strong>Account &gt; Orders &amp; Invoices</strong> tab, select the relevant Order ID, and tap <em>"Request Return / Support"</em>, or send an invoice snapshot to <strong>care@khatushri.in</strong> or WhatsApp <strong>+91 98260 77123</strong>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};
