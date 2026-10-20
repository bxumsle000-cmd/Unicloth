import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ADMIN_ACCOUNT_KEY, ADMIN_DEPT_KEY, ADMIN_NAME_KEY, ADMIN_TOKEN_KEY, DEPARTMENTS } from "../../js/admin.js";
import { api, toast } from "../../js/kinu.js";

// 測試用員工帳號（資料來自 db/migration 的 V5、V8），密碼都是 Test1234；只在開發模式（npm run dev）顯示在畫面上
const TEST_ACCOUNTS = { PRODUCT: 'product01', ORDER: 'order01', CS: 'cs01', MKT: 'mkt01', ADMIN: 'sys01' };
const TEST_PASSWORD = 'Test1234';

function AdminLogin() {
    const navigate = useNavigate();
    // 每次進來都預設第一個部門
    const [selectedDept, setSelectedDept] = useState(DEPARTMENTS[0].key);
    // 登入中先把按鈕鎖住，避免連按送出好幾次
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault(); // 不要讓表單真的送出、重新整理頁面

        // 送出時才從表單讀帳號密碼，不用每打一個字就存進 state
        const formData = new FormData(event.target);
        const trimmedAccount = formData.get('account').trim();
        const password = formData.get('password');
        if (!trimmedAccount || !password) {
            toast('請輸入帳號和密碼', true);
            return;
        }

        setLoading(true);
        try {
            // 帳密錯、停用、部門不對，後端都會回 message，api() 會把它丟成 Error
            const data = await api('/api/admin/auth/login', {
                method: 'POST',
                body: { account: trimmedAccount, password: password, department: selectedDept },
            });
            // 存 token、姓名、部門、帳號（下一頁顯示「XXX 您好」、決定進哪個部門用）
            // 瀏覽器不讓存時會丟錯，由下面的 catch 顯示錯誤、留在登入頁
            localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
            localStorage.setItem(ADMIN_NAME_KEY, data.name);
            localStorage.setItem(ADMIN_DEPT_KEY, data.department);
            localStorage.setItem(ADMIN_ACCOUNT_KEY, data.account);
            // 進該部門首頁，例如 PRODUCT → /admin/product
            navigate('/admin/' + data.department.toLowerCase());
        } catch (e) {
            toast(e.message, true);
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-paper font-kinu text-[#111]">
            <div className="flex min-h-screen items-center justify-center px-4 py-12">
                <div className="w-full max-w-[420px] border border-line bg-white px-8 py-10 max-[480px]:px-5">

                    <div className="mb-2 text-center text-[10px] tracking-[.22em] text-muted">KINU ADMIN</div>
                    <h1 className="mb-8 text-center text-[26px] font-medium tracking-[.08em]">員工登入</h1>

                    <div className="mb-2 text-[11px] tracking-[.12em] text-muted">選擇部門</div>
                    <div className="mb-6 grid grid-cols-3 gap-2">
                        {DEPARTMENTS.map(dept => (
                            <button key={dept.key} type="button" onClick={() => setSelectedDept(dept.key)}
                                    className={'border px-2 py-2 text-[12px] tracking-[.08em] transition-colors '
                                        + (dept.key === selectedDept
                                            ? 'border-black bg-black text-white'
                                            : 'border-line bg-white text-[#111] hover:border-black')}>
                                {dept.name}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                        <label className="flex flex-col gap-1.5">
                            <span className="text-[11px] tracking-[.12em] text-muted">帳號</span>
                            <input type="text" name="account" autoComplete="username"
                                   className="border border-line bg-paper px-3 py-2.5 text-[14px] outline-none focus:border-black"/>
                        </label>
                        <label className="flex flex-col gap-1.5">
                            <span className="text-[11px] tracking-[.12em] text-muted">密碼</span>
                            <input type="password" name="password" autoComplete="current-password"
                                   className="border border-line bg-paper px-3 py-2.5 text-[14px] outline-none focus:border-black"/>
                        </label>

                        <button type="submit" disabled={loading}
                                className="mt-2 border border-black bg-black px-4 py-3 text-[12px] tracking-[.12em] text-white
                                           transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40">
                            {loading ? '登入中…' : '登入'}
                        </button>
                    </form>

                    {import.meta.env.DEV && (
                        <div className="mt-8 border-t border-line pt-5 text-[11px] tracking-[.06em] text-muted">
                            <div className="mb-2">測試帳號（密碼都是 {TEST_PASSWORD}，部門要選對）</div>
                            <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                                {DEPARTMENTS.map(dept => (
                                    <li key={dept.key}>{dept.name}：{TEST_ACCOUNTS[dept.key]}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AdminLogin;
