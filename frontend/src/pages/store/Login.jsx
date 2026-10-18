import { useState } from "react";
import { api, setToken, toast } from "../../js/kinu.js";
import { firebaseReady, signInWithGoogle } from "../../js/firebase.js";

function Login() {
    // 登入中先把按鈕鎖住，避免連按跳出好幾個視窗
    const [loading, setLoading] = useState(false);

    async function loginWithGoogle() {
        setLoading(true);
        try {
            // 1. Firebase 跳出 Google 登入視窗，拿到 Firebase 的 ID token
            const idToken = await signInWithGoogle();
            // 2. 送給後端驗證，換回我們自己的 JWT
            const { token, profileCompleted } = await api('/api/auth/firebase', { method: 'POST', body: { idToken } });
            setToken(token);
            // 整頁重新載入：Header 的購物車數量等等才會用新的登入狀態重抓；第一次登入要先去補填資料
            window.location.href = profileCompleted ? '/' : '/complete-profile';
        } catch (e) {
            // 使用者自己把 Google 視窗關掉，不算錯誤
            if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
                toast(e.message, true);
            }
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col items-center px-[5.5%] pt-[80px] pb-[120px]
                        max-[760px]:px-[4%] max-[760px]:pt-[50px] max-[760px]:pb-[80px]">
            <div className="mb-2 text-[10px] tracking-[.22em] text-[#76716c]">LOGIN</div>
            <h1 className="mb-3 text-[clamp(24px,3vw,34px)] font-medium tracking-[.08em]">會員登入</h1>
            <p className="mb-10 text-[11px] tracking-[.06em] text-[#76716c]">使用 Google 帳號登入，第一次登入會自動建立會員</p>

            <button onClick={loginWithGoogle} disabled={loading || !firebaseReady}
                    className="w-full max-w-[320px] border border-black bg-black px-4 py-3 text-[12px] tracking-[.12em] text-white
                               transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40">
                {loading ? "登入中…" : "使用 Google 登入"}
            </button>

            {!firebaseReady && (
                <p className="mt-4 text-[11px] tracking-[.04em] text-[#b0413e]">
                    尚未設定 Firebase：請確認 frontend/.env 有 Firebase 設定值，並重新啟動 npm run dev
                </p>
            )}
        </div>
    )
}

export default Login;
