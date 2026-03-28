import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';

import { SearchBar } from '../../components/common/SearchBar';
import { ProductCard } from './components/ProductCard';
import { useProductSearch } from './hooks/useProductSearch';
import { useProducts } from './hooks/useProducts';
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
      <Helmet>
        <title>스토어 | Modern Sentinel</title>
        <meta name="description" content="군 생활에 필요한 상품과 보급품을 확인할 수 있습니다." />
        <meta property="og:title" content="스토어 | Modern Sentinel" />
        <meta property="og:description" content="군 생활에 필요한 상품과 보급품을 확인할 수 있습니다." />
      </Helmet>
      <section className="mx-auto mb-10 max-w-2xl px-0 sm:mb-14">
        <SearchBar
          searchType="food"
          placeholder="찾는 상품명이나 식품명을 입력하세요"
          localItems={allProducts}
          searchKeys={['name']}
          onSearchSelect={(item) => setSelectedProduct(item)}
        />
      </section>

      <section className="mb-10 text-center sm:mb-12">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-4 text-3xl font-extrabold tracking-tighter text-on-surface dark:text-white sm:text-4xl lg:text-5xl">
            밀리터리 푸드 & 군생활 보급품
          </h1>
          <p className="text-base leading-relaxed text-on-surface-variant dark:text-slate-400 sm:text-lg">
            군생활에 필요한 식품과 보급품을 한 곳에서 확인하세요. 상품 데이터가 연결되지 않으면
            설정 안내 메시지가 먼저 표시됩니다.
          </p>
        </div>
      </section>

      <section className="mb-12 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-8">
        {selectedProduct ? (
          <ProductCard key={selectedProduct.id} product={selectedProduct} />
        ) : error ? (
          <div className="col-span-1 flex justify-center py-20 sm:col-span-2 lg:col-span-4">
            <div className="max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-center text-sm font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              상품 로드 오류: {error}
            </div>
          </div>
        ) : products.length > 0 ? (
          products.map((product) => <ProductCard key={product.id} product={product} />)
        ) : loading ? (
          <div className="col-span-1 flex justify-center py-20 sm:col-span-2 lg:col-span-4">
            <span className="text-on-surface-variant dark:text-slate-400">상품을 불러오는 중입니다...</span>
          </div>
        ) : (
          <div className="col-span-1 flex justify-center py-20 sm:col-span-2 lg:col-span-4">
            <span className="text-on-surface-variant dark:text-slate-400">판매 중인 상품이 없습니다.</span>
          </div>
        )}
      </section>

      {!selectedProduct && loading && products.length > 0 && (
        <section className="mb-8 flex justify-center">
          <span className="text-sm text-on-surface-variant dark:text-slate-400">상품을 더 불러오는 중입니다...</span>
        </section>
      )}

      {!selectedProduct && totalPages > 0 && (
        <section className="mt-8 flex items-center justify-center gap-4 sm:gap-6">
          <button
            onClick={handlePrevPage}
            disabled={page === 1}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
              page === 1
                ? 'cursor-not-allowed text-outline-variant'
                : 'text-on-surface-variant hover:bg-surface-container-high dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <span className="material-symbols-outlined" translate="no">
              chevron_left
            </span>
          </button>
          <div className="text-xs font-medium tracking-[0.24em] text-on-surface-variant dark:text-slate-400 sm:text-sm">
            {page} <span className="mx-2 text-outline-variant dark:text-slate-600">/</span> {totalPages}
          </div>
          <button
            onClick={handleNextPage}
            disabled={page === totalPages}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
              page === totalPages
                ? 'cursor-not-allowed text-outline-variant'
                : 'text-on-surface-variant hover:bg-surface-container-high dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <span className="material-symbols-outlined" translate="no">
              chevron_right
            </span>
          </button>
        </section>
      )}
    </>
  );
};
