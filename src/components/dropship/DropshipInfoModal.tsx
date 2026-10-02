import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  TrendingUp, 
  ShieldCheck, 
  Truck, 
  Sparkles, 
  CheckCircle2, 
  DollarSign, 
  Package, 
  Copy, 
  Check, 
  PhoneCall, 
  Award,
  Zap,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToastNotification } from '../../context/ToastNotificationContext';
import { PRODUCTS } from '../../data/products';

interface DropshipInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExploreProducts: () => void;
}

export const DropshipInfoModal: React.FC<DropshipInfoModalProps> = ({
  isOpen,
  onClose,
  onExploreProducts,
}) => {
  const { user } = useAuth();
  const { showCustomToast } = useToastNotification();
  const [copiedLink, setCopiedLink] = useState(false);
  const [resaleMultiplier, setResaleMultiplier] = useState(1.35); // 35% margin default

  if (!isOpen) return null;

  const sampleWholesalePrice = 450;
  const calculatedRetailPrice = Math.round(sampleWholesalePrice * resaleMultiplier);
  const calculatedProfit = calculatedRetailPrice - sampleWholesalePrice;

  const handleCopyResellerLink = () => {
    navigator.clipboard.writeText(window.location.origin + '?ref=dropship_reseller');
    setCopiedLink(true);
    showCustomToast({
      orderId: 'DROPSHIP-LINK',
      newStatus: 'delivered',
      title: 'Reseller Link Copied! 📋',
      message: 'Share your personal Khatu Shri dropship catalog link on WhatsApp or social media.',
      duration: 4000,
    });
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border border-[#E8E5DF] text-[#1C1917] w-full max-w-3xl rounded-2xl shadow-2xl relative overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#1B4332] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#DDA15E] text-[#1B4332] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 fill-current" />
              Meesho & Amazon Style Dropshipping
            </span>
            <span className="text-white/80 text-xs">· Zero Inventory Required</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF7F2]">
            Khatu Shri Reseller & Dropshipping Program
          </h2>
          <p className="text-xs text-[#FAF7F2]/80 mt-1 max-w-xl">
            Start your own online store with zero investment. Buy directly from authentic artisans, gaushalas, and handloom weavers at wholesale factory rates, add your own profit margin, and we dispatch directly to your customers with plain packaging!
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* 4-Step Dropship Mechanics */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#78716C] mb-3">
              How Dropshipping Works at Khatu Shri
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8E5DF] space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-[#1B4332] text-white flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h4 className="font-bold text-[#1C1917]">Select Products</h4>
                <p className="text-[11px] text-[#78716C]">
                  Browse sarees, copperware, A2 dairy, and organic grains at factory wholesale rates.
                </p>
              </div>

              <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8E5DF] space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-[#B45309] text-white flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h4 className="font-bold text-[#1C1917]">Share with Margin</h4>
                <p className="text-[11px] text-[#78716C]">
                  Share pictures & descriptions on WhatsApp or Instagram with your custom selling price.
                </p>
              </div>

              <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8E5DF] space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h4 className="font-bold text-[#1C1917]">We Ship to Customer</h4>
                <p className="text-[11px] text-[#78716C]">
                  Our Bhopal fulfillment hub packs & delivers with COD. Your name on the shipping label!
                </p>
              </div>

              <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8E5DF] space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-700 text-white flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <h4 className="font-bold text-[#1C1917]">Keep Your Profits</h4>
                <p className="text-[11px] text-[#78716C]">
                  Profit margin automatically credited to your UPI or Bank account within 24 hours of delivery.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Dropship Margin Calculator */}
          <div className="p-4 bg-[#FFFBEB] rounded-2xl border border-[#FDE68A] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#B45309]" />
                <span className="text-xs font-bold text-[#B45309] uppercase tracking-wider">
                  Live Dropship Margin Calculator
                </span>
              </div>
              <span className="text-xs font-bold text-[#1B4332]">
                Profit Margin: {Math.round((resaleMultiplier - 1) * 100)}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-2.5 bg-white rounded-xl border border-[#FDE68A]/60">
                <span className="text-[10px] text-[#78716C] uppercase font-bold block">
                  Wholesale Supplier Cost
                </span>
                <span className="text-lg font-bold text-[#1C1917]">₹{sampleWholesalePrice}</span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-[#FDE68A]/60">
                <span className="text-[10px] text-[#78716C] uppercase font-bold block">
                  Your Resale Price
                </span>
                <span className="text-lg font-bold text-[#1B4332]">₹{calculatedRetailPrice}</span>
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-300">
                <span className="text-[10px] text-emerald-800 uppercase font-bold block">
                  Your Net Profit Margin
                </span>
                <span className="text-lg font-bold text-emerald-700">+₹{calculatedProfit} / order</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-[#78716C]">
                <span>Conservative Margin (+15%)</span>
                <span>Balanced (+35%)</span>
                <span>High Premium (+75%)</span>
              </div>
              <input
                type="range"
                min="1.15"
                max="1.75"
                step="0.05"
                value={resaleMultiplier}
                onChange={(e) => setResaleMultiplier(parseFloat(e.target.value))}
                className="w-full accent-[#1B4332] cursor-pointer"
              />
            </div>
          </div>

          {/* Key Dropshipper Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-white rounded-xl border border-[#E8E5DF] text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#1B4332]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Zero Inventory Risk</span>
              </div>
              <p className="text-[11px] text-[#78716C]">
                Never hold stock. You only place the order after your customer pays or confirms COD.
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-[#E8E5DF] text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#1B4332]">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Bhopal & Pan-India Dispatch</span>
              </div>
              <p className="text-[11px] text-[#78716C]">
                Same-day delivery in Bhopal via refrigerated fleet, 3-4 days courier across all Indian states.
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-[#E8E5DF] text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#1B4332]">
                <Package className="w-4 h-4 text-[#DDA15E]" />
                <span>White-Label Packaging</span>
              </div>
              <p className="text-[11px] text-[#78716C]">
                Neutral outer packaging with no supplier invoices so your customers remain loyal to you.
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#E8E5DF]">
            <button
              onClick={handleCopyResellerLink}
              className="w-full sm:w-auto px-4 py-2.5 bg-white border border-[#E8E5DF] hover:border-[#1B4332] text-[#1C1917] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#78716C]" />}
              <span>{copiedLink ? 'Catalog Link Copied' : 'Share WhatsApp Catalog'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onExploreProducts();
              }}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore Wholesale Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
