import { useEffect, useState } from 'react';
import { fetchShopProducts } from '../api/shopApi';
import type { Product } from '../types';

export const useProducts = (page: number = 1, pageSize: number = 8) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let isActive = true;
    const abortController = new AbortController();

    const loadProducts = async () => {
      setLoading(true);
      setError(null);
      setProducts([]);

      try {
        const response = await fetchShopProducts(page, pageSize, abortController.signal);

        if (!isActive) {
          return;
        }

        setProducts(response.items || []);
        setTotalCount(response.total_count || 0);
      } catch (err: any) {
        if (!isActive || err?.name === 'AbortError') {
          return;
        }

        setError(err.message || 'Failed to fetch products');
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, [page, pageSize]);

  return { products, loading, error, totalCount };
};
