/**
 * 呼叫後端 API，回傳解析好的 JSON。
 * 失敗時丟出 Error，message 是後端 ErrorResponse 的 message（例如「不能超過庫存數量」）。
 * 用法：const cart = await api('/api/cart');
 *       await api('/api/cart', { method: 'POST', body: { variantId: 1, qty: 1 } });
 */
export async function api(path, options = {}) {
    const opt = { method: options.method || 'GET', headers: {} };
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
        } catch {}
        throw new Error(message);
    }
    const text = await res.text();          // 204 No Content 沒有內容
    return text ? JSON.parse(text) : null;
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
