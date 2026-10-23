import { useState } from "react";
import { Link } from "react-router-dom";
import { imgSrc } from "../../../js/kinu.js";

/**
 * 手機版分類選單：menu 是 Header 抓好的 /api/categories 整棵分類樹
 * 上排切換女裝、男裝、兒童，下面列出該分類的第 2 層
 * 點了任何連結就呼叫 closeMenu，讓 Header 把選單收起來
 * 電腦版（761px 以上）隱藏，避免拉寬視窗時殘留在畫面上
 */
function MobileMenu({ menu, closeMenu }) {
    // 目前選到哪個第 1 層分類的 code，null 代表還沒選，預設顯示第一個
    const [selectedCode, setSelectedCode] = useState(null);
    const selectedTop = menu.find((top) => top.code === selectedCode) ?? menu[0];

    if (!selectedTop) return null;

    return (
        <div className="absolute inset-x-0 top-full z-40 border-b border-[#dfd9d2] bg-[#F6F5F2] px-[4%] pb-8 min-[761px]:hidden">
            {/* 第 1 層分類切換 */}
            <div className="mb-6 flex gap-6 border-b border-[#dfd9d2]">
                {menu.map((top) => (
                    <button key={top.code} onClick={() => setSelectedCode(top.code)}
                            className={`-mb-px border-b py-3 text-[14px] tracking-[.08em]
                                        ${top.code === selectedTop.code ? "border-black" : "border-transparent text-[#76716c]"}`}>
                        {top.name}
                    </button>
                ))}
            </div>

            {/* 瀏覽全部 */}
            <Link to={`/category/${selectedTop.code}`} onClick={closeMenu}
                  className="mb-5 block text-right text-[11px] tracking-[.12em] text-[#76716c]">
                瀏覽全部{selectedTop.name} <span className="ml-2">↗</span>
            </Link>

            {/* 第 2 層分類 */}
            <div className="grid grid-cols-3 gap-x-3 gap-y-5">
                {selectedTop.children.map((child) => (
                    <Link key={child.code} to={`/category/${child.code}`} onClick={closeMenu}
                          className="flex flex-col items-center gap-2 text-center">
                        {child.iconUrl && (
                            <img src={imgSrc(child.iconUrl)} alt="" loading="lazy"
                                 className="size-[5rem] mix-blend-multiply" />
                        )}
                        <span className="text-[11px]">{child.name}</span>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default MobileMenu;
