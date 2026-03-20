import React from 'react';
import { Product } from '../hooks/useProducts';
import { supabase } from '../../../api/supabaseClient';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  // Get public URL from Supabase storage (assuming bucket is 'food-images')
  // If the image_url is already a full URL (say for fallback mock data), we use it directly.
  const imageUrl = product.image_url.startsWith('http') 
    ? product.image_url 
    : supabase.storage.from('food-images').getPublicUrl(product.image_url).data.publicUrl;

  return (
    <div className="group bg-surface-container-lowest rounded-xl overflow-hidden hover:shadow-[0_12px_40px_rgba(27,28,28,0.06)] transition-all duration-300">
      <div className="aspect-square bg-surface-dim relative overflow-hidden">
        <img 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          src={imageUrl} 
        />
        {/* badges based on calories or other conditions could go here, omitting for simplicity */}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-on-surface mb-2 tracking-tight">{product.name}</h3>
        <p className="text-on-surface-variant text-sm mb-4 line-clamp-2">칼로리: {product.calories} kcal</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-extrabold text-primary">₩ {product.price.toLocaleString()}</span>
          <div className="flex gap-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low text-on-surface hover:bg-primary hover:text-on-primary transition-all">
              <span className="material-symbols-outlined text-[20px]" translate="no">credit_card</span>
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low text-on-surface hover:bg-primary hover:text-on-primary transition-all">
              <span className="material-symbols-outlined text-[20px]" translate="no">shopping_cart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};