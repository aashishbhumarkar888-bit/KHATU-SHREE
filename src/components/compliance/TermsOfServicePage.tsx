import React, { useEffect } from 'react';
import { ArrowLeft, Shield, Users, Building, Scale, CheckCircle2 } from 'lucide-react';

interface TermsOfServicePageProps {
  onBackToHome: () => void;
}

export const TermsOfServicePage: React.FC<TermsOfServicePageProps> = ({ onBackToHome }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'Terms of Service | Khatu Shri Marketplace';
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
            <Scale className="w-3.5 h-3.5" />
            <span>Commercial &amp; Reseller Agreement</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1B4332] tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-[#78716C] mt-2 leading-relaxed">
            Operating agreements, marketplace responsibilities, and reseller rights governing Khatu Shri, Bhopal (MP).
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 text-xs sm:text-sm text-[#57534E] leading-relaxed">
          
          {/* Section 1: Introduction */}
          <section className="bg-white border border-[#E8E5DF] p-6 rounded-2xl shadow-2xs space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#1B4332] flex items-center gap-2">
              <Building className="w-5 h-5 text-[#D97706]" />
              <span>1. Marketplace Structure &amp; Parties</span>
            </h2>
            <p>
              Welcome to <strong>Khatu Shri</strong>. These terms govern the relationship between Khatu Shri (operating from the Central Processing &amp; Logistics Hub, Bhopal, Madhya Pradesh), retail consumers, and certified independent dropshipping resellers. By placing an order, registering an account, or downloading catalog collateral, you agree to these terms.
            </p>
          </section>

          {/* Section 2: Marketplace / Reseller Responsibility Split */}
          <section className="bg-white border border-[#E8E5DF] p-6 rounded-2xl shadow-2xs space-y-4">
            <h2 className="font-serif text-lg font-bold text-[#1B4332] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#1B4332]" />
              <span>2. Marketplace &amp; Reseller Responsibility Split</span>
            </h2>
            <p>
              Khatu Shri operates an indigenous, transparent dropshipping architecture inspired by top Indian social commerce standards:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E5DF]">
                <h4 className="font-bold text-[#1B4332] mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#1B4332]" />
                  <span>Khatu Shri Responsibilities:</span>
                </h4>
                <ul className="list-disc pl-4 space-y-1 text-xs text-[#57534E]">
                  <li>0% Platform Commission fees for registered resellers.</li>
                  <li>Direct procurement from verified Gaushalas, khadi weavers, and MP organic farmers.</li>
                  <li>White-label neutral packaging (no Khatu Shri price tags on end-customer parcels).</li>
                  <li>Same-day Bhopal dispatch and pan-India express courier fulfillment.</li>
                  <li>Accurate FSSAI lab testing and batch verification.</li>
                </ul>
              </div>

              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E5DF]">
                <h4 className="font-bold text-[#B45309] mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#B45309]" />
                  <span>Reseller Responsibilities:</span>
                </h4>
                <ul className="list-disc pl-4 space-y-1 text-xs text-[#57534E]">
                  <li>Accurate representation of wholesale products to end-consumers without false claims.</li>
                  <li>Determining retail markup (suggested 30%–50% above wholesale).</li>
                  <li>Accurate end-customer shipping address and phone collection.</li>
                  <li>Assisting end-customers with preliminary order status tracking.</li>
                  <li>Adherence to fair trade and non-exploitative pricing norms.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3: Pricing & Payments */}
          <section className="bg-white border border-[#E8E5DF] p-6 rounded-2xl shadow-2xs space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#1B4332] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#D97706]" />
              <span>3. Pricing, Cash on Delivery (COD) &amp; Payouts</span>
            </h2>
            <p>
              Wholesale rates quoted on the catalog are inclusive of central taxes. For COD orders, couriers collect the total resale amount specified by the reseller. Collected COD funds are reconciled against wholesale costs, and reseller profits are credited directly to the reseller's registered bank/UPI account weekly.
            </p>
          </section>

          {/* Section 4: Governing Law */}
          <section className="bg-white border border-[#E8E5DF] p-6 rounded-2xl shadow-2xs space-y-2">
            <h2 className="font-serif text-lg font-bold text-[#1B4332]">
              4. Jurisdiction &amp; Dispute Resolution
            </h2>
            <p>
              Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the competent courts of <strong>Bhopal, Madhya Pradesh, India</strong>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};
