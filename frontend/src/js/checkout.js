/** 運費規則（同後端 CheckoutService）：商品小計滿 2500 免運，否則 50 */
export const FREE_SHIPPING_THRESHOLD = 2500;
export const SHIPPING_FEE = 50;

// 結帳選項：value 對應後端 enum（必須大寫），label 是畫面顯示的中文
export const SHIPPING_OPTIONS = [
    { value: 'HOME', label: '宅配' },
    { value: 'CVS', label: '超商取貨' },
];
export const PAYMENT_OPTIONS = [
    { value: 'CREDIT', label: '信用卡' },
    { value: 'ATM', label: 'ATM 轉帳' },
    { value: 'COD', label: '貨到付款' },
];
