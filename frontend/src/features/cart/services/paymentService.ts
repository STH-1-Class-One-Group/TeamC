import { loadTossPayments } from '@tosspayments/payment-sdk';

const clientKey = 'test_ck_D5GepWvyJnrK0W0k6q8gLzN97Eoq';

export const requestPayment = async (
  amount: number,
  orderName: string,
  customerName: string,
  successUrl: string
) => {
  try {
    const tossPayments = await loadTossPayments(clientKey);

    await tossPayments.requestPayment('카드', {
      amount: amount,
      orderId: `order-${Date.now()}`,
      orderName: orderName,
      customerName: customerName,
      successUrl: successUrl,
      failUrl: `${window.location.origin}/payment-fail`,
    });
  } catch (error: any) {
    // ⭐ 사용자가 직접 결제창을 닫은 경우(USER_CANCEL)는 알림을 띄우지 않습니다.
    if (error.code === 'USER_CANCEL') {
      console.log('사용자가 결제를 취소했습니다.');
      return;
    }

    // 진짜 에러인 경우에만 팝업을 띄웁니다.
    console.error('토스 결제 에러:', error);
    alert('결제 진행 중 오류가 발생했습니다.');
  }
};