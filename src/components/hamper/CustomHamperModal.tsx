import React, { useState } from 'react';
import { 
  X, 
  Gift, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  ArrowRight, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Heart, 
  Shirt, 
  Utensils, 
  Milk, 
  Wheat, 
  Flame,
  Award,
  ChevronRight
} from 'lucide-react';
import { Product, ProductVariant } from '../../types';
import { PRODUCTS } from '../../data/products';
import { useCart } from '../../context/CartContext';
import { useToastNotification } from '../../context/ToastNotificationContext';

interface CustomHamperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BoxOption {
  id: string;
  name: string;
  hindiName: string;
  price: number;
  material: string;
  image: string;
  description: string;
  badge: string;
}

const BOX_OPTIONS: BoxOption[] = [
  {
    id: 'box-sheesham',
    name: 'Handcrafted Sheesham Wooden Jali Box',
    hindiName: 'शीशम की नक्काशीदार लकड़ी का बॉक्स',
    price: 350,
    material: 'Natural MP Sheesham Wood & Brass Latches',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
    description: 'Artisanal solid Sheesham box with sacred lattice woodwork, red velvet bedding, and brass latch. Heirloom keepsake.',
    badge: 'Most Popular'
  },
  {
    id: 'box-brass',
    name: 'Royal Hand-Hammered Brass Shagun Box',
    hindiName: 'शाही पीतल एवं मोरपंख उत्कीर्ण बॉक्स',
    price: 650,
    material: 'Pure Hand-Beaten Bell Brass Metal',
    image: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=800&q=80',
    description: 'Heavy traditional brass box with peacock engravings. Perfect for weddings, housewarmings, and prestigious gifting.',
    badge: 'Royal Heirloom'
  },
  {
    id: 'box-jute',
    name: 'Golden Handloom Jute & Zari Gift Basket',
    hindiName: 'गोल्डन जूट एवं जरी उत्सव टोकरी',
    price: 180,
    material: 'Natural Organic Jute & Golden Zari Ribbons',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    description: 'Lightweight, sustainable woven basket with sacred golden ribbons and natural dry grass cushioning.',
    badge: 'Eco-Friendly'
  }
];

const OCCASIONS = [
  { id: 'ekadashi', label: '🌸 Khatu Ekadashi & Mandir Puja' },
  { id: 'grihapravesh', label: '🏡 Housewarming (Griha Pravesh)' },
  { id: 'diwali', label: '🪔 Festive & Deepawali Shagun' },
  { id: 'wedding', label: '💍 Wedding & Shagun Blessings' },
  { id: 'elder', label: '🙏 Elder Reverence (Pita-Mata / Dadi)' },
  { id: 'wellness', label: '🌿 Natural Health & Ayurvedic Care' }
];

export const CustomHamperModal: React.FC<CustomHamperModalProps> = ({ isOpen, onClose }) => {
  const { addItem, openCart } = useCart();
  const { showCustomToast } = useToastNotification();

  // Curatable catalog items
  const curatableIds = [
    'prod-khadi-cotton-kurta',
    'prod-khatu-zari-shawl',
    'prod-temple-kasavu-dhoti',
    'prod-copper-water-bottle',
    'prod-kansa-bronze-thali',
    'prod-a2-bilona-ghee',
    'prod-pure-ghee-wicks',
    'prod-bhimseni-camphor',
    'prod-kashmiri-saffron',
    'prod-satpura-wild-honey',
    'prod-desi-gur-jaggery',
    'prod-sendha-namak',
    'prod-clay-water-matka',
    'prod-pantry-spices-box'
  ];

  const availableItems = PRODUCTS.filter((p) => curatableIds.includes(p.id));

  // Builder State
  const [selectedBox, setSelectedBox] = useState<BoxOption>(BOX_OPTIONS[0]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([
    'prod-khatu-zari-shawl',
    'prod-copper-water-bottle',
    'prod-a2-bilona-ghee'
  ]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [recipientName, setRecipientName] = useState('Respected Family');
  const [occasion, setOccasion] = useState(OCCASIONS[0].label);
  const [blessingNote, setBlessingNote] = useState(
    'जय श्री श्याम। आपके घर में सुख, शांति, समृद्धि एवं उत्तम स्वास्थ्य का सदैव वास रहे।'
  );

  if (!isOpen) return null;

  const selectedProducts = availableItems.filter((p) => selectedProductIds.includes(p.id));

  const toggleProduct = (productId: string) => {
    if (selectedProductIds.includes(productId)) {
      if (selectedProductIds.length <= 1) {
        showCustomToast({
          orderId: 'HAMPER',
          newStatus: 'placed',
          title: 'Minimum 1 Item Required',
          message: 'Please keep at least 1 item in your custom gift hamper.',
          duration: 3000
        });
        return;
      }
      setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
    } else {
      if (selectedProductIds.length >= 6) {
        showCustomToast({
          orderId: 'HAMPER',
          newStatus: 'placed',
          title: 'Hamper Box Full',
          message: 'A maximum of 6 curated items fit inside this gift box.',
          duration: 3000
        });
        return;
      }
      setSelectedProductIds((prev) => [...prev, productId]);
    }
  };

  // Price calculations
  const itemsSubtotal = selectedProducts.reduce((sum, p) => sum + p.price, 0);
  const rawTotal = selectedBox.price + itemsSubtotal;
  const bundleDiscount = Math.round(rawTotal * 0.15); // 15% Hamper Bundle Savings
  const finalPrice = rawTotal - bundleDiscount;
  const loyaltyPointsEarned = Math.floor(finalPrice / 10);

  const handleAddHamperToBag = () => {
    const timestamp = Date.now();
    const customHamperProduct: Product = {
      id: `custom-hamper-${timestamp}`,
      slug: `custom-gift-hamper-${timestamp}`,
      name: `Khatu Custom Gift Hamper for ${recipientName}`,
      hindiName: 'खाटू श्याम कस्टमाइज़्ड उत्सव उपहार बॉक्स',
      subheading: `${selectedBox.name} with ${selectedProducts.length} Sacred Offerings`,
      category: 'Home Utilities & Kitchenware',
      price: finalPrice,
      compareAtPrice: rawTotal,
      currency: 'INR',
      images: [selectedBox.image, ...selectedProducts.map((p) => p.images[0])],
      variants: [
        {
          id: `var-hamper-${timestamp}`,
          name: selectedBox.name,
          sku: `KSP-HAMPER-${timestamp.toString().slice(-4)}`,
          weightOrVolume: `${selectedProducts.length} Items + Box`,
          inStock: true
        }
      ],
      purityBadge: '100% Curated Sacred Gift Hamper · 15% Bundle Savings Applied',
      farmOrigin: 'Khatu Shri Devotional Atelier, Bhopal',
      netWeight: 'Special Gift Hamper Box',
      shelfLife: 'Varies by item',
      description: `Curated bespoke hamper: ${selectedProducts.map((p) => p.name).join(', ')}. Blessing Note: "${blessingNote}".`,
      benefits: [
        'Handcrafted wooden/brass festive gift packaging with auspicious red moli ribbon',
        'Includes personalized calligraphed blessing card',
        'Certified 100% authentic handloom, pure metals, and organic foods',
        'Priority Bhopal doorstep delivery'
      ],
      specifications: {
        'Box Packaging': selectedBox.name,
        'Recipient': recipientName,
        'Occasion': occasion,
        'Included Offerings': `${selectedProducts.length} curated holy items`,
        'Personal Note': blessingNote
      },
      rating: 5.0,
      reviewCount: 42,
      isBestseller: true,
      isFreshDairy: false,
      deliverySlots: ['Bhopal Same-Day Express (2 Hours)', 'Morning 6:00 – 8:30 AM'],
      storageInstructions: 'Store in a clean, sacred place.',
      faqs: []
    };

    addItem(customHamperProduct, customHamperProduct.variants[0], 1);
    onClose();
    openCart();

    showCustomToast({
      orderId: 'HAMPER-SUCCESS',
      newStatus: 'delivered',
      title: 'Custom Gift Hamper Added to Bag! 🎁',
      message: `Curated with ${selectedProducts.length} sacred items for ${recipientName}. 15% discount applied!`,
      duration: 6000
    });
  };

  const filteredItems = availableItems.filter((item) => {
    if (activeCategoryFilter === 'all') return true;
    if (activeCategoryFilter === 'apparel') return item.category.includes('Apparel');
    if (activeCategoryFilter === 'utilities') return item.category.includes('Utilities');
    if (activeCategoryFilter === 'dairy') return item.category.includes('Dairy');
    if (activeCategoryFilter === 'puja') return item.category.includes('Puja');
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#FBF9F5] border border-[#E8E5DF] text-[#1C1917] w-full max-w-5xl rounded-3xl shadow-2xl relative overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#1B4332] via-[#245A43] to-[#122E22] text-white flex items-center justify-between border-b border-[#2D6A4F] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D97706]/20 border border-[#D97706]/40 flex items-center justify-center text-[#FDE68A]">
              <Gift className="w-5 h-5 text-[#FDE68A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#D97706] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Hamper Studio
                </span>
                <span className="text-xs text-[#FDE68A] font-semibold">15% Bundle Discount Included</span>
              </div>
              <h2 className="font-serif text-lg sm:text-xl font-bold mt-0.5">
                Sacred Khatu Gift Box & Hamper Builder
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-1 divide-y lg:divide-y-0 lg:divide-x divide-[#E8E5DF]">
          
          {/* ========================================================================= */}
          {/* LEFT COLUMN: CUSTOMIZATION STEPS (Box, Items, Card)                       */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 p-5 sm:p-7 space-y-7 overflow-y-auto">
            
            {/* STEP 1: CHOOSE BOX */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D97706] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#D97706]/10 text-[#D97706] flex items-center justify-center text-[10px]">1</span>
                  <span>Select Auspicious Gift Box</span>
                </span>
                <span className="text-[11px] text-[#78716C] font-medium">Includes red moli ribbon & tag</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {BOX_OPTIONS.map((box) => {
                  const isSelected = selectedBox.id === box.id;
                  return (
                    <div
                      key={box.id}
                      onClick={() => setSelectedBox(box)}
                      className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected 
                          ? 'border-[#1B4332] bg-white shadow-md ring-1 ring-[#1B4332]/20' 
                          : 'border-[#E8E5DF] bg-white/70 hover:bg-white hover:border-[#1B4332]/40'
                      }`}
                    >
                      <div>
                        <div className="aspect-16/10 rounded-xl overflow-hidden bg-[#FBF9F5] mb-2.5 relative">
                          <img src={box.image} alt={box.name} className="w-full h-full object-cover" />
                          <span className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded">
                            {box.badge}
                          </span>
                        </div>

                        <h4 className="font-serif text-xs font-bold text-[#1C1917] line-clamp-1 leading-snug">
                          {box.name}
                        </h4>
                        <p className="text-[10px] text-[#78716C] line-clamp-2 mt-1">
                          {box.material}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#E8E5DF] flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[#1B4332]">
                          ₹{box.price}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-[#1B4332] text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: SELECT ITEMS */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D97706] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#D97706]/10 text-[#D97706] flex items-center justify-center text-[10px]">2</span>
                  <span>Curate Offerings ({selectedProductIds.length} / 6 selected)</span>
                </span>
                <span className="text-xs text-[#1B4332] font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full self-start">
                  Pick 1 to 6 items across all categories
                </span>
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1 text-xs font-semibold">
                {[
                  { key: 'all', label: 'All Items' },
                  { key: 'apparel', label: '👕 Clothes & Shawls' },
                  { key: 'utilities', label: '🏺 Copper & Kansa' },
                  { key: 'dairy', label: '🥛 Desi Ghee & Pantry' },
                  { key: 'puja', label: '🪔 Holy Samagri' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveCategoryFilter(tab.key)}
                    className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                      activeCategoryFilter === tab.key
                        ? 'bg-[#1B4332] text-white'
                        : 'bg-white border border-[#E8E5DF] text-[#78716C] hover:text-[#1C1917]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto p-1">
                {filteredItems.map((prod) => {
                  const isChecked = selectedProductIds.includes(prod.id);
                  return (
                    <div
                      key={prod.id}
                      onClick={() => toggleProduct(prod.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                        isChecked 
                          ? 'border-[#1B4332] bg-emerald-50/50 shadow-2xs' 
                          : 'border-[#E8E5DF] bg-white hover:border-[#1B4332]/40'
                      }`}
                    >
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-12 h-12 object-cover rounded-lg bg-[#FBF9F5] shrink-0"
                      />

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <h4 className="font-serif text-xs font-bold text-[#1C1917] truncate">
                          {prod.name}
                        </h4>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-[#1B4332]">
                            ₹{prod.price}
                          </span>
                          <span className="text-[#78716C] text-[10px] truncate max-w-[100px]">
                            {prod.variants[0]?.weightOrVolume}
                          </span>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isChecked ? 'bg-[#1B4332] border-[#1B4332] text-white' : 'border-[#E8E5DF] bg-white'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP 3: PERSONALIZATION & BLESSING CARD */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D97706] flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#D97706]/10 text-[#D97706] flex items-center justify-center text-[10px]">3</span>
                <span>Personalize Devotional Blessing Card</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    Recipient / Family Name
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Sharma Family, Dadi Ji..."
                    className="w-full px-3 py-2 bg-white border border-[#E8E5DF] rounded-xl text-xs focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    Occasion / Shagun
                  </label>
                  <select
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E8E5DF] rounded-xl text-xs focus:outline-none focus:border-[#1B4332] cursor-pointer"
                  >
                    {OCCASIONS.map((occ) => (
                      <option key={occ.id} value={occ.label}>{occ.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Custom Devotional Blessing Message
                </label>
                <textarea
                  rows={2}
                  value={blessingNote}
                  onChange={(e) => setBlessingNote(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E8E5DF] rounded-xl text-xs focus:outline-none focus:border-[#1B4332]"
                />
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: LIVE HAMPER PREVIEW & BUNDLE PRICING                        */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 p-5 sm:p-7 bg-[#F4F1EA] flex flex-col justify-between space-y-6">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1B4332] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#D97706]" />
                  <span>Live Hamper Box Preview</span>
                </span>
                <span className="text-[10px] font-mono text-[#78716C] uppercase bg-white px-2 py-0.5 rounded border border-[#E8E5DF]">
                  Bhopal Custom Studio
                </span>
              </div>

              {/* Visual Box Rendering */}
              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-4 shadow-sm relative overflow-hidden space-y-3">
                
                {/* Decorative Auspicious Ribbon */}
                <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E8E5DF]">
                  <span className="text-[#D97706] font-bold text-[11px] flex items-center gap-1">
                    <span>ॐ</span>
                    <span>{occasion}</span>
                  </span>
                  <span className="text-[10px] text-[#78716C] font-semibold bg-[#FFFBEB] px-2 py-0.5 rounded text-[#B45309] border border-[#FDE68A]">
                    For: {recipientName}
                  </span>
                </div>

                {/* Packaging preview photo */}
                <div className="relative aspect-16/9 rounded-xl overflow-hidden bg-[#FBF9F5]">
                  <img src={selectedBox.image} alt={selectedBox.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
                    <span className="text-xs font-bold text-white leading-tight">
                      {selectedBox.name}
                    </span>
                  </div>
                </div>

                {/* Selected Items Mini Badges inside Hamper */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-[#78716C] block">
                    Curated Contents ({selectedProducts.length} Items):
                  </span>

                  <div className="flex flex-wrap gap-1.5">
                    {selectedProducts.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#FBF9F5] border border-[#E8E5DF] text-[10px] font-medium text-[#1C1917]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1B4332]" />
                        <span className="truncate max-w-[120px]">{p.name}</span>
                        <span className="text-[#D97706] font-bold">₹{p.price}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Auspicious Blessing Tag */}
                <div className="p-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-[11px] text-[#B45309] space-y-0.5">
                  <span className="font-bold block text-[10px] uppercase tracking-wider text-[#D97706]">
                    Included Auspicious Blessing Card:
                  </span>
                  <p className="italic text-[#1C1917]/80 line-clamp-2">
                    "{blessingNote}"
                  </p>
                </div>

              </div>

              {/* Price Breakdown with 15% Discount */}
              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-[#78716C]">
                  <span>Box Packaging ({selectedBox.name.split(' ')[0]}):</span>
                  <span className="font-mono text-[#1C1917]">₹{selectedBox.price}</span>
                </div>

                <div className="flex justify-between text-[#78716C]">
                  <span>{selectedProducts.length} Curated Offerings Subtotal:</span>
                  <span className="font-mono text-[#1C1917]">₹{itemsSubtotal}</span>
                </div>

                <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Custom Hamper Bundle Discount (15%):</span>
                  </span>
                  <span className="font-mono font-bold">-₹{bundleDiscount}</span>
                </div>

                <div className="flex justify-between text-[#78716C] text-[11px]">
                  <span>Auspicious Red Moli & Kesar Tika:</span>
                  <span className="text-emerald-700 font-bold uppercase">Included FREE</span>
                </div>

                <div className="pt-2 border-t border-[#E8E5DF] flex items-baseline justify-between">
                  <div>
                    <span className="font-serif text-sm font-bold text-[#1B4332] block">
                      Total Hamper Price
                    </span>
                    <span className="text-[10px] text-[#78716C]">
                      Earns +{loyaltyPointsEarned} Khatu Points
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-xl font-bold text-[#1C1917]">
                        ₹{finalPrice}
                      </span>
                      <span className="font-mono text-xs text-[#78716C] line-through">
                        ₹{rawTotal}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Add to Bag CTA */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleAddHamperToBag}
                className="w-full py-3.5 px-4 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#FDE68A]" />
                <span>Add Custom Hamper to Bag (₹{finalPrice})</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <p className="text-[11px] text-center text-[#78716C] flex items-center justify-center gap-1.5">
                <span>Direct Same-Day Delivery across Bhopal</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#D97706] font-semibold">100% Satisfaction Guaranteed</span>
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
