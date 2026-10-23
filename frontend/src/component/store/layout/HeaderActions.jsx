import { useState, useEffect } from 'react'
import { Link, useNavigate } from "react-router-dom";
import {api, getToken, clearToken} from "../../../js/kinu.js";
import { signOutFirebase } from "../../../js/firebase.js";
import { useLanguage } from "../../../js/i18n.js";
import LanguageMenu from "./LanguageMenu.jsx";

/** Header 右邊：搜尋、天氣、各功能 */
function HeaderActions() {
    const { t } = useLanguage();

    const [temp, setTemp] = useState(27)
    useEffect(()=>{
        fetch('https://api.open-meteo.com/v1/forecast?latitude=25.033&longitude=121.5654&current=temperature_2m&timezone=Asia%2FTaipei')
            .then(res => res.json())
            .then(data => setTemp(Math.round(data.current.temperature_2m)))
    }, [])

    const [wishCount, setWishCount] = useState(0);
    useEffect(() => {
        api('/api/wishlist').then(list => setWishCount(list.length)).catch(() => {});
    }, []);

    const [cartCount, setCartCount] = useState(0);
    useEffect(() => {
        api('/api/cart')
            .then(cartItemList => setCartCount(cartItemList.reduce((sum, item) => sum + item.qty, 0)))
            .catch(() => {});
    }, []);

    // 搜尋：按 Enter 送出表單，關鍵字放在網址上（重新整理、上一頁都還在）
    const [keyword, setKeyword] = useState("");
    const navigate = useNavigate();
    function submitSearch(e) {
        e.preventDefault();   // 不讓表單照瀏覽器預設的方式重新載入整頁
        const trimmedKeyword = keyword.trim();
        if (!trimmedKeyword) return;
        navigate(`/search?keyword=${encodeURIComponent(trimmedKeyword)}`);
    }

    // JWT 後端不記狀態：前端把 token 刪掉就等於登出；整頁重新載入讓各處的數量歸零
    const loggedIn = Boolean(getToken());
    async function logout() {
        clearToken();
        await signOutFirebase().catch(() => {});
        window.location.href = '/';
    }

    const actionClass = "py-[7px] text-[10px] tracking-[.06em] whitespace-nowrap max-[760px]:text-[9px]"
    const countClass = "ml-0.5 text-[9px] text-[#9a948d] max-[760px]:text-[8px]"

    return (
        <div className="flex flex-wrap items-center justify-end gap-[17px] max-[760px]:col-span-full max-[760px]:justify-center max-[760px]:gap-[clamp(8px,2.5vw,14px)]">
            <form onSubmit={submitSearch} role="search">
                <input
                    type="search"
                    placeholder={t('searchPlaceholder')}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="w-[118px] border-b border-[#a39d97] py-1.5 text-[10px] tracking-[.06em] outline-none transition-all focus:w-[150px] focus:border-black max-[760px]:w-[84px] max-[760px]:focus:w-[110px]"
                />
            </form>

            <div className="text-[10px] whitespace-nowrap text-[#36322e] max-[760px]:text-[9px]">
                {t('taipei')} {temp}°
            </div>

            <Link to={"/wishlist"} className={actionClass}>
                {t('wishlist')}<span className={countClass}>{wishCount}</span>
            </Link>

            <Link to={"/cart"} className={actionClass}>
                {t('cart')}<span className={countClass}>{cartCount}</span>
            </Link>

            <Link to={"/coupons"} className={actionClass}>{t('coupons')}</Link>
            <Link to={"/orders"} className={actionClass}>{t('orders')}</Link>

            {/* 僅會員登入後顯示；位置固定在訂單右側、登出左側。 */}
            {loggedIn && (
                <Link to={"/support"} className={actionClass}>
                    <span className="max-[760px]:hidden">客服中心</span>
                    <span className="hidden max-[760px]:inline">客服</span>
                </Link>
            )}

            {loggedIn
                ? <button onClick={logout} className={actionClass}>{t('logout')}</button>
                : <Link to={"/login"} className={actionClass}>{t('login')}</Link>}

            <LanguageMenu />
        </div>
    )
}

export default HeaderActions;