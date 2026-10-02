import React, { useState } from 'react';
import { Heart, Plus, Check, Star, TrendingUp, Zap, Truck, ShieldCheck } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  aspect?: 'portrait' | 'square';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  aspect = 'portrait',
}) => {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useAuth();
  
  const [isHovered, setIsHovered] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  const activeVariant = product.variants[selectedVariantIndex] || product.variants[0];
  const primaryImage = product.images[0];
  const secondaryImage = product.images[1] || product.images[0];
  const isWishlisted = isInWishlist(product.id);

  const currentPrice = product.price + (activeVariant.priceModifier || 0);
  const comparePrice = product.compareAtPrice || Math.round(currentPrice * 1.25);
  const discountPercent = Math.max(10, Math.round(((comparePrice - currentPrice) / comparePrice) * 100));
  const estimatedMargin = product.resellerMargin || Math.max(60, Math.round(currentPrice * 0.25));

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product, activeVariant, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <article
      onClick={() => onSelect(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col bg-white border border-[#E8E5DF] hover:border-[#1B4332] rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer"
    >
      {/* Image Container with Smooth Flip */}
      <div 
        className={`relative w-full ${
          aspect === 'portrait' ? 'aspect-4/3 sm:aspect-square' : 'aspect-square'
        } bg-[#FBF9F5] overflow-hidden`}
      >
        <img
          src={primaryImage}
          alt={product.name}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out ${
            isHovered && secondaryImage ? 'opacity-0' : 'opacity-100'
          }`}
          loading="lazy"
        />

        {secondaryImage && (
          <img
            src={secondaryImage}
            alt={`${product.name} alternate`}
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
          />
        )}

        {/* Top Badges (Amazon & Meesho style) */}
        <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1 items-start">
          <span className="bg-[#1B4332] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 fill-current text-[#DDA15E]" />
            Wholesale Direct
          </span>
          {discountPercent > 0 && (
            <span className="bg-rose-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <div className="absolute top-2.5 right-2.5 z-20">
          <button
            onClick={handleWishlist}
            className={`p-1.5 rounded-full backdrop-blur-md transition-all ${
              isWishlisted
                ? 'bg-[#D97706] text-white'
                : 'bg-white/80 text-[#78716C] hover:text-[#1B4332]'
            }`}
            title="Wishlist"
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Quick Add overlay */}
        <div className="absolute bottom-2.5 inset-x-2.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleQuickAdd}
            className={`w-full py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md ${
              justAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-[#1B4332] hover:bg-[#2D6A4F] text-white'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added to Bag</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 text-[#DDA15E]" />
                <span>Quick Add</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-[11px] text-[#78716C] mb-1 font-medium">
            <span className="truncate max-w-[150px]">{product.category}</span>
            <span className="flex items-center gap-1 text-[#B45309] font-bold">
              <Star className="w-3 h-3 fill-current" />
              {product.rating.toFixed(1)}
              <span className="text-[10px] text-[#78716C] font-normal">({product.reviewCount})</span>
            </span>
          </div>

          {/* Hindi Name / Authentic Touch */}
          {product.hindiName && (
            <span className="text-[11px] text-[#B45309] font-medium block leading-none mb-1">
              {product.hindiName}
            </span>
          )}

          {/* Title */}
          <h3 className="font-serif text-base font-bold text-[#1C1917] group-hover:text-[#1B4332] transition-colors leading-snug line-clamp-1">
            {product.name}
          </h3>

          {/* Subheading */}
          <p className="text-xs text-[#78716C] line-clamp-1 mt-1">
            {product.subheading}
          </p>

          {/* Meesho-Style Reseller Margin Pill */}
          <div className="mt-2.5 flex items-center justify-between gap-1 text-[10px] bg-[#ECFDF5] border border-emerald-200 text-emerald-800 px-2 py-1 rounded-lg font-bold">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span>Resell &amp; Earn:</span>
            </span>
            <span className="text-emerald-700 font-extrabold">+₹{estimatedMargin} profit</span>
          </div>
        </div>

        {/* Variants Selection Chips */}
        {product.variants.length > 1 && (
          <div className="flex items-center gap-1 mt-2.5" onClick={(e) => e.stopPropagation()}>
            {product.variants.map((v, idx) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariantIndex(idx)}
                className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                  selectedVariantIndex === idx
                    ? 'border-[#1B4332] bg-[#1B4332]/10 text-[#1B4332] font-bold'
                    : 'border-[#E8E5DF] text-[#78716C] hover:border-[#1B4332]'
                }`}
              >
                {v.weightOrVolume}
              </button>
            ))}
          </div>
        )}

        {/* Price & Action (Amazon & Meesho style) */}
        <div className="mt-3 pt-3 border-t border-[#E8E5DF] flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-sans text-base font-bold text-[#1C1917]">
                ₹{currentPrice}
              </span>
              <span className="text-xs text-[#78716C] line-through">
                ₹{comparePrice}
              </span>
            </div>
            <span className="text-[10px] text-[#78716C] flex items-center gap-1">
              <Truck className="w-2.5 h-2.5 text-emerald-600" /> Free Delivery · COD
            </span>
          </div>

          <button
            onClick={handleQuickAdd}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              justAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-[#1B4332] text-white hover:bg-[#2D6A4F] shadow-2xs'
            }`}
          >
            {justAdded ? '✓ Added' : 'Add'}
          </button>
        </div>
      </div>
    </article>
  );
};
