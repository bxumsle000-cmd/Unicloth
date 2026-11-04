import { getToken } from "./auth.js";

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
