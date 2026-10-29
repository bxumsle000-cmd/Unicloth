import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { clearToken } from './kinu.js';

/**
 * Firebase 設定：值來自 frontend/.env（全組共用，有進 git）；想換成自己的專案可以用 .env.local 覆蓋。
 * 這些值會被打包進前端給瀏覽器下載，本來就是公開的，不是機密。
 */
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** 有沒有讀到設定值；沒有就不要初始化，不然一載入就報錯 */
export const firebaseReady = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

const auth = firebaseReady ? getAuth(initializeApp(firebaseConfig)) : null;

/**
 * 跳出 Google 登入視窗，成功後回傳 Firebase 的 ID token（要送給後端 /api/auth/firebase 換我們的 JWT）。
 * 使用者自己關掉視窗時會丟錯誤，code 是 auth/popup-closed-by-user。
 */
export async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    // 每次都讓使用者選帳號：不加的話，瀏覽器裡只登入一個 Google 帳號時，Google 會直接用它登入
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    return result.user.getIdToken();
}

/**
 * Google 帳號的名字，給補填資料頁當預設值；沒登入 Firebase 或沒設定時回空字串。
 * 重新整理後 Firebase 要一點時間才會恢復登入狀態，所以先等 authStateReady()。
 */
export async function getGoogleName() {
    if (!auth) return '';
    await auth.authStateReady();
    return auth.currentUser?.displayName ?? '';
}

/**
 * 登出 Firebase。只會登出我們的網站，瀏覽器裡的 Google 帳號還是登入狀態；
 * 下次登入會問要用哪個帳號，是因為 signInWithGoogle() 加了 prompt: 'select_account'。
 */
export async function signOutFirebase() {
    if (auth) await signOut(auth);
}

/**
 * 會員登出：JWT 後端不記狀態，前端把 token 刪掉就等於登出；
 * 整頁重新載入讓各處的數量（收藏、購物車）歸零。
 */
export async function logoutMember() {
    clearToken();
    await signOutFirebase().catch(() => {});
    window.location.href = '/';
}
