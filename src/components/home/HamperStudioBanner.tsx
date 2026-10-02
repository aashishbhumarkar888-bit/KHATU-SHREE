import React from 'react';
import { Gift, Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Heart } from 'lucide-react';

interface HamperStudioBannerProps {
  onOpenHamperBuilder: () => void;
}

export const HamperStudioBanner: React.FC<HamperStudioBannerProps> = ({ onOpenHamperBuilder }) => {
  return (
    <section className="py-10 bg-[#F4F1EA] border-b border-[#E8E5DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1B4332] via-[#245A43] to-[#163628] text-white p-6 sm:p-10 shadow-xl border border-[#2D6A4F]">
          
          {/* Subtle background ornamentation */}
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-[#D97706]/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D97706] text-white text-[11px] font-bold uppercase tracking-wider shadow-xs">
                  <Gift className="w-3.5 h-3.5 text-[#FDE68A]" />
                  <span>Bhopal Festive Gifting Studio</span>
                </span>
                <span className="text-xs text-[#FDE68A] font-semibold">
                  ★ Automatic 15% Custom Bundle Discount
                </span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
                Curate a Sacred Custom <br />
                <span className="text-[#FDE68A] italic font-normal">Gift Box & Puja Hamper</span>
              </h2>

              <p className="text-sm sm:text-base text-white/85 max-w-xl leading-relaxed">
                Handpick handcrafted Sheesham wooden or brass boxes. Mix & match handloom khadi kurtas, 
                pure hammered copper bottles, unpolished pulses, and Vedic A2 Gir cow bilona ghee with a 
                personalized devotional blessing card for family, housewarmings, or temple offerings.
              </p>

              {/* Trust highlights */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/80 pt-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#FDE68A]" />
                  Includes Red Moli Ribbon & Kesar Tika
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#FDE68A]" />
                  Handwritten Devotional Blessing Card
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#FDE68A]" />
                  Same-Day Express Bhopal Delivery
                </span>
              </div>

              <div className="pt-2">
                <button
                  onClick={onOpenHamperBuilder}
                  className="px-6 py-3.5 bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#FDE68A]" />
                  <span>Open Custom Hamper Studio (खाटू उपहार स्टूडियो)</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>

            {/* Right Visual Image Showcase */}
            <div className="lg:col-span-5 flex justify-center">
              <div 
                onClick={onOpenHamperBuilder}
                className="relative w-full max-w-sm bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-2xl cursor-pointer group hover:bg-white/15 transition-all"
              >
                <div className="aspect-4/3 rounded-xl overflow-hidden bg-black/20 mb-3 relative">
                  <img
                    src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80"
                    alt="Custom Sacred Hamper Box"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/20">
                    Bespoke Curated Box
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-serif font-bold text-white block">
                      Sheesham Wood & Brass Jali Box
                    </span>
                    <span className="text-[11px] text-[#FDE68A]">
                      Select from 14+ Holy Offerings
                    </span>
                  </div>

                  <span className="px-3 py-1.5 bg-white text-[#1B4332] text-xs font-bold rounded-lg group-hover:bg-[#FDE68A] transition-colors">
                    Build ➔
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
