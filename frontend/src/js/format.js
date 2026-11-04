/** 990 → NT$990；12500 → NT$12,500 */
export function money(n) {
    return 'NT$' + Number(n).toLocaleString('en-US');
}

/** 後端存的是相對路徑 img/products/...，前面補 / 讓每一頁都找得到 */
export function imgSrc(url) {
    return url ? '/' + url.replace(/^\//, '') : '';
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
