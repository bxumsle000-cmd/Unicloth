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