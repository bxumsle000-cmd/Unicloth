import { createContext, useEffect, useState } from 'react'
import { api } from './kinu.js';

/** 在元件裡用：const { cartCount, refreshCart } = useContext(CountContext); */
// eslint-disable-next-line react-refresh/only-export-components
export const CountContext = createContext(null);

/**
 * 包在前台最外層，Header 的收藏、購物車數字放在這裡。
 * 其他頁面改了收藏或購物車，成功後呼叫 refreshWishlist() / refreshCart()，Header 就會跟著更新。
 */
export function CountProvider({ children }) {
    const [wishCount, setWishCount] = useState(0);
    const [cartCount, setCartCount] = useState(0);

    /** 重新查收藏數量；沒登入會失敗，就維持 0 */
    function refreshWishlist() {
        api('/api/wishlist')
            .then(list => setWishCount(list.length))
            .catch(() => {});
    }

    /** 重新查購物車數量（每件的 qty 加總）；沒登入會失敗，就維持 0 */
    function refreshCart() {
        api('/api/cart')
            .then(cartItemList => setCartCount(cartItemList.reduce((sum, item) => sum + item.qty, 0)))
            .catch(() => {});
    }

    // 一進網站先查一次
    useEffect(() => {
        refreshWishlist();
        refreshCart();
    }, []);

    return (
        <CountContext.Provider value={{ wishCount: wishCount, cartCount: cartCount, refreshWishlist: refreshWishlist, refreshCart: refreshCart }}>
            {children}
        </CountContext.Provider>
    );
}
