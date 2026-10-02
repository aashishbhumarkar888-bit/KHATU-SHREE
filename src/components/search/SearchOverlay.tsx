import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import { useCursor } from '../../context/CursorContext';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { setCursor, resetCursor } = useCursor();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredProducts = query.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          (p.hindiName && p.hindiName.includes(query)) ||
          p.category.toLowerCase().includes(query.toLowerCase()) ||
          p.subheading.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const suggestedSearches = [
    'A2 Bilona Ghee',
    'Khadi Cotton Kurta',
    'Copper Water Bottle',
    'Nimar Toor Dal',
    'Kansa Bronze Thali',
    'Bio-Enzyme Floor Cleaner',
    'Terracotta Clay Matka',
    'Pink Himalayan Salt',
    'Gir Cow Milk',
    'Khatu Zari Shawl',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-md flex flex-col p-4 sm:p-10">
      <div className="max-w-3xl mx-auto w-full bg-white rounded-2xl shadow-2xl p-6 border border-[#E8E5DF]">
        
        {/* Search Input Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E5DF]">
          <div className="flex items-center gap-3 flex-1">
            <Search className="w-5 h-5 text-[#1B4332] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search ghee, khadi kurta, copper bottle, toor dal, kansa thali, cleaners..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent font-serif text-lg sm:text-2xl text-[#1C1917] placeholder:text-[#78716C]/60 focus:outline-none"
            />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#78716C] hover:text-[#1C1917] rounded-md cursor-pointer ml-3"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suggestion Chips */}
        {!query.trim() && (
          <div className="pt-6">
            <span className="text-xs font-bold text-[#78716C] uppercase tracking-wider block mb-3">
              Popular Daily Essentials in Bhopal
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestedSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-3 py-1.5 bg-[#FBF9F5] hover:bg-[#1B4332] hover:text-white border border-[#E8E5DF] text-xs font-medium text-[#1C1917] rounded-full transition-colors cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>

            {/* Quick Preview Products */}
            <div className="mt-8 pt-6 border-t border-[#E8E5DF]">
              <span className="text-xs font-bold text-[#78716C] uppercase tracking-wider block mb-4">
                Bestsellers
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {products.slice(0, 3).map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      onSelectProduct(prod);
                      onClose();
                    }}
                    className="p-2.5 bg-[#FBF9F5] border border-[#E8E5DF] rounded-xl flex items-center gap-3 cursor-pointer hover:border-[#1B4332] transition-colors"
                  >
                    <img src={prod.images[0]} alt={prod.name} className="w-12 h-14 object-cover rounded-md" />
                    <div>
                      <p className="text-xs font-bold text-[#1C1917] line-clamp-1">{prod.name}</p>
                      <p className="text-xs font-semibold text-[#D97706]">₹{prod.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {query.trim() && (
          <div className="pt-6">
            <div className="text-xs text-[#78716C] mb-4">
              Found {filteredProducts.length} items for "{query}"
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-[#78716C]">
                <p className="font-serif text-lg text-[#1B4332] font-bold">No products found</p>
                <p className="text-xs mt-1">Try searching for ghee, milk, paneer, aata, or honey.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProduct(p);
                      onClose();
                    }}
                    className="p-3 bg-[#FBF9F5] border border-[#E8E5DF] hover:border-[#1B4332] rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]} alt={p.name} className="w-14 h-16 object-cover rounded-lg" />
                      <div>
                        <span className="text-[10px] text-[#D97706] font-bold uppercase tracking-wide block">
                          {p.category}
                        </span>
                        <h4 className="font-serif text-sm font-bold text-[#1C1917] leading-tight">
                          {p.name}
                        </h4>
                        <p className="text-xs text-[#78716C] line-clamp-1">{p.subheading}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-sans text-sm font-bold text-[#1C1917]">
                        ₹{p.price}
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#1B4332]" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
