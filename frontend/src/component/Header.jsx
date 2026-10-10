import { useState, useEffect, useRef } from 'react'
import { MdLanguage, MdMenu } from "react-icons/md";
import { api } from "../js/kinu.js";
import MegaMenu from "./MegaMenu.jsx";
import {Link} from "react-router-dom";

function Header () {
    /** 導覽列的三個分類，對應資料庫第 1 層分類的 code */
    const TOP_CATEGORIES = [
        { code: 'all_women', i18n: 'women', label: '女裝' },
        { code: 'all_men', i18n: 'men', label: '男裝' },
        { code: 'all_kids', i18n: 'kids', label: '兒童' }
    ];

    const [temp, setTemp] = useState(27)
    useEffect(()=>{
        fetch('https://api.open-meteo.com/v1/forecast?latitude=25.033&longitude=121.5654&current=temperature_2m&timezone=Asia%2FTaipei')
        .then(res => res.json())
        .then(data => setTemp(Math.round(data.current.temperature_2m)))
    }, [])

    // 分類選單：menu 是 /api/categories 的整棵分類樹，只抓一次
    const [menu, setMenu] = useState([]);
    useEffect(() => {
        api('/api/categories').then(setMenu);
    }, []);

    // 目前展開哪個第 1 層分類的 code，null 代表收起
    const [openCode, setOpenCode] = useState(null);
    const openTop = menu.find((top) => top.code === openCode);

    /** 收起分類選單 */
    function closeMenu() {
        setOpenCode(null);
    }

    // 點 Header 和選單以外的地方就收起來
    const headerAreaRef = useRef(null);
    useEffect(() => {
        if (!openCode) return;
        function closeOnOutsideClick(e) {
            if (!headerAreaRef.current.contains(e.target)) setOpenCode(null);
        }
        document.addEventListener('click', closeOnOutsideClick);
        return () => document.removeEventListener('click', closeOnOutsideClick);
    }, [openCode]);

    return (
        <>
        <div className="flex h-8 items-center justify-center bg-black text-white text-[10px] tracking-[.12em] ">
            全館滿 NT$2,500，享免運服務　·　新會員首購 95 折
        </div>

        <div ref={headerAreaRef} className="relative">
        <header className="grid h-[82px] grid-cols-[1fr_auto_1fr] items-center border-b border-[#dfd9d2] bg-[#F6F5F2] px-[5.5%]
                           max-[760px]:h-auto max-[760px]:min-h-[65px] max-[760px]:gap-y-2 max-[760px]:px-[4%] max-[760px]:py-2.5">
            {/* 左：分類 */}
            <div className="flex items-center gap-[25px] max-[760px]:hidden">
                {TOP_CATEGORIES.map((top) => (
                    <button key={top.code} onClick={() => setOpenCode(openCode === top.code ? null : top.code)}
                            className={`border-b py-2.5 text-[15px] tracking-[.08em] whitespace-nowrap
                                        ${openCode === top.code ? "border-black" : "border-transparent"}`}>
                        {top.label}
                    </button>
                ))}
            </div>
            {/* 手機版：分類收進漢堡選單按鈕（電腦版隱藏） */}
            <button aria-label="選單" className="hidden size-[30px] place-items-center max-[760px]:grid">
                <MdMenu className="size-5" />
            </button>

            {/* 分類選單 */}
            {openTop && <MegaMenu top={openTop} closeMenu={closeMenu} />}

            {/* 中：Logo */}
            <Link onClick={closeMenu} to="/">
            <img src="/img/logo.png" alt="KINU" className="block h-auto w-[119px] justify-self-center mix-blend-multiply max-[760px]:w-[96px]" />
            </Link>

            {/* 右：搜尋、天氣、各功能 */}
            <div className="flex items-center justify-end gap-[20px]
                            max-[760px]:col-span-full max-[760px]:justify-center max-[760px]:gap-[clamp(8px,2.5vw,14px)]">
                <input type="search" placeholder="搜尋商品"
                       className="w-[118px] border-b border-[#a39d97]  py-1.5 text-[10px] tracking-[.06em]
                       outline-none transition-all focus:w-[150px] focus:border-black
                       max-[760px]:w-[84px] max-[760px]:focus:w-[110px]"/>

                <div className="text-[15px] whitespace-nowrap text-[#36322e] max-[760px]:text-[10px]">台北 {temp}°</div>
                <button className="py-[7px] text-[15px] tracking-[.12em] whitespace-nowrap max-[760px]:text-[9px]">收藏</button>
                <button className="py-[7px] text-[15px] tracking-[.12em] whitespace-nowrap max-[760px]:text-[9px]">購物車</button>
                <button className="py-[7px] text-[15px] tracking-[.12em] whitespace-nowrap max-[760px]:text-[9px]">折價券</button>
                <button className="py-[7px] text-[15px] tracking-[.12em] whitespace-nowrap max-[760px]:text-[9px]">訂單</button>
                <button className="py-[7px] text-[15px] tracking-[.12em] whitespace-nowrap max-[760px]:text-[9px]">會員</button>
                <button aria-label="選擇語言" className="grid size-8 place-items-center">
                    <MdLanguage className="size-5" />
                </button>
            </div>
        </header>
        </div>
        </>
    )
}
export default Header;
