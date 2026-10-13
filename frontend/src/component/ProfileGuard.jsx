import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { api, getToken, clearToken } from "../js/kinu.js";
import { signOutFirebase } from "../js/firebase.js";

/**
 * 路由守衛：已登入但還沒補填個人資料，又離開了 /complete-profile，就當成不想填，直接登出。
 * 下次再用 Google 登入，Login 頁會再帶去補填。
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

    const leftWithoutProfile = profileCompleted === false && location.pathname !== "/complete-profile";
    useEffect(() => {
        if (!leftWithoutProfile) return;
        clearToken();
        // 整頁重新載入：Header 等地方才會變回未登入的樣子
        signOutFirebase().catch(() => {}).finally(() => window.location.reload());
    }, [leftWithoutProfile]);

    // 還不知道結果、或正在登出，先不畫頁面，避免一閃而過，或頁面先打 API 被後端回 403
    if (profileCompleted === null || leftWithoutProfile) return null;
    return children;
}

export default ProfileGuard;
