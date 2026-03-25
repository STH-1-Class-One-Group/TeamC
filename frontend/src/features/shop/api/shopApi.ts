import {
  getSupabaseErrorMessage,
  hasSupabaseConfig,
  supabase,
} from '../../../api/supabaseClient';
import type { Product, ProductListResponse } from '../types';

const fetchShopProductsFromSupabase = async (
  page: number,
  pageSize: number
): Promise<ProductListResponse> => {
  if (!hasSupabaseConfig) {
    throw new Error(
      'Supabase browser client is not configured. In this react-scripts app, the client-exposed variables still need to be available at runtime.'
    );
  }

  const offset = (page - 1) * pageSize;

  const { count, error: countError } = await supabase
    .from('food_items')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    throw new Error(getSupabaseErrorMessage(countError));
  }

  const { data, error: dataError } = await supabase
    .from('food_items')
    .select('id, name, price, calories, image_url')
    .order('id', { ascending: true })
    .range(offset, offset + pageSize - 1);

  if (dataError) {
    throw new Error(getSupabaseErrorMessage(dataError));
  }


  if ((count || 0) === 0) {
    console.warn(
      '[shopApi] food_items returned 0 visible rows. If data exists in Supabase, check whether the browser is using the expected project and whether SELECT is allowed for the anon role on public.food_items.'
    );
  }

  return {
    items: data || [],
    total_count: count || 0,
    page,
    page_size: pageSize,
  };
};

const fetchAllShopProductsFromSupabase = async (): Promise<Product[]> => {
  if (!hasSupabaseConfig) {
    throw new Error(
      'Supabase browser client is not configured. In this react-scripts app, the client-exposed variables still need to be available at runtime.'
    );
  }

  const { data, error } = await supabase
    .from('food_items')
    .select('id, name, price, calories, image_url')
    .order('id', { ascending: true });

  if (error) {
    throw new Error(getSupabaseErrorMessage(error));
  }


  return data || [];
};

export const fetchShopProducts = async (
  page: number,
  pageSize: number,
  _signal?: AbortSignal
): Promise<ProductListResponse> => {
  return fetchShopProductsFromSupabase(page, pageSize);
};

export const fetchAllShopProducts = async (_signal?: AbortSignal): Promise<Product[]> => {
  return fetchAllShopProductsFromSupabase();
};
