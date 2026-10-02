import React, { useRef, useState, useEffect } from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Truck, 
  Award, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Shirt, 
  Utensils, 
  Wheat, 
  Milk 
} from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { PRODUCTS } from '../../data/products';

interface HeroExperienceProps {
  heroProduct?: Product;
  onSelectProduct: (product: Product) => void;
  onExploreCollection: (category?: string) => void;
  onOpenConcierge: () => void;
}

export const HeroExperience: React.FC<HeroExperienceProps> = ({
  onSelectProduct,
  onExploreCollection,
}) => {
  const { addItem, selectedBhopalArea } = useCart();
  const heroRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [activeAngleIndex, setActiveAngleIndex] = useState(0);

  // Find department spotlight products from catalog
  const apparelProduct = PRODUCTS.find((p) => p.id === 'prod-khadi-cotton-kurta') || PRODUCTS[0];
  const utilityProduct = PRODUCTS.find((p) => p.id === 'prod-copper-water-bottle') || PRODUCTS[1];
  const necessityProduct = PRODUCTS.find((p) => p.id === 'prod-nimar-toor-dal') || PRODUCTS[2];
  const dairyProduct = PRODUCTS.find((p) => p.id === 'prod-a2-bilona-ghee') || PRODUCTS[3];

  type DeptKey = 'apparel' | 'utilities' | 'necessities' | 'dairy';
  const [selectedDept, setSelectedDept] = useState<DeptKey>('apparel');

  const departments: Record<DeptKey, {
    key: DeptKey;
    label: string;
    icon: React.ReactNode;
    category: string;
    badge: string;
    headlinePrefix: string;
    headlineHighlight: string;
    subheading: string;
    product: Product;
    ctaText: string;
    originTag: string;
    deliveryTag: string;
  }> = {
    apparel: {
      key: 'apparel',
      label: 'Clothes & Khadi',
      icon: <Shirt className="w-3.5 h-3.5" />,
      category: 'Apparel & Traditional Clothes',
      badge: 'MP Handloom Weavers Guild · 100% Pure Khadi Cotton',
      headlinePrefix: 'Handloom Khadi Apparel &',
      headlineHighlight: 'Sacred Traditional Attire',
      subheading: 'Woven on indigenous pit looms in Madhya Pradesh. 100% breathable organic cotton kurtas, temple dhotis, bamboo t-shirts, and consecrated zari shawls with handcrafted Sheesham buttons.',
      product: apparelProduct,
      ctaText: 'Order Khadi Kurta Set',
      originTag: 'Khadi Gramodyog MP',
      deliveryTag: 'Bhopal Express Same-Day Delivery'
    },
    utilities: {
      key: 'utilities',
      label: 'Home Utilities',
      icon: <Utensils className="w-3.5 h-3.5" />,
      category: 'Home Utilities & Kitchenware',
      badge: 'Certified 99.4% Pure Copper & 78:22 Kansa Bell Metal',
      headlinePrefix: 'Pure Hammered Copper &',
      headlineHighlight: 'Kansa Bronze Home Utilities',
      subheading: 'Ancient Ayurvedic kitchenware and natural living utilities. Jointless single-sheet copper water bottles, heavy cast bronze thalis that balance Pitta, terracotta water matkas, and bio-enzyme cleaners.',
      product: utilityProduct,
      ctaText: 'Shop Copper Bottle',
      originTag: 'Traditional Coppersmiths Hub',
      deliveryTag: 'Bhopal Special Padded Delivery'
    },
    necessities: {
      key: 'necessities',
      label: 'Daily Necessities',
      icon: <Wheat className="w-3.5 h-3.5" />,
      category: 'Daily Necessities & Household Staples',
      badge: '100% Unpolished · Zero Chemical Polish · Lab Tested',
      headlinePrefix: 'Unpolished Daily Staples &',
      headlineHighlight: 'Essential Kitchen Groceries',
      subheading: 'Direct from Nimar and Sehore organic farms: unpolished high-protein toor dal, 84-mineral pink Himalayan rock salt, wood-boiled chemical-free gur, and stone-ground pantry spices.',
      product: necessityProduct,
      ctaText: 'Order Organic Toor Dal',
      originTag: 'Nimar Valley Farm Producer Co.',
      deliveryTag: 'Morning 6:00 – 8:30 AM Slot'
    },
    dairy: {
      key: 'dairy',
      label: 'Fresh Dairy & Ghee',
      icon: <Milk className="w-3.5 h-3.5" />,
      category: 'Farm Fresh Dairy & Desi Ghee',
      badge: 'Cold-Chain 4°C · Bilona Churned from Gir Cow Curd',
      headlinePrefix: 'Pure A2 Gir Cow Milk &',
      headlineHighlight: 'Vedic Bilona Desi Ghee',
      subheading: 'Native grass-fed Gir Gaushala in Sehore. Churned from cultured whole curd in wooden bilonas. Chilled to 4°C in glass bottles and delivered to Bhopal doorsteps every morning.',
      product: dairyProduct,
      ctaText: 'Order Vedic Bilona Ghee',
      originTag: 'Sehore Native Gir Gaushala',
      deliveryTag: 'Morning Doorstep Chilled Slot'
    }
  };

  const currentDept = departments[selectedDept];
  const activeProduct = currentDept.product;

  useEffect(() => {
    setActiveAngleIndex(0);
  }, [selectedDept]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setTilt({ x: x * 10, y: -y * 10 });
    };

    const element = heroRef.current;
    if (element) {
      element.addEventListener('mousemove', handleMouseMove);
    }
    return () => {
      if (element) {
        element.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative pt-32 sm:pt-36 pb-16 overflow-hidden bg-gradient-to-b from-[#F3EFE6] via-[#FBF9F5] to-[#FBF9F5] border-b border-[#E8E5DF]"
    >
      {/* Background Subtle Organic Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#1B4332_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full relative z-10">
        
        {/* ========================================================================= */}
        {/* TOP DEPARTMENT SELECTOR TABS (Instant Category Switcher)                   */}
        {/* ========================================================================= */}
        <div className="mb-8">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
            <span className="text-[10px] uppercase font-bold text-[#78716C] tracking-wider shrink-0 mr-1 hidden sm:inline">
              Departments:
            </span>
            {(['apparel', 'utilities', 'necessities', 'dairy'] as DeptKey[]).map((key) => {
              const dept = departments[key];
              const isActive = selectedDept === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDept(key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shadow-2xs ${
                    isActive
                      ? 'bg-[#1B4332] text-white shadow-xs'
                      : 'bg-white border border-[#E8E5DF] text-[#78716C] hover:text-[#1B4332] hover:bg-[#F3EFE6]'
                  }`}
                >
                  {dept.icon}
                  <span>{dept.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Story & Positioning */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            
            {/* Trust Kicker with Zero-Pill Discipline */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#78716C] mb-4 font-medium">
              <span className="text-[#1B4332] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1B4332]" />
                {currentDept.badge}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-[#B45309] font-semibold">Delivering in {selectedBhopalArea.split('(')[0]}</span>
            </div>

            {/* Dynamic Headline */}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1B4332] leading-[1.15] mb-5">
              {currentDept.headlinePrefix} <br />
              <span className="text-[#D97706] italic font-normal">{currentDept.headlineHighlight}</span>
            </h1>

            {/* Subheading */}
            <p className="text-sm sm:text-base text-[#57534E] leading-relaxed max-w-xl mb-8">
              {currentDept.subheading}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 mb-10">
              <button
                onClick={() => onSelectProduct(activeProduct)}
                className="group px-6 py-3.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-medium text-xs uppercase tracking-wider transition-all flex items-center gap-3 rounded-lg shadow-md cursor-pointer"
              >
                <span>{currentDept.ctaText} (₹{activeProduct.price})</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => onExploreCollection(currentDept.category)}
                className="px-5 py-3.5 border border-[#1B4332] text-[#1B4332] text-xs font-semibold uppercase tracking-wider hover:bg-[#1B4332]/5 rounded-lg transition-all cursor-pointer"
              >
                Explore {currentDept.label}
              </button>
            </div>

            {/* Bhopal Delivery Badges & Guarantees */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#E8E5DF] max-w-lg">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                <div>
                  <span className="block font-bold text-xs text-[#1C1917]">Fast Dispatch</span>
                  <span className="text-[11px] text-[#78716C]">{currentDept.deliveryTag}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#1B4332] shrink-0 mt-0.5" />
                <div>
                  <span className="block font-bold text-xs text-[#1C1917]">100% Authentic</span>
                  <span className="text-[11px] text-[#78716C]">Zero Synthetic Fake Goods</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                <div>
                  <span className="block font-bold text-xs text-[#1C1917]">Bhopal Express</span>
                  <span className="text-[11px] text-[#78716C]">Local Delivery Fleet</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Protagonist Card */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            
            <div
              onClick={() => onSelectProduct(activeProduct)}
              style={{
                transform: `perspective(1000px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
                transition: 'transform 0.15s ease-out',
              }}
              className="relative w-full max-w-md bg-white border border-[#E8E5DF] rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all cursor-pointer group"
            >
              {/* Top Origin Tag */}
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="bg-[#FFFBEB] text-[#B45309] font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide border border-[#FDE68A]">
                  ★ Featured Department Spotlight
                </span>
                <span className="text-[#78716C] font-sans text-xs truncate max-w-[160px]">
                  {currentDept.originTag}
                </span>
              </div>

              {/* Main Image */}
              <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-[#FBF9F5] mb-4">
                <img
                  src={activeProduct.images[activeAngleIndex] || activeProduct.images[0]}
                  alt={activeProduct.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Angle Thumbnails */}
                {activeProduct.images.length > 1 && (
                  <div 
                    className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {activeProduct.images.slice(0, 3).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveAngleIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          activeAngleIndex === idx ? 'bg-[#D97706] scale-125' : 'bg-white/60 hover:bg-white'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Title & Price */}
              <div className="space-y-1">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1B4332] group-hover:text-[#2D6A4F] transition-colors leading-snug line-clamp-1">
                  {activeProduct.name}
                </h3>
                <p className="text-xs text-[#78716C] line-clamp-1">
                  {activeProduct.subheading}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E8E5DF] flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-sans text-xl font-bold text-[#1C1917]">
                      ₹{activeProduct.price}
                    </span>
                    {activeProduct.compareAtPrice && (
                      <span className="text-xs text-[#78716C] line-through">
                        ₹{activeProduct.compareAtPrice}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#1B4332] font-semibold block">
                    {activeProduct.variants[0]?.weightOrVolume || activeProduct.netWeight} · MRP incl. of all taxes
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addItem(activeProduct, activeProduct.variants[0], 1);
                  }}
                  className="px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Add to Cart
                </button>
              </div>

            </div>

            <p className="mt-3 text-xs text-[#78716C] flex items-center gap-1.5">
              <span>Same-Day & Express Dispatch across Bhopal</span>
            </p>

          </div>

        </div>
      </div>
    </section>
  );
};
