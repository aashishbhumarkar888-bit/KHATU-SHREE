import React from 'react';
import { ArrowRight, ShieldCheck, Heart, Sparkles, Award } from 'lucide-react';
import { useCursor } from '../../context/CursorContext';

interface BrandStoryProps {
  onExploreCollection: () => void;
}

export const BrandStory: React.FC<BrandStoryProps> = ({ onExploreCollection }) => {
  const { setCursor, resetCursor } = useCursor();

  return (
    <section id="manifesto" className="py-20 bg-white border-t border-[#E8E5DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <div className="flex items-center gap-2 text-xs font-bold text-[#D97706] uppercase tracking-wider mb-2">
            <span>Our Gaushala & Heritage</span>
            <span aria-hidden="true">·</span>
            <span>Bhopal, Madhya Pradesh</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#1B4332] leading-tight">
            Reviving the Sacred Purity of <br />
            <span className="text-[#D97706] italic font-normal">Native Desi Cows, Khadi & MP Artisans</span>
          </h2>
          <p className="text-base text-[#57534E] mt-4 leading-relaxed">
            In an era of mass industrial factory goods and synthetic adulterations, <strong>Khatu Shri</strong> brings together 
            farm-fresh A2 Gir cow nutrition, handloom khadi garments, unpolished organic pantry staples, and handcrafted copper & bronze home utilities. 
            Direct from our Gaushala and master artisan guilds in Madhya Pradesh to every household in Bhopal and pan-India dropship resellers.
          </p>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 rounded-2xl bg-[#FBF9F5] border border-[#E8E5DF] flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#1B4332] text-[#D97706] flex items-center justify-center font-bold text-lg mb-4">
                01
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1B4332] mb-2">
                Pure Gir Cow Breeding
              </h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Our native Gir cows roam freely in open grazing pastures near Sehore. They are nourished on 
                organic green fodder, jowar, mineral blocks, and Ayurvedic herbs like Shatavari. We never use 
                synthetic lactation hormones or preventive antibiotics.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-[#E8E5DF] text-[11px] font-semibold text-[#1B4332]">
              ✓ Free Grazing · Non-Confined Gaushala
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#FBF9F5] border border-[#E8E5DF] flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#1B4332] text-[#D97706] flex items-center justify-center font-bold text-lg mb-4">
                02
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1B4332] mb-2">
                Vedic Bilona Churning
              </h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Our ghee is created from whole cultured curd churned using wooden bilona—the method prescribed 
                in Charaka Samhita. It takes up to 30 litres of pure A2 milk to make just 1 single litre of 
                danedaar ghee. That is our standard of zero compromise.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-[#E8E5DF] text-[11px] font-semibold text-[#1B4332]">
              ✓ Curd Churned · 0% Cream Separator
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#FBF9F5] border border-[#E8E5DF] flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#1B4332] text-[#D97706] flex items-center justify-center font-bold text-lg mb-4">
                03
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1B4332] mb-2">
                Bhopal Morning Cold-Chain
              </h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Milk is chilled to 4°C within 45 minutes of evening and morning milking. Packaged in sanitized, 
                eco-friendly glass bottles and dispatched to Bhopal localities (MP Nagar, Arera Colony, Kolar, 
                New Market, Hoshangabad Rd) before 8:30 AM every morning.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-[#E8E5DF] text-[11px] font-semibold text-[#1B4332]">
              ✓ Glass Bottles · Doorstep Morning Delivery
            </div>
          </div>
        </div>

        {/* Visual Callout Banner */}
        <div className="p-8 sm:p-12 rounded-2xl bg-[#1B4332] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <span className="text-xs font-bold text-[#D97706] uppercase tracking-wider block mb-1">
              Visit Our Sehore Gaushala
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold mb-2">
              Witness the Bilona Churning With Your Family
            </h3>
            <p className="text-xs text-[#E8E5DF] max-w-xl leading-relaxed">
              We welcome Bhopal families every Sunday to witness our milking, curd setting, and wood-press oil extraction. Transparency is our greatest virtue.
            </p>
          </div>
          <button
            onClick={onExploreCollection}
            className="px-6 py-3.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-md whitespace-nowrap cursor-pointer transition-colors"
          >
            Order Fresh Dairy
          </button>
        </div>

      </div>
    </section>
  );
};
