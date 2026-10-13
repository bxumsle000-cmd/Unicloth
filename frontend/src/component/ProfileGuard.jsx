import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api, getToken } from "../js/kinu.js";

/**
 * 路由守衛：已登入但還沒補填個人資料，不管進哪一頁都導到 /complete-profile。
 * 只有前端擋可以被繞過，所以後端 SecurityConfig 也會擋（沒補填打其他 API 回 403）。
 */
function ProfileGuard({ children }) {
    const location = useLocation();

    // null = 還在問後端；沒登入就不用問，當成不用補填
    const [profileCompleted, setProfileCompleted] = useState(getToken() ? null : true);
    useEffect(() => {
        if (!getToken()) return;
        api('/api/member/me')
            .then((me) => setProfileCompleted(me.profileCompleted))
            // 查不到（例如 token 過期）就不擋，交給各頁面自己顯示錯誤
            .catch(() => setProfileCompleted(true));
    }, []);

    // 還不知道結果先不畫頁面，避免一閃而過，或頁面先打 API 被後端回 403
    if (profileCompleted === null) return null;

    if (!profileCompleted && location.pathname !== "/complete-profile") {
        return <Navigate to="/complete-profile" replace />;
    }
    return children;
}

export default ProfileGuard;
