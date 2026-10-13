import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

/**
 * Firebase 設定：值來自 frontend/.env.local（不進 git），欄位見 .env.example。
 * 這些值會被打包進前端給瀏覽器下載，本來就是公開的，不是機密。
 */
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** 有沒有填 .env.local；沒填就不要初始化，不然一載入就報錯 */
export const firebaseReady = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

const auth = firebaseReady ? getAuth(initializeApp(firebaseConfig)) : null;

/**
 * 跳出 Google 登入視窗，成功後回傳 Firebase 的 ID token（要送給後端 /api/auth/firebase 換我們的 JWT）。
 * 使用者自己關掉視窗時會丟錯誤，code 是 auth/popup-closed-by-user。
 */
export async function signInWithGoogle() {
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    return result.user.getIdToken();
}

/** 登出 Firebase；之後按 Google 登入才會重新問要用哪個帳號 */
export async function signOutFirebase() {
    if (auth) await signOut(auth);
}
