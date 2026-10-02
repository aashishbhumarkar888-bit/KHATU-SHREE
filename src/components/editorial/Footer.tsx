import React, { useState } from 'react';
import { ArrowRight, Check, ShieldCheck, MapPin, Phone, Mail } from 'lucide-react';
import { useCursor } from '../../context/CursorContext';

interface FooterProps {
  onNavigateShop: (cat?: string) => void;
  onNavigateAbout: () => void;
  onOpenConcierge: () => void;
  onNavigateReturns?: () => void;
  onNavigateTerms?: () => void;
  onNavigatePrivacy?: () => void;
  onNavigateShipping?: () => void;
  onNavigateAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateShop,
  onNavigateAbout,
  onOpenConcierge,
  onNavigateReturns,
  onNavigateTerms,
  onNavigatePrivacy,
  onNavigateShipping,
  onNavigateAdmin,
}) => {
  const { setCursor, resetCursor } = useCursor();
  const [newsletterPhone, setNewsletterPhone] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterPhone) return;
    setSubscribed(true);
  };

  return (
    <footer className="bg-[#14261C] border-t border-[#2D6A4F] text-[#FBF9F5] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#2D6A4F]/60">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#1B4332] border border-[#D97706] flex items-center justify-center text-[#D97706] font-bold text-sm">
                ॐ
              </div>
              <div>
                <span className="font-serif text-xl font-bold tracking-tight text-white block leading-none">
                  KHATU SHRI
                </span>
                <span className="text-[10px] text-[#DDA15E] font-semibold">
                  Dropship &amp; Wholesale Direct Marketplace · Bhopal, MP
                </span>
              </div>
            </div>

            <p className="text-xs text-[#E8E5DF] leading-relaxed max-w-sm">
              Hand-churned A2 Gir cow bilona ghee, morning farm-fresh raw milk, stone-ground 
              Sehore Sharbati gehu aata, cold-pressed wood oils, and pure Vedic puja samagri. 
              Delivered daily across Bhopal, Madhya Pradesh.
            </p>

            <div className="pt-1 flex items-center gap-2 text-xs text-[#D97706] font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>FSSAI Lic. No: 11422850000341 (MP State Certified)</span>
            </div>
          </div>

          {/* Quick Categories */}
          <div className="space-y-3 text-xs">
            <span className="text-[#D97706] uppercase tracking-wider block font-bold text-[11px]">
              Daily Fresh Categories
            </span>
            <ul className="space-y-2 text-[#E8E5DF]">
              <li>
                <button
                  onClick={() => onNavigateShop('Farm Fresh Dairy & Desi Ghee')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  A2 Gir Cow Milk & Vedic Ghee
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateShop('Farm Fresh Dairy & Desi Ghee')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Fresh Malai Paneer & Makkhan
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateShop('MP Grains & Organic Staples')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Sehore Sharbati Wheat Aata
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateShop('Cold-Pressed Kachi Ghani Oils')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Wood-Pressed Mustard Oil
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateShop('Spiritual & Pure Puja Samagri')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Bhimseni Camphor & Havan Cups
                </button>
              </li>
            </ul>
          </div>

          {/* Bhopal Hubs */}
          <div className="space-y-3 text-xs">
            <span className="text-[#D97706] uppercase tracking-wider block font-bold text-[11px]">
              Bhopal Store & Gaushala
            </span>
            <ul className="space-y-2.5 text-[#E8E5DF]">
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#D97706] shrink-0 mt-0.5" />
                <span>
                  <strong>MP Nagar Depot:</strong> Plot 14, Zone 1, Near Chetak Bridge, Bhopal, MP 462011
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#D97706] shrink-0 mt-0.5" />
                <span>
                  <strong>Arera Colony Hub:</strong> Commercial Complex, E-3 Bittan Market, Bhopal 462016
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#D97706] shrink-0 mt-0.5" />
                <span>Helpline: +91 755 2489000 / +91 98260 12345</span>
              </li>
            </ul>
          </div>

          {/* Morning Milk Subscription */}
          <div className="space-y-3 text-xs">
            <span className="text-[#D97706] uppercase tracking-wider block font-bold text-[11px]">
              Daily Morning Milk Alert
            </span>
            <p className="text-[11px] text-[#E8E5DF] leading-relaxed">
              Enter your WhatsApp number to receive morning milk dispatch updates in Bhopal.
            </p>
            {subscribed ? (
              <div className="p-2.5 bg-emerald-900/60 border border-emerald-500 text-emerald-200 text-xs rounded flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Registered for Bhopal Morning Updates!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                <input
                  type="tel"
                  required
                  placeholder="+91 Mobile Number"
                  value={newsletterPhone}
                  onChange={(e) => setNewsletterPhone(e.target.value)}
                  className="bg-[#081C15] border border-[#2D6A4F] p-2 text-xs text-white placeholder:text-[#78716C] rounded focus:outline-none"
                />
                <button
                  type="submit"
                  className="py-2 px-3 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded transition-colors cursor-pointer"
                >
                  Start Morning Alerts
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Compliance & Trust Navigation */}
        <div className="pt-6 pb-4 border-t border-[#2D6A4F]/40 flex flex-wrap items-center justify-between text-xs text-[#E8E5DF] gap-3">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
            <button
              onClick={onNavigateReturns}
              className="hover:text-[#DDA15E] transition-colors cursor-pointer"
            >
              7-Day Returns &amp; Refunds
            </button>
            <button
              onClick={onNavigateTerms}
              className="hover:text-[#DDA15E] transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              onClick={onNavigatePrivacy}
              className="hover:text-[#DDA15E] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={onNavigateShipping}
              className="hover:text-[#DDA15E] transition-colors cursor-pointer"
            >
              Shipping &amp; Delivery
            </button>
          </div>

          <div>
            <button
              onClick={onNavigateAdmin}
              className="text-[11px] text-[#A8A29E] hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Console /admin</span>
            </button>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#A8A29E] gap-3">
          <div>
            <span>© 2026 Khatu Shri, Bhopal (MP). All Rights Reserved. Dropshipping &amp; Reseller Direct.</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onOpenConcierge} className="hover:text-white transition-colors cursor-pointer">
              Shyam AI Vaidya
            </button>
            <button onClick={onNavigateShipping} className="hover:text-white transition-colors cursor-pointer">
              Bhopal Express Coverage
            </button>
            <button onClick={onNavigateTerms} className="hover:text-white transition-colors cursor-pointer">
              0% Reseller Platform
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
