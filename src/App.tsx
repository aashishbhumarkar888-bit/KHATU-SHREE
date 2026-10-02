/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ToastProvider, useToastNotification } from './context/ToastNotificationContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { CursorProvider } from './context/CursorContext';
import { ProductsProvider, useProducts } from './context/ProductsContext';
import { CustomCursor } from './components/ui/CustomCursor';
import { Navbar } from './components/navigation/Navbar';
import { HeroExperience } from './components/hero/HeroExperience';
import { DepartmentGateway } from './components/home/DepartmentGateway';
import { HamperStudioBanner } from './components/home/HamperStudioBanner';
import { ProductDiscovery } from './components/products/ProductDiscovery';
import { ProductDetailView } from './components/product/ProductDetailView';
import { CartDrawer } from './components/cart/CartDrawer';
import { CartPage } from './components/cart/CartPage';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { SearchOverlay } from './components/search/SearchOverlay';
import { AccountModal } from './components/account/AccountModal';
import { AtelierConciergeModal } from './components/advisor/AtelierConciergeModal';
import { CustomHamperModal } from './components/hamper/CustomHamperModal';
import { DropshipInfoModal } from './components/dropship/DropshipInfoModal';
import { BrandStory } from './components/editorial/BrandStory';
import { Footer } from './components/editorial/Footer';
import { AdminPanel } from './components/admin/AdminPanel';
import { ReturnsPolicyPage } from './components/compliance/ReturnsPolicyPage';
import { TermsOfServicePage } from './components/compliance/TermsOfServicePage';
import { PrivacyPolicyPage } from './components/compliance/PrivacyPolicyPage';
import { ShippingPolicyPage } from './components/compliance/ShippingPolicyPage';
import { WhatsAppFloatButton } from './components/ui/WhatsAppFloatButton';
import { AdminAuthModal } from './components/admin/AdminAuthModal';
import { Product } from './types';

type ViewType = 'home' | 'shop' | 'product' | 'cart' | 'about' | 'admin' | 'returns' | 'terms' | 'privacy' | 'shipping';

function MainApp() {
  const { products } = useProducts();
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path === '/admin') return 'admin';
      if (path === '/returns') return 'returns';
      if (path === '/terms') return 'terms';
      if (path === '/privacy') return 'privacy';
      if (path === '/shipping') return 'shipping';
    }
    return 'home';
  });

  const [selectedProduct, setSelectedProduct] = useState<Product>(products[0] || {} as Product);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Products');
  
  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [accountInitialTab, setAccountInitialTab] = useState<'orders' | 'wishlist'>('orders');
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);
  const [conciergePrompt, setConciergePrompt] = useState('');
  const [isHamperBuilderOpen, setIsHamperBuilderOpen] = useState(false);
  const [isDropshipInfoOpen, setIsDropshipInfoOpen] = useState(false);

  const { registerOpenAccountHandler } = useToastNotification();

  // Sync selected product when products load
  useEffect(() => {
    if (products.length > 0 && (!selectedProduct.id || !products.find((p) => p.id === selectedProduct.id))) {
      setSelectedProduct(products[0]);
    }
  }, [products]);

  // Handle browser popstate navigation (Back / Forward)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/admin') setCurrentView('admin');
      else if (path === '/returns') setCurrentView('returns');
      else if (path === '/terms') setCurrentView('terms');
      else if (path === '/privacy') setCurrentView('privacy');
      else if (path === '/shipping') setCurrentView('shipping');
      else setCurrentView('home');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update Page Title and SEO Meta Tags dynamically per view
  useEffect(() => {
    const seoMap: Record<ViewType, { title: string; desc: string }> = {
      admin: {
        title: 'Khatu Shri Admin Console | Live Operations & Orders',
        desc: 'Protected administrator portal for live order dispatch, catalog stock management, and COD reconciliation.',
      },
      returns: {
        title: '7-Day Return & Refund Policy | Khatu Shri Bhopal',
        desc: 'Transparent 7-day return guidelines for handloom apparel, copperware, and FSSAI fresh dairy cold-chain standards.',
      },
      terms: {
        title: 'Terms of Service & Reseller Policy | Khatu Shri',
        desc: 'Commercial terms and responsibilities for buyers and independent 0% commission dropshipping resellers in India.',
      },
      privacy: {
        title: 'Privacy Policy & Google Drive Protection | Khatu Shri',
        desc: 'Data privacy rules covering Firebase Firestore zero-trust security and restricted Google Drive invoice access.',
      },
      shipping: {
        title: 'Shipping & Bhopal Same-Day Cold-Chain Delivery | Khatu Shri',
        desc: 'Pan-India COD express delivery in 3-5 days and Bhopal same-day chilled express before 6 PM cutoff.',
      },
      home: {
        title: 'Khatu Shri — Dropshipping & Direct Wholesale Marketplace',
        desc: 'Bhopal premier dropshipping and direct wholesale marketplace for farm-fresh A2 Gir cow dairy, apparel & sarees, organic staples, and handcrafted copperware.',
      },
      shop: {
        title: 'Marketplace Catalog | Khatu Shri Wholesale',
        desc: 'Browse direct wholesale rates on A2 Gir cow bilona ghee, Malai paneer, Khadi kurtas, and sacred puja samagri.',
      },
      product: {
        title: selectedProduct.name ? `${selectedProduct.name} | Khatu Shri` : 'Product Details | Khatu Shri',
        desc: selectedProduct.description || 'Authentic Bhopal direct wholesale catalog item.',
      },
      cart: {
        title: 'Shopping Bag & Wholesale Dispatch | Khatu Shri',
        desc: 'Review selected items for same-day Bhopal doorstep delivery or pan-India express courier fulfillment.',
      },
      about: {
        title: 'Why Khatu Shri Bhopal | Vedic Purity & Artisan Guild',
        desc: 'Learn about our central Sehore-Bhopal Gaushala, natural bilona churning, and zero-adulteration promise.',
      },
    };

    const currentSeo = seoMap[currentView] || seoMap.home;
    document.title = currentSeo.title;
    
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
      descMeta.setAttribute('content', currentSeo.desc);
    }
  }, [currentView, selectedProduct]);

  useEffect(() => {
    registerOpenAccountHandler((_orderId) => {
      setAccountInitialTab('orders');
      setIsAccountOpen(true);
    });
  }, [registerOpenAccountHandler]);

  const navigateToView = (view: ViewType, path: string) => {
    setCurrentView(view);
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToShop = (category: string = 'All Products') => {
    setSelectedCategory(category);
    setCurrentView('shop');
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToHome = () => {
    navigateToView('home', '/');
  };

  const navigateToAbout = () => {
    setCurrentView('about');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openConcierge = (prompt: string = '') => {
    setConciergePrompt(prompt);
    setIsConciergeOpen(true);
  };

  const openAccountWithTab = (tab: 'orders' | 'wishlist') => {
    setAccountInitialTab(tab);
    setIsAccountOpen(true);
  };

  // If in admin view, render dedicated Admin Console
  if (currentView === 'admin') {
    return (
      <div className="min-h-screen bg-[#FBF9F5] text-[#1C1917] flex flex-col selection:bg-[#1B4332] selection:text-white">
        <CustomCursor />
        <AdminPanel
          onBackToStore={() => navigateToHome()}
          onNavigateHome={() => navigateToHome()}
        />
        <WhatsAppFloatButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1C1917] flex flex-col selection:bg-[#1B4332] selection:text-white">
      {/* Custom Physics Cursor */}
      <CustomCursor />

      {/* Navigation */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenConcierge={() => openConcierge()}
        onOpenAccount={() => openAccountWithTab('orders')}
        onNavigateHome={navigateToHome}
        onNavigateShop={(cat) => navigateToShop(cat || 'All Products')}
        onNavigateAbout={navigateToAbout}
        onOpenWishlist={() => openAccountWithTab('wishlist')}
        onOpenHamperBuilder={() => setIsHamperBuilderOpen(true)}
        onOpenDropshipInfo={() => setIsDropshipInfoOpen(true)}
      />

      {/* Dynamic View Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <>
            <HeroExperience
              onSelectProduct={navigateToProduct}
              onExploreCollection={(cat) => navigateToShop(cat || 'All Products')}
              onOpenConcierge={() => openConcierge('Tell me about your khadi clothes, copper home utilities, and organic groceries.')}
            />
            <DepartmentGateway
              onSelectCategory={(cat) => navigateToShop(cat)}
            />
            <ProductDiscovery
              products={products}
              onSelectProduct={navigateToProduct}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => setSelectedCategory(cat)}
            />
            <HamperStudioBanner
              onOpenHamperBuilder={() => setIsHamperBuilderOpen(true)}
            />
            <BrandStory onExploreCollection={() => navigateToShop('All Products')} />
          </>
        )}

        {currentView === 'shop' && (
          <div className="pt-24 sm:pt-28">
            <ProductDiscovery
              products={products}
              onSelectProduct={navigateToProduct}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => setSelectedCategory(cat)}
            />
          </div>
        )}

        {currentView === 'product' && (
          <ProductDetailView
            product={selectedProduct}
            onBack={() => setCurrentView('shop')}
            onSelectProduct={navigateToProduct}
            onOpenConcierge={openConcierge}
            onInstantCheckout={() => setIsCheckoutOpen(true)}
          />
        )}

        {currentView === 'cart' && (
          <CartPage
            onContinueShopping={() => navigateToShop('All Products')}
            onProceedToCheckout={() => setIsCheckoutOpen(true)}
            onSelectProduct={navigateToProduct}
          />
        )}

        {currentView === 'about' && (
          <div className="pt-24 sm:pt-28">
            <BrandStory onExploreCollection={() => navigateToShop('All Products')} />
          </div>
        )}

        {/* Compliance & Trust Pages */}
        {currentView === 'returns' && (
          <ReturnsPolicyPage onBackToHome={navigateToHome} />
        )}

        {currentView === 'terms' && (
          <TermsOfServicePage onBackToHome={navigateToHome} />
        )}

        {currentView === 'privacy' && (
          <PrivacyPolicyPage onBackToHome={navigateToHome} />
        )}

        {currentView === 'shipping' && (
          <ShippingPolicyPage onBackToHome={navigateToHome} />
        )}
      </main>

      {/* Floating Business WhatsApp Button on All Pages */}
      <WhatsAppFloatButton />

      {/* Editorial Footer */}
      <Footer
        onNavigateShop={(cat) => navigateToShop(cat || 'All Products')}
        onNavigateAbout={navigateToAbout}
        onOpenConcierge={() => openConcierge()}
        onNavigateReturns={() => navigateToView('returns', '/returns')}
        onNavigateTerms={() => navigateToView('terms', '/terms')}
        onNavigatePrivacy={() => navigateToView('privacy', '/privacy')}
        onNavigateShipping={() => navigateToView('shipping', '/shipping')}
        onNavigateAdmin={() => navigateToView('admin', '/admin')}
      />

      {/* Cart Drawer */}
      <CartDrawer
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
        onExploreProducts={() => navigateToShop('All Products')}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onViewOrderInAccount={() => openAccountWithTab('orders')}
      />

      {/* Instant Search Overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
        onSelectProduct={navigateToProduct}
      />

      {/* Collector Account Sanctum */}
      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        onSelectProduct={navigateToProduct}
        initialTab={accountInitialTab}
      />

      {/* Atelier Concierge AI Modal */}
      <AtelierConciergeModal
        isOpen={isConciergeOpen}
        onClose={() => setIsConciergeOpen(false)}
        initialPrompt={conciergePrompt}
      />

      {/* Custom Sacred Hamper & Puja Box Builder */}
      <CustomHamperModal
        isOpen={isHamperBuilderOpen}
        onClose={() => setIsHamperBuilderOpen(false)}
      />

      {/* Meesho & Amazon Style Dropshipping & Reseller Modal */}
      <DropshipInfoModal
        isOpen={isDropshipInfoOpen}
        onClose={() => setIsDropshipInfoOpen(false)}
        onExploreProducts={() => {
          setIsDropshipInfoOpen(false);
          navigateToShop('All Products');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ProductsProvider>
          <CartProvider>
            <CursorProvider>
              <MainApp />
            </CursorProvider>
          </CartProvider>
        </ProductsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
