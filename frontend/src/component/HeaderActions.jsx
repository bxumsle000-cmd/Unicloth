import { useState, useEffect, useRef } from 'react'
import { MdLanguage } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import {api} from "../js/kinu.js";
import { LANGUAGES, useLanguage } from "../js/i18n.js";

/** Header 右邊：搜尋、天氣、各功能 */
function HeaderActions() {
    const { t, language, setLanguage } = useLanguage();

    // 語言選單：點地球打開，選了語言或點選單以外的地方就收起來
    const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
    const languageMenuRef = useRef(null);
    useEffect(() => {
        if (!languageMenuOpen) return;
        function closeOnOutsideClick(e) {
            if (!languageMenuRef.current.contains(e.target)) setLanguageMenuOpen(false);
        }
        document.addEventListener('click', closeOnOutsideClick);
        return () => document.removeEventListener('click', closeOnOutsideClick);
    }, [languageMenuOpen]);

    /** 選了某個語言：切換並收起選單 */
    function chooseLanguage(code) {
        setLanguage(code);
        setLanguageMenuOpen(false);
    }

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

    const actionClass= "py-[7px] text-[10px] tracking-[.06em] whitespace-nowrap max-[760px]:text-[9px]"
    const countClass = "ml-0.5 text-[9px] text-[#9a948d] max-[760px]:text-[8px]"

    return (
        <div className="flex items-center justify-end gap-[17px]
                        max-[760px]:col-span-full max-[760px]:justify-center max-[760px]:gap-[clamp(8px,2.5vw,14px)]">
            <form onSubmit={submitSearch} role="search">
                <input type="search" placeholder={t('searchPlaceholder')} value={keyword}
                       onChange={(e) => setKeyword(e.target.value)}
                       className="w-[118px] border-b border-[#a39d97]  py-1.5 text-[10px] tracking-[.06em]
                       outline-none transition-all focus:w-[150px] focus:border-black
                       max-[760px]:w-[84px] max-[760px]:focus:w-[110px]"/>
            </form>

            <div className="text-[10px] whitespace-nowrap text-[#36322e] max-[760px]:text-[9px]">{t('taipei')} {temp}°</div>
            <Link to={"/wishlist"} className={actionClass}>{t('wishlist')}<span className={countClass}>{wishCount}</span></Link>
            <Link to={"/cart"} className={actionClass}>{t('cart')}<span className={countClass}>{cartCount}</span></Link>
            <Link to={"/coupons"} className={actionClass}>{t('coupons')}</Link>
            <Link to={"/orders"} className={actionClass}>{t('orders')}</Link>
            <button className={actionClass}>{t('member')}</button>
            <div ref={languageMenuRef} className="relative">
                <button aria-label={t('chooseLanguage')} aria-expanded={languageMenuOpen}
                        onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                        className="grid size-8 place-items-center">
                    <MdLanguage className="size-5" />
                </button>
                {languageMenuOpen && (
                    <ul className="absolute right-0 top-full z-50 min-w-[110px] border border-[#dfd9d2] bg-[#F6F5F2] py-1.5">
                        {LANGUAGES.map((lang) => (
                            <li key={lang.code}>
                                <button onClick={() => chooseLanguage(lang.code)}
                                        className={`block w-full px-4 py-2 text-left text-[11px] tracking-[.06em] whitespace-nowrap hover:bg-[#ebe7e1]
                                                    ${lang.code === language ? "text-black" : "text-[#76716c]"}`}>
                                    {lang.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

export default HeaderActions;
