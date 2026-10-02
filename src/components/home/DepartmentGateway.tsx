import React from 'react';
import { ArrowRight, Sparkles, Shirt, Utensils, Wheat, Milk } from 'lucide-react';

interface DepartmentGatewayProps {
  onSelectCategory: (category: string) => void;
}

export const DepartmentGateway: React.FC<DepartmentGatewayProps> = ({ onSelectCategory }) => {
  const departments = [
    {
      id: 'dept-apparel',
      category: 'Apparel & Traditional Clothes',
      name: 'Clothes & Khadi Apparel',
      badge: 'Handloom Certified',
      subtitle: 'Pure Khadi Kurtas, Embroidered Shawls, Dhotis & Bamboo T-Shirts',
      imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
      icon: <Shirt className="w-4 h-4 text-[#D97706]" />,
      accentColor: 'from-amber-900/80 via-stone-900/60 to-transparent',
      itemCount: '6+ Styles',
      tagline: 'Hand-Spun in MP'
    },
    {
      id: 'dept-utilities',
      category: 'Home Utilities & Kitchenware',
      name: 'Home Utilities & Kitchenware',
      badge: 'Ayurvedic Metals',
      subtitle: 'Pure Hammered Copper Bottles, Kansa Bronze Thali Sets, Earthen Matkas & Bio-Cleaners',
      imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80',
      icon: <Utensils className="w-4 h-4 text-[#D97706]" />,
      accentColor: 'from-orange-950/80 via-stone-900/60 to-transparent',
      itemCount: '5+ Essentials',
      tagline: 'Pure Copper & Kansa'
    },
    {
      id: 'dept-necessities',
      category: 'Daily Necessities & Household Staples',
      name: 'Daily Necessities & Groceries',
      badge: '100% Unadulterated',
      subtitle: 'Unpolished Nimar Toor Dal, Sendha Salt, Chemical-Free Gur & Cold-Stone Spices',
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
      icon: <Wheat className="w-4 h-4 text-[#D97706]" />,
      accentColor: 'from-stone-950/80 via-stone-900/60 to-transparent',
      itemCount: '8+ Staples',
      tagline: 'Direct Farm Harvest'
    },
    {
      id: 'dept-dairy',
      category: 'Farm Fresh Dairy & Desi Ghee',
      name: 'Farm Fresh A2 Dairy & Ghee',
      badge: 'Cold-Chain 4°C',
      subtitle: 'A2 Gir Cow Milk, Hand-Churned Bilona Ghee, Malai Paneer & Clay-Pot Dahi',
      imageUrl: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=800&q=80',
      icon: <Milk className="w-4 h-4 text-[#D97706]" />,
      accentColor: 'from-emerald-950/80 via-stone-900/60 to-transparent',
      itemCount: '7+ Dairy Items',
      tagline: 'Morning Doorstep Slot'
    },
  ];

  return (
    <section className="py-12 bg-[#FBF9F5] border-b border-[#E8E5DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#D97706] uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Commercial Superstore Departments</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1B4332]">
              Shop By Department
            </h2>
            <p className="text-xs sm:text-sm text-[#78716C] mt-1">
              Explore traditional apparel, home utilities, daily groceries, and fresh dairy essentials.
            </p>
          </div>

          <button
            onClick={() => onSelectCategory('All Products')}
            className="text-xs font-bold text-[#1B4332] hover:text-[#2D6A4F] flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <span>View All Departments</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Multi-Category Tiles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {departments.map((dept) => (
            <div
              key={dept.id}
              onClick={() => onSelectCategory(dept.category)}
              className="group relative h-80 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-end border border-[#E8E5DF] hover:border-[#1B4332]"
            >
              {/* Background Photography */}
              <img
                src={dept.imageUrl}
                alt={dept.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                loading="lazy"
              />

              {/* Gradient Scrim for Legibility */}
              <div className={`absolute inset-0 bg-gradient-to-t ${dept.accentColor}`} />

              {/* Top Department Badge */}
              <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
                <span className="inline-flex items-center gap-1.5 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20 uppercase tracking-wider">
                  {dept.icon}
                  <span>{dept.badge}</span>
                </span>
                <span className="text-[10px] font-medium text-white/90 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded">
                  {dept.tagline}
                </span>
              </div>

              {/* Content Panel at Bottom */}
              <div className="relative z-10 p-5 text-white space-y-1.5">
                <span className="text-[10px] font-bold text-[#FDE68A] uppercase tracking-wider block">
                  {dept.itemCount}
                </span>

                <h3 className="font-serif text-lg font-bold leading-snug group-hover:text-[#FDE68A] transition-colors">
                  {dept.name}
                </h3>

                <p className="text-[11px] text-white/80 line-clamp-2 leading-relaxed">
                  {dept.subtitle}
                </p>

                <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-[#FDE68A] group-hover:translate-x-1 transition-transform">
                  <span>Explore Collection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
