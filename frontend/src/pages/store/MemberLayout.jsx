import { NavLink, Outlet } from "react-router-dom";
import { logoutMember } from "../../js/firebase.js";

const MENU_ITEMS = [
    { to: "/member", label: "會員資料", end: true },
    { to: "/member/recommendation-settings", label: "推薦設定", end: false },
];

const menuClass =
    "block border-l-2 py-2 pl-3 text-[12px] tracking-[.08em] transition-colors " +
    "max-[760px]:border-l-0 max-[760px]:border-b-2 max-[760px]:px-1 max-[760px]:pl-1";

/**
 * 會員中心外框：左邊選單，右邊用 <Outlet/> 放目前選到的子頁面。
 * 子頁面在 App.jsx 的 /member 底下設定。
 */
function MemberLayout() {
    return (
        <div className="px-[5.5%] pt-[38px] pb-[90px] font-kinu text-[#111]
                        max-[760px]:px-[4%] max-[760px]:pt-[26px]">
            <div className="mb-2 text-[10px] tracking-[.22em] text-[#76716c]">MY ACCOUNT</div>
            <h1 className="mb-8 text-[clamp(24px,3vw,34px)] font-medium tracking-[.08em]">會員中心</h1>

            <div className="flex gap-12 max-[760px]:block">
                <nav className="w-[160px] shrink-0 max-[760px]:mb-8 max-[760px]:flex max-[760px]:w-auto max-[760px]:gap-5 max-[760px]:border-b max-[760px]:border-[#d6d0c7]">
                    {MENU_ITEMS.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                menuClass + (isActive
                                    ? " border-black text-black"
                                    : " border-transparent text-[#76716c] hover:text-black")
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}

                    <button
                        type="button"
                        onClick={logoutMember}
                        className="mt-6 block border-l-2 border-transparent py-2 pl-3 text-left text-[12px] tracking-[.08em] text-[#76716c] transition-colors hover:text-black
                                   max-[760px]:mt-0 max-[760px]:ml-auto max-[760px]:border-l-0 max-[760px]:px-1"
                    >
                        登出
                    </button>
                </nav>

                <div className="min-w-0 flex-1">
                    <Outlet/>
                </div>
            </div>
        </div>
    );
}

export default MemberLayout;
