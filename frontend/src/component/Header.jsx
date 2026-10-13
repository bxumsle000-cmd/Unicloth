import { useState, useEffect, useRef } from 'react'
import { MdClose, MdMenu } from "react-icons/md";
import { api } from "../js/kinu.js";
import MegaMenu from "./MegaMenu.jsx";
import MobileMenu from "./MobileMenu.jsx";
import HeaderActions from "./HeaderActions.jsx";
import {Link} from "react-router-dom";
import { useLanguage } from "../js/i18n.js";

function Header () {
    /** 導覽列的三個分類，對應資料庫第 1 層分類的 code */
    const TOP_CATEGORIES = [
        { code: 'all_women', i18n: 'women' },
        { code: 'all_men', i18n: 'men' },
        { code: 'all_kids', i18n: 'kids' }
    ];
    const { t } = useLanguage();

    // 分類選單：menu 是 /api/categories 的整棵分類樹，只抓一次
    const [menu, setMenu] = useState([]);
    useEffect(() => {
        api('/api/categories').then(setMenu);
    }, []);

    // 目前展開哪個第 1 層分類的 code，null 代表收起
    const [openCode, setOpenCode] = useState(null);
    const openTop = menu.find((top) => top.code === openCode);

    // 手機版選單是否打開
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    /** 收起分類選單（電腦版、手機版都收） */
    function closeMenu() {
        setOpenCode(null);
        setMobileMenuOpen(false);
    }

    // 點 Header 和選單以外的地方就收起來
    const headerAreaRef = useRef(null);
    useEffect(() => {
        if (!openCode && !mobileMenuOpen) return;
        function closeOnOutsideClick(e) {
            if (!headerAreaRef.current.contains(e.target)) closeMenu();
        }
        document.addEventListener('click', closeOnOutsideClick);
        return () => document.removeEventListener('click', closeOnOutsideClick);
    }, [openCode, mobileMenuOpen]);

    return (
        <>
        <div className="flex h-8 items-center justify-center bg-black font-kinu text-white text-[10px] tracking-[.12em]">
            {t('topBanner')}
        </div>

        <div ref={headerAreaRef} className="relative font-kinu">
        <header className="grid h-[82px] grid-cols-[1fr_auto_1fr] items-center border-b border-line bg-paper px-[5.5%]
                           max-[760px]:h-auto max-[760px]:min-h-[65px] max-[760px]:gap-y-2 max-[760px]:px-[4%] max-[760px]:py-2.5">
            {/* 左：分類 */}
            <div className="flex items-center gap-[26px] max-[760px]:hidden">
                {TOP_CATEGORIES.map((top) => (
                    <button key={top.code} onClick={() => setOpenCode(openCode === top.code ? null : top.code)}
                            className={`border-b py-2.5 text-[11px] tracking-[.08em] whitespace-nowrap
                                        ${openCode === top.code ? "border-black" : "border-transparent"}`}>
                        {t(top.i18n)}
                    </button>
                ))}
            </div>
            {/* 手機版：分類收進漢堡選單按鈕（電腦版隱藏） */}
            <button aria-label={mobileMenuOpen ? t('closeMenu') : t('menu')} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="-ml-[7px] hidden size-11 place-items-center max-[760px]:grid">
                {mobileMenuOpen ? <MdClose className="size-5" /> : <MdMenu className="size-5" />}
            </button>

            {/* 分類選單 */}
            {openTop && <MegaMenu top={openTop} closeMenu={closeMenu} />}
            {mobileMenuOpen && <MobileMenu menu={menu} closeMenu={closeMenu} />}

            {/* 中：Logo */}
            <Link onClick={closeMenu} to="/">
            <img src="/img/logo.png" alt="KINU" className="block h-auto w-[119px] justify-self-center mix-blend-multiply max-[760px]:w-[96px]" />
            </Link>

            {/* 右：搜尋、天氣、各功能 */}
            <HeaderActions />
        </header>
        </div>
        </>
    )
}
export default Header;
