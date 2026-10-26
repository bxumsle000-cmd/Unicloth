/**
 * 後台共用的東西。
 * 員工的 token 跟會員的 token（kinu.js 的 'token'）分開存：
 * 員工 token 不能打會員 API，混在一起的話前台 Header 會以為會員登入了。
 */
import { api } from "./kinu.js";

// 五個部門：key 要跟後端 enum Department 一樣（登入時直接送給後端），name 是畫面上顯示的名字
export const DEPARTMENTS = [
    { key: 'PRODUCT', name: '商品部' },
    { key: 'ORDER',   name: '訂單物流' },
    { key: 'CS',      name: '客服' },
    { key: 'MKT',     name: '行銷' },
    { key: 'ADMIN',   name: '系統管理' },
];

// 折價券的自動發送時機：key 要跟後端 enum CouponAutoTrigger 一樣，name 是畫面上顯示的名字
export const COUPON_TRIGGERS = [
    { key: 'SIGNUP',      name: '註冊禮' },
    { key: 'BIRTHDAY',    name: '生日禮' },
];

// 預約發送的狀態：key 要跟後端 enum CouponScheduleStatus 一樣，name 是畫面上顯示的名字，color 是狀態文字的顏色
export const COUPON_SCHEDULE_STATUSES = [
    { key: 'PENDING',   name: '等待中', color: 'text-[#9a6b1f]' },
    { key: 'SENT',      name: '已發送', color: 'text-[#2f6b3a]' },
    { key: 'FAILED',    name: '未發送', color: 'text-[#b0413e]' },
    { key: 'CANCELLED', name: '已取消', color: 'text-muted' },
];

// 會員拿到的券是怎麼來的：key 要跟後端 enum CouponSource 一樣，name 是畫面上顯示的名字
export const COUPON_SOURCES = [
    { key: 'MANUAL',   name: '手動發券' },
    { key: 'SIGNUP',   name: '自動：註冊禮' },
    { key: 'BIRTHDAY', name: '自動：生日禮' },
];

// 會員拿到的券現在的狀態：key 要跟後端 enum MemberCouponStatus 一樣，name 是畫面上顯示的名字，color 是狀態文字的顏色
export const MEMBER_COUPON_STATUSES = [
    { key: 'USABLE',  name: '可使用', color: 'text-[#2f6b3a]' },
    { key: 'USED',    name: '已使用', color: 'text-muted' },
    { key: 'EXPIRED', name: '已過期', color: 'text-[#b0413e]' },
];

/** 折價券折扣的文字：AMOUNT → 折 100 元；PERCENT → 10% off（打 9 折） */
export function discountText(coupon) {
    return coupon.type === 'AMOUNT'
        ? `折 ${coupon.value} 元`
        : `${coupon.value}% off（打 ${(100 - coupon.value) / 10} 折）`;
}

// 員工登入資料存在 localStorage 的 key；AdminLogin.jsx 登入成功時存，用到的地方直接 localStorage.getItem 讀，登出時 clearAdminSession() 刪
// 不用 try/catch：後台每一頁都要登入，瀏覽器不讓用 localStorage 時本來就不能用，直接出錯比較好查
export const ADMIN_TOKEN_KEY = 'adminToken';
export const ADMIN_NAME_KEY = 'adminName';
export const ADMIN_DEPT_KEY = 'adminDept';
export const ADMIN_ACCOUNT_KEY = 'adminAccount';

/** 讀取目前登入員工的 token。 */
export function getAdminToken() {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
}

/** 後端的 LocalDateTime：2026-10-15T09:12:30 → 2026/10/15 09:12；沒有值（例如還沒登入過）顯示 — */
export function fmtDateTime(s) {
    return s ? String(s).slice(0, 16).replace('T', ' ').replace(/-/g, '/') : '—';
}

/** 呼叫後台 API：跟 kinu.js 的 api() 一樣，只是帶的是員工 token */
export function adminApi(path, options = {}) {
    return api(path, { ...options, token: getAdminToken() });
}

/** 員工登出：四個都刪掉 */
export function clearAdminSession() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_NAME_KEY);
    localStorage.removeItem(ADMIN_DEPT_KEY);
    localStorage.removeItem(ADMIN_ACCOUNT_KEY);
}