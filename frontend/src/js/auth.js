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
