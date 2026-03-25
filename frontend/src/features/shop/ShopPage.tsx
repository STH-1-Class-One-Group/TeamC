import React, { useState } from 'react';
import { SearchBar } from '../../components/common/SearchBar';
import { ProductCard } from './components/ProductCard';
import { useProducts } from './hooks/useProducts';
import { useProductSearch } from './hooks/useProductSearch';
import type { Product } from './types';

export const ShopPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const pageSize = 8;

  const { products, loading, error, totalCount } = useProducts(page, pageSize);
  const { allProducts } = useProductSearch();

  const totalPages = Math.ceil(totalCount / pageSize);


  const handleNextPage = () => {
    if (page < totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  return (
    <>
      <section className="max-w-2xl mx-auto mb-16 px-4">
        <SearchBar
          searchType="food"
          placeholder="찾으시는 식품이나 상품명을 입력하세요"
          localItems={allProducts}
          searchKeys={['name']}
          onSearchSelect={(item) => setSelectedProduct(item)}
        />
      </section>

      <section className="mb-12 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-extrabold tracking-tighter mb-4 text-on-surface dark:text-white">
            밀리터리 푸드 & 군것질 보관함
          </h1>
          <p className="text-on-surface-variant dark:text-slate-400 text-lg leading-relaxed">
            엄격한 기준을 통과한 고품질 군용 식품들을 만나보세요. 모든 품목은 현지 직송으로 공수되어 최상의 상태를 유지합니다.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {selectedProduct ? (
          <ProductCard key={selectedProduct.id} product={selectedProduct} />
        ) : error ? (
          <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex justify-center py-20">
            <span className="text-error">상품 로드 오류: {error}</span>
          </div>
        ) : products.length > 0 ? (
          products.map((product) => <ProductCard key={product.id} product={product} />)
        ) : loading ? (
          <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex justify-center py-20">
            <span className="text-on-surface-variant dark:text-slate-400">상품을 불러오는 중...</span>
          </div>
        ) : (
          <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex justify-center py-20">
            <span className="text-on-surface-variant dark:text-slate-400">판매 중인 상품이 없습니다.</span>
          </div>
        )}
      </section>

      {!selectedProduct && loading && products.length > 0 && (
        <section className="flex justify-center mb-8">
          <span className="text-sm text-on-surface-variant dark:text-slate-400">상품을 더 불러오는 중...</span>
        </section>
      )}

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
