import { Link } from "react-router-dom";
import { imgSrc } from "../js/kinu.js";

/**
 * 分類下拉選單：top 是 /api/categories 回來的其中一個第 1 層分類（女裝、男裝、兒童）
 * 點了任何連結就呼叫 closeMenu，讓 Header 把選單收起來
 * 位置用 absolute 貼在 Header 正下方，所以外層要有 relative
 */
function MegaMenu({ top, closeMenu }) {
    return (
        <div className="absolute inset-x-0 top-full z-40 border-b border-[#dfd9d2] bg-[#F6F5F2] px-[5.5%] pt-7 pb-9
                        max-[760px]:px-[4%]">
            {/* 標題、瀏覽全部 */}
            <div className="mb-6 flex items-baseline justify-between">
                <div className="text-lg tracking-[.08em]">{top.name}</div>
                <Link to={`/category/${top.code}`} onClick={closeMenu}
                      className="text-[11px] tracking-[.12em] text-[#76716c] transition hover:text-black">
                    瀏覽全部 <span className="ml-2">↗</span>
                </Link>
            </div>

            {/* 第 2 層分類 */}
            <div className="grid grid-cols-8 gap-x-5 gap-y-6 max-[1100px]:grid-cols-4 max-[760px]:grid-cols-3 max-[760px]:gap-x-3">
                {top.children.map((child) => (
                    <Link key={child.code} to={`/category/${child.code}`} onClick={closeMenu}
                          className="group flex flex-col items-center gap-2.5 text-center">
                            {child.iconUrl && (
                                <img src={imgSrc(child.iconUrl)} alt="" loading="lazy"
                                     className="size-[8rem] mix-blend-multiply
                                     transition-transform duration-500 group-hover:scale-[1.1]" />
                            )}
                        <span className="text-[11px]">{child.name}</span>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default MegaMenu;
