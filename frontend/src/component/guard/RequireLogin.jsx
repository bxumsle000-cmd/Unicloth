import { Link } from "react-router-dom";
import { getToken } from "../../js/kinu.js";

/** 要登入才能看的頁面：沒登入就顯示提示，不畫頁面（頁面一畫就會打 API，被後端回 401） */
function RequireLogin({ children }) {
    if (getToken()) return children;

    return (
        <div className="flex flex-col items-center px-[5.5%] pt-[80px] pb-[120px]
                        max-[760px]:px-[4%] max-[760px]:pt-[50px] max-[760px]:pb-[80px]">
            <div className="mb-2 text-[10px] tracking-[.22em] text-[#76716c]">MEMBER ONLY</div>
            <h1 className="mb-3 text-[clamp(24px,3vw,34px)] font-medium tracking-[.08em]">請先登入會員</h1>
            <p className="mb-10 text-[11px] tracking-[.06em] text-[#76716c]">登入後才能使用這個頁面</p>

            <Link to="/login"
                  className="w-full max-w-[320px] border border-black bg-black px-4 py-3 text-center text-[12px] tracking-[.12em] text-white
                             transition-opacity hover:opacity-80">
                前往登入
            </Link>
        </div>
    )
}

export default RequireLogin;
