import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DEPARTMENTS, deptHomePath, setAdminSession } from "../../js/admin.js";

const LAST_DEPT_KEY = 'adminLastDept';

// 記住上次選的部門；瀏覽器不給用 localStorage、或存的值不認得時就預設第一個
function loadLastDept() {
    try {
        const saved = localStorage.getItem(LAST_DEPT_KEY);
        if (DEPARTMENTS.some(dept => dept.key === saved)) return saved;
    } catch {
        // 不能讀就用預設
    }
    return DEPARTMENTS[0].key;
}

function AdminLogin() {
    const navigate = useNavigate();
    const [selectedDept, setSelectedDept] = useState(loadLastDept);
    const [account, setAccount] = useState('');
    const [password, setPassword] = useState('');
    // 錯誤 / 成功訊息；null 表示不顯示
    const [message, setMessage] = useState(null);
    // 登入中先把按鈕鎖住，避免連按送出好幾次
    const [loading, setLoading] = useState(false);

    function selectDept(deptKey) {
        setSelectedDept(deptKey);
        setMessage(null);
    }

    async function handleSubmit(event) {
        event.preventDefault(); // 不要讓表單真的送出、重新整理頁面

        const trimmedAccount = account.trim();
        if (!trimmedAccount || !password) {
            setMessage({ text: '請輸入帳號和密碼', isError: true });
            return;
        }

        setLoading(true);
        try {
            // 不用 kinu.js 的 api()：它會自動帶上會員的 token，後台登入不需要
            const res = await fetch('/api/admin/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ account: trimmedAccount, password, department: selectedDept }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                // 帳密錯、停用、部門不對，後端都會回 message
                throw new Error(data?.message || '連線發生問題（' + res.status + '），請稍後再試');
            }

            setAdminSession(data);
            try {
                localStorage.setItem(LAST_DEPT_KEY, selectedDept);
            } catch {
                // 不能存就下次再選一次
            }
            navigate(deptHomePath(data.department));
        } catch (e) {
            setMessage({ text: e.message, isError: true });
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
                            <button key={dept.key} type="button" onClick={() => selectDept(dept.key)}
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
                            <input type="text" autoComplete="username" value={account}
                                   onChange={e => setAccount(e.target.value)}
                                   className="border border-line bg-paper px-3 py-2.5 text-[14px] outline-none focus:border-black"/>
                        </label>
                        <label className="flex flex-col gap-1.5">
                            <span className="text-[11px] tracking-[.12em] text-muted">密碼</span>
                            <input type="password" autoComplete="current-password" value={password}
                                   onChange={e => setPassword(e.target.value)}
                                   className="border border-line bg-paper px-3 py-2.5 text-[14px] outline-none focus:border-black"/>
                        </label>

                        {message && (
                            <p className={'text-[12px] tracking-[.04em] ' + (message.isError ? 'text-[#b0413e]' : 'text-[#2f6b3a]')}>
                                {message.text}
                            </p>
                        )}

                        <button type="submit" disabled={loading}
                                className="mt-2 border border-black bg-black px-4 py-3 text-[12px] tracking-[.12em] text-white
                                           transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40">
                            {loading ? '登入中…' : '登入'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default AdminLogin;
