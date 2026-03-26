import React, { useState, useEffect } from 'react';
import { getUserCouponsForUser } from '../../features/cart/services/cartService';
import type { Coupon } from '../../features/cart/types/cart.types';

interface MyCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MyCouponModal: React.FC<MyCouponModalProps> = ({ isOpen, onClose }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchCoupons = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getUserCouponsForUser();
        setCoupons(data);
      } catch (err: any) {
        setError(err.message || '쿠폰을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* 모달 내용 */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div
          className="bg-surface-container-lowest dark:bg-slate-900 w-full max-w-md p-6 rounded-2xl shadow-xl transform transition-all border border-slate-200 dark:border-slate-800"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-on-surface dark:text-white">내 쿠폰</h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined translate-y-[2px]">close</span>
            </button>
          </div>

          {loading ? (
            <p className="text-center py-8 text-on-surface-variant dark:text-slate-400">쿠폰을 불러오는 중...</p>
          ) : error ? (
            <p className="text-center py-8 text-red-500">{error}</p>
          ) : coupons.length === 0 ? (
            <p className="text-center py-8 text-on-surface-variant dark:text-slate-400">보유하신 쿠폰이 없습니다.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {coupons.map((coupon) => (
                <div
                  key={coupon.user_coupon_id}
                  className={`rounded-lg border p-4 ${
                    coupon.is_used
                      ? 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 opacity-60'
                      : 'border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-on-surface dark:text-white">{coupon.name}</h3>
                      <p className="text-sm text-on-surface-variant dark:text-slate-400 mt-1">
                        {coupon.discount_type === 'amount'
                          ? `₩ ${coupon.discount_value.toLocaleString()} 할인`
                          : `${coupon.discount_value}% 할인`}
                      </p>
                      <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1">
                        최소 주문 ₩ {coupon.min_order_amount.toLocaleString()}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      coupon.is_used
                        ? 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                        : 'bg-emerald-200 dark:bg-emerald-700 text-emerald-800 dark:text-emerald-200'
                    }`}>
                      {coupon.is_used ? '사용됨' : '사용 가능'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};