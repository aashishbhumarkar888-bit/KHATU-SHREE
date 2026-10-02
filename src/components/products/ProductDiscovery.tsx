import React, { useState, useMemo } from 'react';
import { ArrowUpDown, Grid3X3, LayoutGrid, CheckCircle2, MapPin } from 'lucide-react';
import { Product } from '../../types';
import { CATEGORIES } from '../../data/products';
import { ProductCard } from './ProductCard';
import { useCursor } from '../../context/CursorContext';
import { useCart } from '../../context/CartContext';

interface ProductDiscoveryProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export const ProductDiscovery: React.FC<ProductDiscoveryProps> = ({
  products,
  onSelectProduct,
  selectedCategory = 'All Products',
  onSelectCategory,
}) => {
  const { setCursor, resetCursor } = useCursor();
  const { selectedBhopalArea } = useCart();
  const [internalCategory, setInternalCategory] = useState(selectedCategory);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'large'>('grid');

  const activeCategory = onSelectCategory ? selectedCategory : internalCategory;

  const handleCategoryChange = (cat: string) => {
    if (onSelectCategory) {
      onSelectCategory(cat);
    } else {
      setInternalCategory(cat);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Apparel & Traditional Clothes': return '👕';
      case 'Home Utilities & Kitchenware': return '🏺';
      case 'Daily Necessities & Household Staples': return '🌾';
      case 'Farm Fresh Dairy & Desi Ghee': return '🥛';
      case 'MP Grains & Organic Staples': return '🌾';
      case 'Cold-Pressed Kachi Ghani Oils': return '🌻';
      case 'Spiritual & Pure Puja Samagri': return '🪔';
      case 'Raw Honey, Dry Fruits & Superfoods': return '🍯';
      case 'Bhopal Artisanal Sweets & Mawa': return '🍬';
      default: return '🛍️';
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filter by category
    if (activeCategory !== 'All Products') {
      result = result.filter((p) => p.category === activeCategory);
    }

    // Sort
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else {
      // Balanced cross-category priority on "All Products" to ensure diverse mix of clothes, utilities, staples, and dairy
      if (activeCategory === 'All Products') {
        const priorityIds = [
          'prod-khadi-cotton-kurta',      // Apparel
          'prod-copper-water-bottle',     // Home Utilities
          'prod-a2-bilona-ghee',          // Dairy
          'prod-nimar-toor-dal',          // Daily Staples
          'prod-kansa-bronze-thali',      // Home Utilities
          'prod-khatu-zari-shawl',        // Apparel
          'prod-bioenzyme-surface-cleaner', // Home Utilities
          'prod-sendha-namak',            // Daily Staples
          'prod-fresh-gir-milk',          // Dairy
          'prod-organic-bamboo-tshirt',   // Apparel
          'prod-clay-water-matka',        // Home Utilities
          'prod-desi-gur-jaggery',        // Daily Staples
          'prod-temple-kasavu-dhoti',     // Apparel
          'prod-coir-eco-scrubbers',      // Home Utilities
          'prod-fresh-malai-paneer',      // Dairy
          'prod-pantry-spices-box',       // Daily Staples
        ];

        result.sort((a, b) => {
          const indexA = priorityIds.indexOf(a.id);
          const indexB = priorityIds.indexOf(b.id);
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0);
        });
      } else {
        result.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0));
      }
    }

    return result;
  }, [products, activeCategory, sortBy]);

  return (
    <section id="collection-discovery" className="py-16 max-w-7xl mx-auto px-4 sm:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[#E8E5DF] gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#1B4332] uppercase tracking-wider mb-1.5">
            <span>Bhopal &amp; Pan-India Dropship Hub</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#D97706]">Area: {selectedBhopalArea.split('(')[0]}</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#1B4332] font-bold">
            Khatu Shri Dropship &amp; Wholesale Marketplace
          </h2>
          <p className="text-sm text-[#78716C] mt-1">
            Factory-direct pricing, sarees &amp; apparel, farm-fresh A2 dairy, organic staples, and handcrafted copperware. Resell with 30-50% profit margins!
          </p>
        </div>

        {/* Sort and View */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-[#E8E5DF] px-3 py-1.5 rounded-lg text-xs shadow-2xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#78716C]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-[#1C1917] font-medium focus:outline-none cursor-pointer"
            >
              <option value="featured">Bestsellers First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          <div className="hidden sm:flex items-center border border-[#E8E5DF] bg-white rounded-lg p-0.5 shadow-2xs">
            <button
              onClick={() => setLayoutMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                layoutMode === 'grid' ? 'bg-[#1B4332] text-white' : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
              title="Compact Grid"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayoutMode('large')}
              className={`p-1.5 rounded transition-colors ${
                layoutMode === 'large' ? 'bg-[#1B4332] text-white' : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
              title="Large Cards"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-5 border-b border-[#E8E5DF]/70 mb-8">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-2 text-xs font-semibold rounded-full transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#1B4332] text-white shadow-xs'
                  : 'bg-white text-[#78716C] hover:text-[#1C1917] hover:bg-[#F3EFE6] border border-[#E8E5DF]'
              }`}
            >
              <span>{getCategoryIcon(cat)}</span>
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* Products Grid */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="py-20 text-center border border-[#E8E5DF] bg-white rounded-xl">
          <p className="font-serif text-2xl text-[#1B4332] font-bold mb-1">No products found</p>
          <p className="text-sm text-[#78716C] mb-4">Please reset filters to browse our complete collection.</p>
          <button
            onClick={() => handleCategoryChange('All Products')}
            className="px-5 py-2.5 bg-[#1B4332] text-white rounded-lg text-xs font-semibold"
          >
            Show All Products
          </button>
        </div>
      ) : (
        <div
          className={`grid gap-6 ${
            layoutMode === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {filteredAndSortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      )}
    </section>
  );
};
