import { useState, useEffect } from 'react'
import { MdLanguage } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import {api} from "../js/kinu.js";

/** Header 右邊：搜尋、天氣、各功能 */
function HeaderActions() {
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
                <input type="search" placeholder="搜尋商品" value={keyword}
                       onChange={(e) => setKeyword(e.target.value)}
                       className="w-[118px] border-b border-[#a39d97]  py-1.5 text-[10px] tracking-[.06em]
                       outline-none transition-all focus:w-[150px] focus:border-black
                       max-[760px]:w-[84px] max-[760px]:focus:w-[110px]"/>
            </form>

            <div className="text-[10px] whitespace-nowrap text-[#36322e] max-[760px]:text-[9px]">台北 {temp}°</div>
            <Link to={"/wishlist"} className={actionClass}>收藏<span className={countClass}>{wishCount}</span></Link>
            <Link to={"/cart"} className={actionClass}>購物車</Link>
            <Link to={"/coupons"} className={actionClass}>折價券</Link>
            <button className={actionClass}>訂單</button>
            <button className={actionClass}>會員</button>
            <button aria-label="選擇語言" className="grid size-8 place-items-center">
                <MdLanguage className="size-5" />
            </button>
        </div>
    )
}

export default HeaderActions;
