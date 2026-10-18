/**
 * 後台共用的東西。
 * 員工的 token 跟會員的 token（kinu.js 的 'token'）分開存：
 * 員工 token 不能打會員 API，混在一起的話前台 Header 會以為會員登入了。
 */

// 五個部門：key 要跟後端 enum Department 一樣（登入時直接送給後端），name 是畫面上顯示的名字
export const DEPARTMENTS = [
    { key: 'PRODUCT', name: '商品部' },
    { key: 'ORDER',   name: '訂單物流' },
    { key: 'CS',      name: '客服' },
    { key: 'MKT',     name: '行銷' },
    { key: 'ADMIN',   name: '管理者' },
];

/** 部門首頁的網址，例如 PRODUCT → /admin/product */
export function deptHomePath(deptKey) {
    return '/admin/' + deptKey.toLowerCase();
}

const ADMIN_TOKEN_KEY = 'adminToken';
const ADMIN_NAME_KEY = 'adminName';
const ADMIN_DEPT_KEY = 'adminDept';

/** 員工登入成功時存 token、姓名、部門（下一頁顯示「XXX 您好」、決定進哪個部門用） */
export function setAdminSession({ token, name, department }) {
    try {
        localStorage.setItem(ADMIN_TOKEN_KEY, token);
        localStorage.setItem(ADMIN_NAME_KEY, name);
        localStorage.setItem(ADMIN_DEPT_KEY, department);
    } catch {
        // 不能存就只是重新整理後要再登入一次
    }
}

/** 讀員工 token；沒登入、或瀏覽器不讓用 localStorage 時回 null */
export function getAdminToken() {
    try {
        return localStorage.getItem(ADMIN_TOKEN_KEY);
    } catch {
        return null;
    }
}

/** 員工登出：三個都刪掉 */
export function clearAdminSession() {
    try {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(ADMIN_NAME_KEY);
        localStorage.removeItem(ADMIN_DEPT_KEY);
    } catch {
        // 同上
    }
}
