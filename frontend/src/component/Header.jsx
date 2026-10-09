import { useState, useEffect } from 'react'
import { MdLanguage } from "react-icons/md";

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
    } )
    return (
        <>
        <div className="flex h-8 items-center justify-center bg-black text-white text-[10px] tracking-[.12em] ">
            全館滿 NT$2,500，享免運服務　·　新會員首購 95 折
        </div>

        <header className="grid h-[82px] grid-cols-[1fr_auto_1fr] items-center border-b border-[#dfd9d2] bg-[#F6F5F2] px-[5.5%]">
            {/* 左：分類 */}
            <div className="flex items-center gap-[25px]">
                {TOP_CATEGORIES.map((top) => (
                    <button key={top.code} className="py-2.5 text-[15px] tracking-[.08em] whitespace-nowrap">{top.label}</button>
                ))}
            </div>

            {/* 中：Logo */}
            <img src="/img/logo.png" alt="KINU" className="block h-auto w-[119px] mix-blend-multiply" />

            {/* 右：搜尋、天氣、各功能 */}
            <div className="flex items-center justify-end gap-[17px] gap-[20px]">
                <input type="search" placeholder="搜尋商品"
                       className="w-[118px] border-b border-[#a39d97]  py-1.5 text-[10px] tracking-[.06em]
                       outline-none transition-all focus:w-[150px] focus:border-black"/>

                <div className="text-[15px] whitespace-nowrap text-[#36322e]">台北 {temp}°</div>
                <button className="py-[7px] text-[15px] tracking-[.12em] whitespace-nowrap">收藏</button>
                <button className="py-[7px] text-[15px] tracking-[.12em] whitespace-nowrap">購物車</button>
                <button className="py-[7px] text-[15px] tracking-[.12em] whitespace-nowrap">折價券</button>
                <button className="py-[7px] text-[15px] tracking-[.12em] whitespace-nowrap">訂單</button>
                <button className="py-[7px] text-[15px] tracking-[.12em] whitespace-nowrap">會員</button>
                <button aria-label="選擇語言" className="grid size-8 place-items-center">
                    <MdLanguage className="size-5" />
                </button>
            </div>
        </header>
        </>
    )
}
export default Header;
