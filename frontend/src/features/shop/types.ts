export interface Product {
  id: number;
  name: string;
  price: number;
  calories: number;
  image_url: string;
}

export interface ProductListResponse {
  items: Product[];
  total_count: number;
  page: number;
  page_size: number;
}
