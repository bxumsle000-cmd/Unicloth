import { useState, useEffect } from 'react'
import { MdLanguage } from "react-icons/md";
import { Link } from "react-router-dom";

/** Header 右邊：搜尋、天氣、各功能 */
function HeaderActions() {
    const [temp, setTemp] = useState(27)
    useEffect(()=>{
        fetch('https://api.open-meteo.com/v1/forecast?latitude=25.033&longitude=121.5654&current=temperature_2m&timezone=Asia%2FTaipei')
        .then(res => res.json())
        .then(data => setTemp(Math.round(data.current.temperature_2m)))
    }, [])

    const actionClass= "py-[7px] text-[15px] tracking-[.12em] whitespace-nowrap max-[760px]:text-[9px]"

    return (
        <div className="flex items-center justify-end gap-[20px]
                        max-[760px]:col-span-full max-[760px]:justify-center max-[760px]:gap-[clamp(8px,2.5vw,14px)]">
            <input type="search" placeholder="搜尋商品"
                   className="w-[118px] border-b border-[#a39d97]  py-1.5 text-[10px] tracking-[.06em]
                   outline-none transition-all focus:w-[150px] focus:border-black
                   max-[760px]:w-[84px] max-[760px]:focus:w-[110px]"/>

            <div className="text-[15px] whitespace-nowrap text-[#36322e] max-[760px]:text-[10px]">台北 {temp}°</div>
            <Link to={"/wishlist"} className={actionClass}>收藏</Link>
            <button className={actionClass}>購物車</button>
            <button className={actionClass}>折價券</button>
            <button className={actionClass}>訂單</button>
            <button className={actionClass}>會員</button>
            <button aria-label="選擇語言" className="grid size-8 place-items-center">
                <MdLanguage className="size-5" />
            </button>
        </div>
    )
}

export default HeaderActions;
