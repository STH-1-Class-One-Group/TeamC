import { useEffect, useState } from 'react';
import { fetchAllShopProducts } from '../api/shopApi';
import type { Product } from '../types';

export const useProductSearch = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    let isActive = true;
    const abortController = new AbortController();

    const loadProducts = async () => {
      try {
        const data = await fetchAllShopProducts(abortController.signal);

        if (isActive) {
          setAllProducts(data);
        }
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          return;
        }
        if (isActive) {
          setAllProducts([]);
        }
      }
    };

    loadProducts();

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, []);

  return { allProducts };
};
