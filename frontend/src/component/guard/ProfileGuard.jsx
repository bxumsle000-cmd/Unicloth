import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../../js/api.js";
import { getToken } from "../../js/auth.js";
import { logoutMember } from "../../js/firebase.js";

/**
 * 路由守衛：已登入但還沒補填個人資料，又離開了 /complete-profile，就當成不想填，直接登出。
 * 下次再用 Google 登入，Login 頁會再帶去補填。
 * 只有前端擋可以被繞過，所以後端 SecurityConfig 也會擋（沒補填打其他 API 回 403）。
 */
function ProfileGuard() {
    const location = useLocation();

    // "checking" = 還在問後端；"incomplete" = 沒補填；"ok" = 不用擋（已補填，或沒登入不用問）
    const [profileStatus, setProfileStatus] = useState(getToken() ? "checking" : "ok");
    useEffect(() => {
        if (!getToken()) return;
        api('/api/member/me')
            .then((me) => setProfileStatus(me.profileCompleted ? "ok" : "incomplete"))
            // 查不到（例如 token 過期）就不擋，交給各頁面自己顯示錯誤
            .catch(() => setProfileStatus("ok"));
    }, []);

    const leftWithoutProfile = profileStatus === "incomplete" && location.pathname !== "/complete-profile";
    useEffect(() => {
        if (!leftWithoutProfile) return;
        logoutMember();
    }, [leftWithoutProfile]);

    // 只負責檢查和登出，不用畫任何畫面
    return null;
}

export default ProfileGuard;
