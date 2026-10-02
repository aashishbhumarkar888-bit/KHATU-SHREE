import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ShoppingBag, 
  Sparkles, 
  Menu, 
  X, 
  Heart, 
  MapPin, 
  ChevronDown, 
  LogIn,
  Package,
  Gift,
  HelpCircle,
  Truck
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { BHOPAL_AREAS } from '../../data/products';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenConcierge: () => void;
  onOpenAccount: () => void;
  onNavigateHome: () => void;
  onNavigateShop: (category?: string) => void;
  onNavigateAbout: () => void;
  onOpenWishlist: () => void;
  onOpenHamperBuilder?: () => void;
  onOpenDropshipInfo?: () => void;
}

const CATEGORIES = [
  { label: 'All Products', category: 'All Products' },
  { label: 'Farm-Fresh A2 Dairy', category: 'Farm Fresh Dairy & Desi Ghee' },
  { label: 'Kurtis & Sarees', category: 'Apparel & Traditional Clothes' },
  { label: 'Copper & Kitchenware', category: 'Home Utilities & Kitchenware' },
  { label: 'Organic Staples', category: 'Daily Necessities & Household Staples' },
  { label: 'Spiritual Puja Samagri', category: 'Spiritual & Pure Puja Samagri' },
];

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenConcierge,
  onOpenAccount,
  onNavigateHome,
  onNavigateShop,
  onNavigateAbout,
  onOpenWishlist,
  onOpenHamperBuilder,
}) => {
  const { itemCount, openCart, selectedBhopalArea, setSelectedBhopalArea, total } = useCart();
  const { user, wishlist, khatuPoints } = useAuth();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [searchInputText, setSearchInputText] = useState('');
  
  const areaDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (areaDropdownRef.current && !areaDropdownRef.current.contains(e.target as Node)) {
        setShowAreaDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenSearch();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white">
      {/* 1. TOP ANNOUNCEMENT STRIP (Sleek & Calming) */}
      <div className="bg-[#143425] text-white text-[11px] py-1.5 px-3 sm:px-6 border-b border-[#23533c]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-hidden truncate">
            <span className="inline-block w-2 h-2 rounded-full bg-[#DDA15E] animate-pulse shrink-0" />
            <span className="truncate font-medium text-white/95">
              Bhopal Same-Day Dispatch &amp; Pan-India Delivery · Free Doorstep Delivery Over ₹499
            </span>
          </div>

          <div className="hidden md:flex items-center gap-4 text-[11px] text-[#DDA15E] shrink-0 font-medium">
            <button
              onClick={onOpenAccount}
              className="hover:text-white transition-colors cursor-pointer text-[#FAF7F2]/80 flex items-center gap-1"
            >
              <Package className="w-3 h-3 text-[#DDA15E]" />
              <span>Track Orders</span>
            </button>
            <span className="text-white/30">|</span>
            <button
              onClick={onNavigateAbout}
              className="hover:text-white transition-colors cursor-pointer text-[#FAF7F2]/80"
            >
              Why Khatu Shri?
            </button>
            <span className="text-white/30">|</span>
            <a
              href="https://wa.me/919826077123"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors text-[#FAF7F2]/80 flex items-center gap-1"
            >
              <HelpCircle className="w-3 h-3 text-[#DDA15E]" />
              <span>Care: +91 98260 77123</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER (Spacious, Balanced & Clean) */}
      <div className={`transition-shadow duration-200 ${isScrolled ? 'shadow-sm border-b border-[#E8E5DF]' : 'border-b border-[#E8E5DF]/80'}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Brand Logo & Location */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <button
              onClick={onNavigateHome}
              className="text-left flex items-center gap-2.5 cursor-pointer group"
              title="Khatu Shri Home"
            >
              <div className="w-9 h-9 rounded-xl bg-[#1B4332] flex items-center justify-center text-[#DDA15E] shadow-sm group-hover:bg-[#2D6A4F] transition-colors shrink-0">
                <span className="font-serif text-lg font-bold">ॐ</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1B4332] group-hover:text-[#2D6A4F] transition-colors leading-none">
                    KHATU SHRI
                  </span>
                  <span className="text-[10px] font-bold text-[#B45309] bg-[#FFFBEB] px-1 rounded border border-[#FDE68A] uppercase">
                    खाटू श्री
                  </span>
                </div>
                <span className="text-[9px] uppercase tracking-wider text-[#78716C] font-semibold">
                  Wholesale &amp; Pure Living
                </span>
              </div>
            </button>

            {/* Bhopal Delivery Area Selector (Clean Pill) */}
            <div className="relative hidden xl:block shrink-0" ref={areaDropdownRef}>
              <button
                type="button"
                onClick={() => setShowAreaDropdown(!showAreaDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E8E5DF] hover:border-[#1B4332] bg-[#FAF7F2] hover:bg-white text-xs text-[#1C1917] transition-all cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
                <div className="text-left leading-tight">
                  <span className="text-[9px] uppercase tracking-wider text-[#78716C] block">Bhopal Hub</span>
                  <span className="font-semibold text-[#1B4332] truncate max-w-[100px] block text-[11px]">
                    {selectedBhopalArea.split('(')[0]}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-[#78716C]" />
              </button>

              {showAreaDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-[#E8E5DF] rounded-xl shadow-xl p-2 z-50 max-h-72 overflow-y-auto">
                  <div className="px-2 py-1 text-[10px] font-bold text-[#78716C] uppercase tracking-wider">
                    Select Bhopal Locality
                  </div>
                  {BHOPAL_AREAS.map((area) => (
                    <button
                      key={area}
                      onClick={() => {
                        setSelectedBhopalArea(area);
                        setShowAreaDropdown(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-[#FAF7F2] transition-colors ${
                        selectedBhopalArea === area ? 'bg-[#1B4332]/10 text-[#1B4332] font-semibold' : 'text-[#1C1917]'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Central Search Bar (Simplified & Spacious) */}
          <form 
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-lg mx-2 hidden md:flex items-center bg-[#FAF7F2] hover:bg-white focus-within:bg-white border border-[#E8E5DF] focus-within:border-[#1B4332] focus-within:ring-2 focus-within:ring-[#1B4332]/10 rounded-full px-3 py-1.5 transition-all shadow-2xs"
          >
            <Search className="w-4 h-4 text-[#78716C] mr-2 shrink-0" />
            <input
              type="text"
              value={searchInputText}
              onChange={(e) => setSearchInputText(e.target.value)}
              onClick={onOpenSearch}
              placeholder="Search Vedic ghee, kurtis, copperware, organic staples..."
              className="flex-1 text-xs text-[#1C1917] placeholder:text-[#A8A29E] bg-transparent focus:outline-none"
            />
            <button
              type="submit"
              className="text-xs font-semibold text-[#1B4332] hover:text-[#2D6A4F] px-2 py-0.5 rounded-full hover:bg-[#1B4332]/10 transition-colors cursor-pointer shrink-0"
            >
              Search
            </button>
          </form>

          {/* Action Suite (AI Advisor, Wishlist, Account, Cart) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Mobile Search Icon */}
            <button
              onClick={onOpenSearch}
              className="md:hidden p-2 text-[#78716C] hover:text-[#1B4332] hover:bg-[#FAF7F2] rounded-lg border border-[#E8E5DF] cursor-pointer"
              title="Search Products"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Ayurvedic AI Vaidya / Advisor */}
            <button
              onClick={onOpenConcierge}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#DDA15E]/50 bg-[#FFFDF9] hover:bg-[#FAF7F2] text-[#1B4332] text-xs font-semibold transition-all cursor-pointer shadow-2xs hover:border-[#1B4332]"
              title="Ayurvedic Nutrition & Purity Guide"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
              <span className="hidden md:inline">AI Vaidya</span>
              <span className="md:hidden">Advisor</span>
            </button>

            {/* Wishlist */}
            <button
              onClick={onOpenWishlist}
              className="p-2 text-[#78716C] hover:text-[#1B4332] hover:bg-[#FAF7F2] rounded-xl transition-colors relative cursor-pointer"
              title="Saved Wishlist"
            >
              <Heart className="w-4 h-4" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#D97706]" />
              )}
            </button>

            {/* User Account / Sign In */}
            <button
              onClick={onOpenAccount}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#E8E5DF] hover:border-[#1B4332] bg-white text-xs font-semibold text-[#1C1917] transition-all cursor-pointer shadow-2xs"
              title="Account & Orders"
            >
              {user ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-[#1B4332] text-[#DDA15E] text-[10px] flex items-center justify-center font-bold">
                    {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden lg:block leading-tight">
                    <span className="text-[9px] text-[#78716C] block truncate max-w-[80px]">
                      {user.displayName?.split(' ')[0] || 'Member'}
                    </span>
                    <span className="text-[10px] font-bold text-[#B45309]">
                      {khatuPoints} Pts
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5 text-[#B45309]" />
                  <span className="font-bold text-xs">Sign In</span>
                </>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={openCart}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl transition-all cursor-pointer shadow-sm"
              title="View Cart"
            >
              <ShoppingBag className="w-4 h-4 text-[#DDA15E]" />
              <span className="font-mono text-xs font-bold tabular-nums">
                {itemCount}
              </span>
              {total > 0 && (
                <span className="hidden xl:inline text-xs font-semibold text-[#DDA15E] pl-1 border-l border-white/20">
                  ₹{Math.round(total)}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-[#78716C] hover:text-[#1C1917] rounded-lg border border-[#E8E5DF] cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>

      {/* 3. CATEGORY SUB-NAVIGATION (Clean & Uncluttered) */}
      <div className="bg-[#FAF7F2] border-b border-[#E8E5DF] text-xs overflow-x-auto hide-scrollbar">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between gap-4 py-1.5">
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <button
              onClick={() => onNavigateShop()}
              className="font-bold text-[#1B4332] hover:text-[#2D6A4F] flex items-center gap-1.5 cursor-pointer text-xs"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>All Categories</span>
            </button>

            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => onNavigateShop(cat.category)}
                className="text-[#57534E] hover:text-[#1B4332] font-medium whitespace-nowrap transition-colors cursor-pointer text-xs"
              >
                {cat.label}
              </button>
            ))}

            {onOpenHamperBuilder && (
              <button
                onClick={onOpenHamperBuilder}
                className="text-[#B45309] hover:text-[#92400E] font-semibold flex items-center gap-1 whitespace-nowrap cursor-pointer text-xs"
              >
                <Gift className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Custom Gift Hampers</span>
              </button>
            )}
          </div>

          <div className="hidden xl:flex items-center gap-3 text-[11px] text-[#78716C] shrink-0 font-medium">
            <span className="text-[#1B4332] font-semibold flex items-center gap-1">
              <Truck className="w-3 h-3 text-[#1B4332]" />
              Same-Day Bhopal Dispatch
            </span>
            <span>·</span>
            <span>100% Vedic Purity</span>
          </div>
        </div>
      </div>

      {/* 4. MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white/98 backdrop-blur-xl flex flex-col p-5 lg:hidden overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E5DF]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#1B4332] flex items-center justify-center text-[#DDA15E] font-serif font-bold text-sm">
                ॐ
              </div>
              <div>
                <span className="font-serif text-lg font-bold text-[#1B4332] block leading-none">
                  KHATU SHRI
                </span>
                <span className="text-[10px] text-[#78716C]">Wholesale &amp; Pure Living</span>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-[#78716C] hover:text-[#1C1917] cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Delivery Locality for Mobile */}
          <div className="py-3 border-b border-[#E8E5DF]">
            <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
              Deliver to Bhopal Hub:
            </label>
            <select
              value={selectedBhopalArea}
              onChange={(e) => setSelectedBhopalArea(e.target.value)}
              className="w-full bg-[#FAF7F2] border border-[#E8E5DF] rounded-xl p-2 text-xs text-[#1C1917] focus:outline-none"
            >
              {BHOPAL_AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Mobile Links */}
          <div className="flex-1 flex flex-col gap-2 py-4">
            <button
              onClick={() => {
                onNavigateHome();
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 text-base font-semibold text-[#1C1917] hover:text-[#1B4332] transition-colors"
            >
              Home
            </button>

            <button
              onClick={() => {
                onNavigateShop('All Products');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 text-base font-semibold text-[#1C1917] hover:text-[#1B4332] transition-colors"
            >
              All Marketplace Categories
            </button>

            {CATEGORIES.slice(1).map((c) => (
              <button
                key={c.label}
                onClick={() => {
                  onNavigateShop(c.category);
                  setMobileMenuOpen(false);
                }}
                className="text-left py-1.5 pl-3 text-sm text-[#57534E] hover:text-[#1B4332] transition-colors"
              >
                {c.label}
              </button>
            ))}

            {onOpenHamperBuilder && (
              <button
                onClick={() => {
                  onOpenHamperBuilder();
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2 text-base font-semibold text-[#B45309] flex items-center gap-2"
              >
                <Gift className="w-4 h-4 text-[#D97706]" />
                <span>Custom Sacred Gift Hampers</span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenConcierge();
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 text-base font-semibold text-[#1B4332] flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#D97706]" />
              <span>Ayurvedic AI Vaidya</span>
            </button>

            <button
              onClick={() => {
                onNavigateAbout();
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 text-base font-semibold text-[#57534E] hover:text-[#1C1917]"
            >
              About Khatu Shri Bhopal
            </button>

            <button
              onClick={() => {
                onOpenAccount();
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 text-base font-semibold text-[#57534E] hover:text-[#1C1917] flex items-center gap-2"
            >
              <Package className="w-4 h-4 text-[#78716C]" />
              <span>Track Orders &amp; Invoices</span>
            </button>
          </div>

          {/* User Sign In / Profile footer on Mobile */}
          <div className="pt-4 border-t border-[#E8E5DF]">
            <button
              onClick={() => {
                onOpenAccount();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-4 bg-[#1B4332] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              {user ? (
                <>
                  <span>Account ({user.displayName || 'Member'})</span>
                  <span className="text-xs text-[#DDA15E]">· {khatuPoints} Pts</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-[#DDA15E]" />
                  <span>Sign In / Create Account</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
