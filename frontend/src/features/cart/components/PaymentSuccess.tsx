import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../hooks/useCart';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleClear } = useCart();

  const amount = searchParams.get('amount');
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    const from = searchParams.get('from');
    if (from === 'cart') {
      handleClear();
    }
  }, [searchParams, handleClear]);

  return (
    // min-h-[60vh]로 높이를 조절하고 flex-col center로 중앙에 딱 붙였습니다.
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full animate-in fade-in duration-700">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-slate-800 text-center">
        
        {/* 🎉 아이콘 부분 */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
          <span className="material-symbols-outlined text-5xl text-green-600 dark:text-green-400">
            check_circle
          </span>
        </div>

        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
          결제가 완료되었습니다!
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          주문해주셔서 감사합니다.<br />
          정성껏 준비해서 곧 보내드릴게요.
        </p>
        
        {/* 💳 결제 상세 정보 카드 */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl mb-8 text-left border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between mb-2">
            <span className="text-slate-400 text-sm">주문 번호</span>
            <span className="text-slate-700 dark:text-slate-200 font-mono text-sm truncate ml-4">{orderId}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
            <span className="text-slate-400 text-sm">최종 결제 금액</span>
            <span className="text-xl font-bold text-primary">₩ {Number(amount).toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 transition-all hover:-translate-y-1 active:scale-95"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;