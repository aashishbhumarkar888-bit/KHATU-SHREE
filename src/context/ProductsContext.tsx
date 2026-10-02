import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { subscribeToLiveProducts, getLiveProducts, normalizeProduct } from '../services/productsService';
import { PRODUCTS as SEED_PRODUCTS } from '../data/products';

interface ProductsContextType {
  products: Product[];
  loading: boolean;
  refreshProducts: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => SEED_PRODUCTS.map(normalizeProduct));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToLiveProducts((liveList) => {
      setProducts(liveList);
      setLoading(false);
    });

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const refreshProducts = async () => {
    setLoading(true);
    const liveList = await getLiveProducts();
    setProducts(liveList);
    setLoading(false);
  };

  return (
    <ProductsContext.Provider value={{ products, loading, refreshProducts }}>
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    // Graceful fallback if invoked outside provider
    return {
      products: SEED_PRODUCTS.map(normalizeProduct),
      loading: false,
      refreshProducts: async () => {},
    };
  }
  return context;
};
