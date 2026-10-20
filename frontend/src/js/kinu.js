/**
 * 呼叫後端 API，回傳解析好的 JSON。
 * 失敗時丟出 Error，message 是後端 ErrorResponse 的 message（例如「不能超過庫存數量」）。
 * 用法：const cart = await api('/api/cart');
 *       await api('/api/cart', { method: 'POST', body: { variantId: 1, qty: 1 } });
 * 有登入（localStorage 有 token）就自動帶上 Authorization header；
 * 要用別的 token（例如後台員工 token）就傳 options.token，見 admin.js 的 adminApi()。
 */
export async function api(path, options = {}) {
    const opt = { method: options.method || 'GET', headers: {} };
    const token = options.token ?? getToken();
    if (token) {
        opt.headers['Authorization'] = 'Bearer ' + token;
    }
    if (options.body !== undefined) {
        opt.headers['Content-Type'] = 'application/json';
        opt.body = JSON.stringify(options.body);
    }
    const res = await fetch(path, opt);
    if (!res.ok) {
        let message = '連線發生問題（' + res.status + '），請稍後再試';
        try {
            const err = await res.json();
            if (err.message) message = err.message;
        } catch {
            // 回應不是 JSON（例如伺服器掛掉回 HTML），就用上面預設的 message
        }
        throw new Error(message);
    }
    const text = await res.text();          // 204 No Content 沒有內容
    return text ? JSON.parse(text) : null;
}

// 登入後後端回傳的 JWT 存在這個 key；登入存、登出刪
const TOKEN_KEY = 'token';

/** 讀登入 token；沒登入、或瀏覽器不讓用 localStorage 時回 null */
export function getToken() {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

/** 登入成功時存 token */
export function setToken(token) {
    try {
        localStorage.setItem(TOKEN_KEY, token);
    } catch {
        // 不能存就只是重新整理後要再登入一次
    }
}

/** 登出時刪 token（JWT 後端不記狀態，前端刪掉就等於登出） */
export function clearToken() {
    try {
        localStorage.removeItem(TOKEN_KEY);
    } catch {
        // 同上
    }
}

/** 990 → NT$990；12500 → NT$12,500 */
export function money(n) {
    return 'NT$' + Number(n).toLocaleString('en-US');
}

/** 後端存的是相對路徑 img/products/...，前面補 / 讓每一頁都找得到 */
export function imgSrc(url) {
    return url ? '/' + url.replace(/^\//, '') : '';
}

/** 畫面下方跳出提示，幾秒後自動消失 */
export function toast(message, isError = false) {
    let el = document.getElementById('toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'toast';
        el.className = 'toast';
        document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.toggle('error', isError);
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 2600);
}

/** 後端的 LocalDateTime：2026-10-29T23:18:36 → 2026/10/29 */
export function fmtDate(s) {
    return s ? String(s).slice(0, 10).replace(/-/g, '/') : '';
}
/** 字母尺寸由小到大；S/M、M/L 夾在中間 */
const LETTER_SIZES = ['XXS', 'XS', 'S', 'S/M', 'M', 'M/L', 'L', 'XL', 'XXL', '3XL', '4XL'];

/**
 * 尺寸排成固定順序，回傳新陣列（不改原本的）。
 * 順序：字母尺寸 → inch → cm → 其他有數字的（例如 75/80 AB）→ 其他 → ONE SIZE
 * 同一組裡依開頭的數字由小到大，例如 23cm → 23.5cm → 100cm
 */
export function sortSizes(sizes) {
    function group(size) {
        if (LETTER_SIZES.includes(size)) return 0;
        if (size === 'ONE SIZE') return 9;
        if (!/^\d/.test(size)) return 8;
        if (size.endsWith('inch')) return 1;
        if (size.endsWith('cm')) return 2;
        return 3;
    }
    return [...sizes].sort((a, b) => {
        const groupA = group(a), groupB = group(b);
        if (groupA !== groupB) return groupA - groupB;
        if (groupA === 0) return LETTER_SIZES.indexOf(a) - LETTER_SIZES.indexOf(b);
        const diff = parseFloat(a) - parseFloat(b);     // parseFloat 只讀開頭的數字，例如 "27-29cm" → 27
        if (diff) return diff;
        return a.localeCompare(b);                      // 數字一樣再比文字，例如 75/80 AB → 75/80 CD
    });
}

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
