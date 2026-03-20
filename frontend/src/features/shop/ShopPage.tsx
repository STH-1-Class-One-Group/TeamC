import React, { useState } from 'react';
import { useProducts } from './hooks/useProducts';
import { ProductCard } from './components/ProductCard';
import { SearchBar } from '../../components/common/SearchBar';

export const ShopPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const { products, loading, error, totalCount } = useProducts(page, pageSize);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleNextPage = () => {
    if (page < totalPages) setPage((p) => p + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  return (
    <>
      {/* Search Section */}
      <section className="max-w-2xl mx-auto mb-16 px-4">
        <SearchBar 
          searchType="food" 
          placeholder="찾으시는 식량이나 상품을 입력하세요" 
          onSearchSelect={(item) => setSelectedProduct(item)} 
        />
      </section>

      {/* Hero Section */}
      <section className="mb-12 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-extrabold tracking-tighter mb-4 text-on-surface dark:text-white">
            프리미엄 전투식량 & 군용 식품
          </h1>
          <p className="text-on-surface-variant dark:text-slate-400 text-lg leading-relaxed">
            엄격한 기준을 통과한 고품질 군용 식품을 만나보세요. 현역 장병부터 일반인까지 누구나 즐길 수 있는 최고의 영양 설계를 제공합니다.
          </p>
        </div>
      </section>

      {/* Product Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {selectedProduct ? (
          <ProductCard key={selectedProduct.id} product={selectedProduct} />
        ) : loading ? (
          <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex justify-center py-20">
            <span className="text-on-surface-variant dark:text-slate-400">Loading products...</span>
          </div>
        ) : error ? (
          <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex justify-center py-20">
            <span className="text-error">Error loading products: {error}</span>
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex justify-center py-20">
            <span className="text-on-surface-variant dark:text-slate-400">No products available.</span>
          </div>
        ) : (
          products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </section>

      {/* Pagination - Hide when searching */}
      {!selectedProduct && totalPages > 0 && (
        <section className="flex justify-center items-center gap-6 mt-8">
          <button 
            onClick={handlePrevPage}
            disabled={page === 1}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${page === 1 ? 'text-outline-variant cursor-not-allowed' : 'hover:bg-surface-container-high dark:hover:bg-slate-800 text-on-surface-variant dark:text-slate-400'}`}
          >
            <span className="material-symbols-outlined" translate="no">chevron_left</span>
          </button>
          <div className="text-sm font-medium tracking-widest text-on-surface-variant dark:text-slate-400">
            {page} <span className="mx-2 text-outline-variant dark:text-slate-600">/</span> {totalPages}
          </div>
          <button 
            onClick={handleNextPage}
            disabled={page === totalPages}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${page === totalPages ? 'text-outline-variant cursor-not-allowed' : 'hover:bg-surface-container-high dark:hover:bg-slate-800 text-on-surface-variant dark:text-slate-400'}`}
          >
            <span className="material-symbols-outlined" translate="no">chevron_right</span>
          </button>
        </section>
      )}
    </>
  );
};