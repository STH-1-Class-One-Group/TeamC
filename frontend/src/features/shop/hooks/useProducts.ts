import { useState, useEffect } from 'react';
import { supabase } from '../../../api/supabaseClient';

export interface Product {
  id: number;
  name: string;
  price: number;
  calories: number;
  image_url: string;
}

export const useProducts = (page: number = 1, pageSize: number = 8) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await supabase
          .from('food_items')
          .select('*', { count: 'exact' })
          .order('id', { ascending: true })
          .range(from, to);

        if (error) {
          throw error;
        }

        setProducts(data || []);
        if (count !== null) setTotalCount(count);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, pageSize]);

  return { products, loading, error, totalCount };
};