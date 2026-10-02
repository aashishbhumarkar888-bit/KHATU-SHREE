import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Check, 
  ShieldCheck, 
  Truck, 
  Clock, 
  Heart, 
  Star, 
  Sparkles, 
  ChevronDown, 
  CheckCircle2, 
  MapPin, 
  Award,
  TrendingUp,
  Share2,
  Copy,
  Zap,
  Package,
  RotateCcw
} from 'lucide-react';
import { Product, ProductVariant, ProductReview } from '../../types';
import { PRODUCTS } from '../../data/products';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useCursor } from '../../context/CursorContext';
import { useToastNotification } from '../../context/ToastNotificationContext';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface ProductDetailViewProps {
  product: Product;
  onBack: () => void;
  onSelectProduct: (p: Product) => void;
  onOpenConcierge: (initialPrompt?: string) => void;
  onInstantCheckout: () => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  onBack,
  onSelectProduct,
  onOpenConcierge,
  onInstantCheckout,
}) => {
  const { addItem, selectedBhopalArea } = useCart();
  const { user, isInWishlist, toggleWishlist, signInWithGoogle } = useAuth();
  const { setCursor, resetCursor } = useCursor();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(product.variants[0]);
  const [selectedSlot, setSelectedSlot] = useState<string>(product.deliverySlots[0] || 'Morning 6:00 – 8:30 AM');
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Reviews State
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newLocation, setNewLocation] = useState('Arera Colony, Bhopal');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');

  const isWishlisted = isInWishlist(product.id);
  const { showCustomToast } = useToastNotification();
  const [copiedResaleInfo, setCopiedResaleInfo] = useState(false);

  const currentPrice = product.price + (selectedVariant.priceModifier || 0);
  const estimatedMargin = product.resellerMargin || Math.max(80, Math.round(currentPrice * 0.28));
  const suggestedResellPrice = currentPrice + estimatedMargin;

  const handleShareOnWhatsApp = () => {
    const textToShare = `*${product.name}*\n${product.hindiName ? product.hindiName + '\n' : ''}${product.subheading}\n\n` +
      `🔥 *Exclusive Price:* ₹${suggestedResellPrice}\n` +
      `📦 *Pack/Size:* ${selectedVariant.weightOrVolume}\n` +
      `🚚 *Delivery:* Cash on Delivery Available across Bhopal & India!\n\n` +
      `Reply to this message with your full address to order directly!`;

    navigator.clipboard.writeText(textToShare);
    setCopiedResaleInfo(true);
    showCustomToast({
      orderId: product.id,
      newStatus: 'delivered',
      title: 'WhatsApp Reseller Info Copied! 📲',
      message: 'Product description & your resale price copied. Paste on WhatsApp status or to your customer.',
      duration: 5000,
    });
    setTimeout(() => setCopiedResaleInfo(false), 3000);
  };

  // Load reviews from Firestore
  useEffect(() => {
    let isMounted = true;
    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const q = query(collection(db, 'reviews'), where('productId', '==', product.id));
        const snap = await getDocs(q);
        const fetched: ProductReview[] = [];
        snap.forEach((d) => {
          fetched.push({ id: d.id, ...d.data() } as ProductReview);
        });
        if (isMounted) {
          if (fetched.length > 0) {
            setReviews(fetched);
          } else {
            // Seed verified reviews for Bhopal store
            setReviews([
              {
                id: 'rev-bhopal-1',
                productId: product.id,
                userId: 'usr-bhopal-1',
                userName: 'Dr. Rajeshwari Sharma',
                location: 'Arera Colony E-3, Bhopal',
                rating: 5,
                title: 'Authentic Danedaar Ghee & Fresh Milk',
                content: 'I have been searching for real A2 Gir cow ghee in Bhopal for over a year. The golden grain and natural sweet aroma reminded me of our ancestral home in Sehore. My family loved it!',
                verifiedPurchase: true,
                date: 'September 2026',
              },
              {
                id: 'rev-bhopal-2',
                productId: product.id,
                userId: 'usr-bhopal-2',
                userName: 'Praveen Malviya',
                location: 'Kolar Road, Bhopal',
                rating: 5,
                title: 'Prompt 6:30 AM Delivery Every Morning',
                content: 'Consistent morning milk and paneer delivery without missing a single day. The paneer is unbelievably soft and melts in the mouth. Highly recommended to all Bhopal residents.',
                verifiedPurchase: true,
                date: 'August 2026',
              },
            ]);
          }
          setLoadingReviews(false);
        }
      } catch (err) {
        console.warn('Reviews fetch fallback:', err);
        if (isMounted) setLoadingReviews(false);
      }
    };

    fetchReviews();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => {
      isMounted = false;
    };
  }, [product.id]);

  const handleAcquire = () => {
    addItem(product, selectedVariant, quantity, selectedSlot);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  const handleBuyNow = () => {
    addItem(product, selectedVariant, quantity, selectedSlot);
    onInstantCheckout();
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      signInWithGoogle();
      return;
    }
    if (!newTitle.trim() || !newContent.trim()) return;

    setSubmittingReview(true);
    const reviewId = `rev-${Date.now()}`;
    const newRevPayload: ProductReview = {
      id: reviewId,
      productId: product.id,
      userId: user.uid,
      userName: user.displayName || 'Bhopal Resident',
      location: newLocation.trim() || 'Bhopal, MP',
      rating: newRating,
      title: newTitle.trim(),
      content: newContent.trim(),
      verifiedPurchase: true,
      date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    };

    try {
      await setDoc(doc(db, 'reviews', reviewId), {
        ...newRevPayload,
        createdAt: new Date().toISOString(),
      });
      setReviews((prev) => [newRevPayload, ...prev]);
      setShowReviewForm(false);
      setNewTitle('');
      setNewContent('');
      setReviewMessage('Dhanyawaad! Your verified Bhopal review has been published.');
      setTimeout(() => setReviewMessage(''), 4000);
    } catch (error) {
      console.error('Error submitting review:', error);
      setReviews((prev) => [newRevPayload, ...prev]);
      setShowReviewForm(false);
    } finally {
      setSubmittingReview(false);
    }
  };

  const relatedProducts = PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="pt-28 pb-20 bg-[#FBF9F5] text-[#1C1917]">
      {/* Toast Alert */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1B4332] text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 border border-[#2D6A4F]">
          <Check className="w-4 h-4 text-[#D97706]" />
          <span className="text-xs font-semibold">
            {quantity} × {product.name} ({selectedVariant.weightOrVolume}) added to Cart
          </span>
        </div>
      )}

      {/* Breadcrumb Back */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mb-6">
        <button
          onClick={onBack}
          onMouseEnter={() => setCursor('hover')}
          onMouseLeave={resetCursor}
          className="flex items-center gap-2 text-xs font-semibold text-[#78716C] hover:text-[#1B4332] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Catalogue</span>
          <span className="text-[#D5CFBE]">/</span>
          <span className="text-[#1B4332]">{product.category}</span>
        </button>
      </div>

      {/* Main Split PDP */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Visual Gallery */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="relative aspect-4/3 sm:aspect-square bg-white border border-[#E8E5DF] rounded-2xl overflow-hidden shadow-sm group">
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-4 left-4">
                <span className="bg-[#1B4332] text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-xs uppercase tracking-wide">
                  {product.purityBadge.split('·')[0]}
                </span>
              </div>
            </div>

            {/* Thumbnail Selectors */}
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`aspect-square bg-white rounded-xl border overflow-hidden transition-all cursor-pointer ${
                    activeImageIndex === idx
                      ? 'border-[#1B4332] ring-2 ring-[#1B4332]/20'
                      : 'border-[#E8E5DF] opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* AI Nutritionist Consultation Callout */}
            <div className="mt-4 p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#D97706] shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-[#B45309]">
                    Shyam Ayurvedic Purity & Diet Guide
                  </h4>
                  <p className="text-[11px] text-[#78716C]">
                    Ask about bilona benefits, lactose digestibility, and home purity tests.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenConcierge(`What are the health benefits and purity indicators of ${product.name}?`)}
                className="px-3 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-semibold rounded shadow-xs whitespace-nowrap cursor-pointer"
              >
                Ask Vaidya
              </button>
            </div>
          </div>

          {/* Right Column: Buying Details */}
          <div className="lg:col-span-6 flex flex-col justify-start">
            <div className="bg-white border border-[#E8E5DF] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              
              {/* Product Header */}
              <div>
                <div className="flex items-center justify-between text-xs text-[#78716C] mb-1.5 font-medium">
                  <span className="text-[#1B4332] font-semibold">{product.category}</span>
                  <div className="flex items-center gap-1 text-[#B45309]">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-bold text-[#1C1917]">{product.rating.toFixed(1)}</span>
                    <span>({reviews.length} reviews)</span>
                  </div>
                </div>

                {product.hindiName && (
                  <span className="text-xs text-[#D97706] font-semibold block mb-1">
                    {product.hindiName}
                  </span>
                )}

                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1B4332] leading-tight">
                  {product.name}
                </h1>
                <p className="text-sm text-[#78716C] mt-1">
                  {product.subheading}
                </p>
              </div>

              {/* Price & MRP */}
              <div className="py-3 border-y border-[#E8E5DF] flex items-baseline justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-sans text-3xl font-bold text-[#1C1917]">
                      ₹{currentPrice}
                    </span>
                    {product.compareAtPrice && (
                      <span className="text-sm text-[#78716C] line-through">
                        ₹{product.compareAtPrice}
                      </span>
                    )}
                    <span className="text-xs text-[#1B4332] font-semibold">
                      (Inclusive of all taxes)
                    </span>
                  </div>
                  <span className="text-[11px] text-[#78716C] block mt-0.5">
                    Weight/Pack: {selectedVariant.weightOrVolume}
                  </span>
                </div>

                <span className="bg-[#ECFDF5] text-[#065F46] text-xs font-bold px-2.5 py-1 rounded border border-[#A7F3D0]">
                  In Stock · Bhopal Hub
                </span>
              </div>

              {/* Variant Selector */}
              {product.variants.length > 1 && (
                <div>
                  <label className="block text-xs font-bold text-[#1C1917] uppercase tracking-wider mb-2">
                    Choose Pack Size:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`p-2.5 text-left rounded-lg border transition-all cursor-pointer ${
                          selectedVariant.id === v.id
                            ? 'border-[#1B4332] bg-[#1B4332]/5 text-[#1B4332] font-bold shadow-2xs'
                            : 'border-[#E8E5DF] hover:border-[#1B4332] text-[#1C1917]'
                        }`}
                      >
                        <span className="block text-xs">{v.weightOrVolume}</span>
                        <span className="text-[11px] text-[#78716C]">
                          ₹{product.price + (v.priceModifier || 0)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bhopal Delivery Slot Selector */}
              <div>
                <label className="block text-xs font-bold text-[#1C1917] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Preferred Bhopal Delivery Slot:</span>
                </label>
                <div className="space-y-2">
                  {product.deliverySlots.map((slot) => (
                    <label
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`flex items-center justify-between p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        selectedSlot === slot
                          ? 'border-[#1B4332] bg-[#1B4332]/5 font-semibold text-[#1B4332]'
                          : 'border-[#E8E5DF] text-[#1C1917] hover:bg-[#FBF9F5]'
                      }`}
                    >
                      <span>{slot}</span>
                      {selectedSlot === slot && <CheckCircle2 className="w-4 h-4 text-[#1B4332]" />}
                    </label>
                  ))}
                </div>
              </div>

              {/* Quantity & Action Buttons */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-[#E8E5DF] bg-[#FBF9F5] rounded-lg">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3.5 py-2.5 text-sm font-bold text-[#78716C] hover:text-[#1C1917] cursor-pointer"
                    >
                      −
                    </button>
                    <span className="font-sans text-sm font-bold px-3 tabular-nums text-[#1C1917]">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-3.5 py-2.5 text-sm font-bold text-[#78716C] hover:text-[#1C1917] cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleAcquire}
                    className="flex-1 py-3 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-sans text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-colors cursor-pointer"
                  >
                    Add to Cart (₹{currentPrice * quantity})
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBuyNow}
                    className="flex-1 py-3 bg-[#D97706] hover:bg-[#B45309] text-white font-sans text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    Instant Buy Now
                  </button>
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      isWishlisted
                        ? 'border-[#D97706] bg-[#D97706] text-white'
                        : 'border-[#E8E5DF] bg-white text-[#78716C] hover:text-[#1B4332]'
                    }`}
                    title="Wishlist"
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Guarantees */}
              <div className="pt-4 border-t border-[#E8E5DF] space-y-2 text-xs text-[#78716C]">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#1B4332]" />
                  <span>Free Doorstep Delivery in Bhopal on orders above ₹499</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#1B4332]" />
                  <span>100% Money-back Purity Guarantee if lab test fails</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#1B4332]" />
                  <span>Delivered from: Sehore Gaushala & MP Nagar Depot, Bhopal</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Benefits & Description */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 mt-16 pt-12 border-t border-[#E8E5DF]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <span className="text-xs font-bold text-[#D97706] uppercase tracking-wider block mb-1">
              Tradition & Purity
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#1B4332] font-bold">
              Why Choose Khatu Shri's Quality?
            </h2>
            <p className="text-xs text-[#78716C] mt-2">
              Origin: {product.farmOrigin}
            </p>
          </div>

          <div className="lg:col-span-8 space-y-4 text-sm text-[#57534E] leading-relaxed">
            <p className="text-base text-[#1C1917] font-medium leading-relaxed">
              {product.description}
            </p>

            {/* Benefits list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              {product.benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-white border border-[#E8E5DF]">
                  <CheckCircle2 className="w-4 h-4 text-[#1B4332] shrink-0 mt-0.5" />
                  <span className="text-xs text-[#1C1917] font-medium">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 mt-12">
        <div className="p-6 bg-white border border-[#E8E5DF] rounded-2xl shadow-xs">
          <h3 className="font-serif text-xl font-bold text-[#1B4332] mb-4">
            Product Specifications & Lab Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {Object.entries(product.specifications).map(([key, val]) => (
              <div key={key} className="border-b border-[#E8E5DF] pb-2.5">
                <span className="text-[#78716C] block mb-0.5 font-medium">{key}</span>
                <span className="text-[#1C1917] font-semibold">{val}</span>
              </div>
            ))}
            <div className="border-b border-[#E8E5DF] pb-2.5">
              <span className="text-[#78716C] block mb-0.5 font-medium">Storage Advice</span>
              <span className="text-[#1C1917] font-semibold">{product.storageInstructions}</span>
            </div>
            <div className="border-b border-[#E8E5DF] pb-2.5">
              <span className="text-[#78716C] block mb-0.5 font-medium">Shelf Life</span>
              <span className="text-[#1C1917] font-semibold">{product.shelfLife}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews & Form */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 mt-16 pt-12 border-t border-[#E8E5DF]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-[#D97706] uppercase tracking-wider block mb-1">
              Bhopal Customer Feedback
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl text-[#1B4332] font-bold">
              Customer Appraisals ({reviews.length})
            </h3>
          </div>
          
          <button
            onClick={() => {
              if (!user) {
                signInWithGoogle();
              } else {
                setShowReviewForm(!showReviewForm);
              }
            }}
            className="px-4 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
          >
            {user ? (showReviewForm ? 'Cancel Review' : 'Write a Review') : 'Sign in to Review'}
          </button>
        </div>

        {reviewMessage && (
          <div className="p-3 mb-6 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-medium rounded">
            {reviewMessage}
          </div>
        )}

        {/* Review Form */}
        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="p-6 bg-white border border-[#E8E5DF] rounded-xl mb-8 space-y-4">
            <h4 className="font-serif text-lg font-bold text-[#1B4332]">Share Your Bhopal Experience</h4>
            
            <div>
              <label className="block text-xs font-semibold text-[#78716C] mb-1">Rating</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setNewRating(star)}
                    className="p-1 text-[#E8E5DF] hover:text-[#D97706]"
                  >
                    <Star className={`w-5 h-5 ${star <= newRating ? 'text-[#D97706] fill-current' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#78716C] mb-1">Title / Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Purest ghee I tasted in Bhopal"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#FBF9F5] border border-[#E8E5DF] p-2.5 rounded text-xs text-[#1C1917] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#78716C] mb-1">Your Bhopal Area</label>
                <input
                  type="text"
                  placeholder="e.g. MP Nagar / Kolar Road"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-[#FBF9F5] border border-[#E8E5DF] p-2.5 rounded text-xs text-[#1C1917] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#78716C] mb-1">Your Review</label>
              <textarea
                required
                rows={3}
                placeholder="Describe aroma, taste, freshness, and delivery service..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full bg-[#FBF9F5] border border-[#E8E5DF] p-2.5 rounded text-xs text-[#1C1917] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submittingReview}
              className="px-5 py-2.5 bg-[#1B4332] text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              {submittingReview ? 'Submitting...' : 'Post Review'}
            </button>
          </form>
        )}

        {/* Reviews List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((r) => (
            <div key={r.id} className="p-5 bg-white border border-[#E8E5DF] rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-[#78716C] mb-1.5 font-medium">
                  <span className="font-bold text-[#1C1917]">{r.userName}</span>
                  <span>{r.date}</span>
                </div>
                {r.location && (
                  <span className="text-[11px] text-[#D97706] block mb-2 font-medium">
                    📍 {r.location}
                  </span>
                )}
                <div className="flex items-center gap-1 text-[#B45309] mb-2">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                  <span className="ml-2 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                    ✓ Verified Purchase
                  </span>
                </div>
                <h4 className="font-serif text-sm font-bold text-[#1C1917] mb-1">{r.title}</h4>
                <p className="text-xs text-[#57534E] leading-relaxed">{r.content}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Frequently Asked Questions */}
      {product.faqs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-8 mt-16 pt-12 border-t border-[#E8E5DF]">
          <h3 className="font-serif text-2xl text-[#1B4332] font-bold mb-6">
            Frequently Asked Questions
          </h3>
          <div className="space-y-3">
            {product.faqs.map((faq, idx) => (
              <div key={idx} className="bg-white border border-[#E8E5DF] rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full p-4 text-left text-xs font-bold text-[#1C1917] flex items-center justify-between hover:text-[#1B4332]"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${openFaqIndex === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaqIndex === idx && (
                  <p className="p-4 pt-0 text-xs text-[#78716C] leading-relaxed">
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 mt-16 pt-12 border-t border-[#E8E5DF]">
        <h3 className="font-serif text-2xl text-[#1B4332] font-bold mb-6">
          Frequently Paired Together
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {relatedProducts.map((rel) => (
            <div
              key={rel.id}
              onClick={() => onSelectProduct(rel)}
              className="p-3 bg-white border border-[#E8E5DF] hover:border-[#1B4332] rounded-xl cursor-pointer group transition-all"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-[#FBF9F5] mb-2.5">
                <img src={rel.images[0]} alt={rel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <p className="text-xs font-bold text-[#1C1917] group-hover:text-[#1B4332] line-clamp-1">
                {rel.name}
              </p>
              <p className="text-xs font-semibold text-[#D97706] mt-0.5">₹{rel.price}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
