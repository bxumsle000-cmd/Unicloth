import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { api, getToken, toast } from "../../js/kinu.js";
import { getGoogleName } from "../../js/firebase.js";

const inputClass = "w-full border-b border-[#d6d0c7] bg-transparent py-2 text-[14px] tracking-[.04em] outline-none focus:border-black";

const GENDER_OPTIONS = [
    { value: "female", label: "女" },
    { value: "male", label: "男" },
];

/** 一個欄位：上面小標題，下面放輸入框 */
function Field({ label, children }) {
    return (
        <label className="block">
            <span className="text-[11px] tracking-[.08em] text-[#76716c]">{label}</span>
            {children}
        </label>
    )
}

/** 第一次用 Google 登入後補填個人資料；填完才能使用購物車、結帳等功能 */
function CompleteProfile() {
    const [form, setForm] = useState({ name: "", phone: "", gender: "", birthday: "", address: "" });
    const [submitting, setSubmitting] = useState(false);

    // 姓名先帶 Google 帳號的名字，使用者可以改；使用者已經開始打字就不要蓋掉
    useEffect(() => {
        getGoogleName().then((name) => {
            if (name) setForm((f) => (f.name ? f : { ...f, name }));
        });
    }, []);

    function changeField(key, value) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    async function submit(e) {
        e.preventDefault();   // 不讓表單照瀏覽器預設的方式重新載入整頁
        setSubmitting(true);
        try {
            await api("/api/member/me/complete-profile", {
                method: "PUT",
                // 地址沒填就送 null；欄位格式由後端檢查，錯了會回訊息
                body: { ...form, address: form.address.trim() || null },
            });
            // 整頁重新載入：路由守衛才會重新確認「已補填」
            window.location.href = "/";
        } catch (err) {
            toast(err.message, true);
            setSubmitting(false);
        }
    }

    if (!getToken()) return <Navigate to="/login" replace />;

    return (
        <div className="flex justify-center px-[5.5%] pt-[60px] pb-[100px]
                        max-[760px]:px-[4%] max-[760px]:pt-[36px] max-[760px]:pb-[70px]">
            <form onSubmit={submit} className="w-full max-w-[460px]">
                <div className="mb-2 text-[10px] tracking-[.22em] text-[#76716c]">PROFILE</div>
                <h1 className="mb-3 text-[clamp(24px,3vw,34px)] font-medium tracking-[.08em]">填寫會員資料</h1>
                <p className="mb-8 text-[11px] tracking-[.06em] text-[#76716c]">第一次登入請先填寫資料，結帳時會用到</p>

                <div className="space-y-6">
                    <Field label="姓名">
                        <input className={inputClass} value={form.name} maxLength={50} required
                               onChange={(e) => changeField("name", e.target.value)} />
                    </Field>
                    <Field label="手機">
                        <input className={inputClass} type="tel" value={form.phone} maxLength={20} required
                               onChange={(e) => changeField("phone", e.target.value)} />
                    </Field>
                    <div>
                        <span className="text-[11px] tracking-[.08em] text-[#76716c]">性別</span>
                        <div className="mt-3 flex gap-6">
                            {GENDER_OPTIONS.map((o) => (
                                <label key={o.value} className="flex cursor-pointer items-center gap-2 text-[13px] tracking-[.06em]">
                                    <input type="radio" name="gender" checked={form.gender === o.value} required
                                           onChange={() => changeField("gender", o.value)} className="size-4 accent-black" />
                                    {o.label}
                                </label>
                            ))}
                        </div>
                    </div>
                    <Field label="生日">
                        <input className={inputClass} type="date" value={form.birthday} required
                               max={new Date().toISOString().slice(0, 10)}
                               onChange={(e) => changeField("birthday", e.target.value)} />
                    </Field>
                    <Field label="地址（選填，結帳時當預設宅配地址）">
                        <input className={inputClass} value={form.address} maxLength={255}
                               onChange={(e) => changeField("address", e.target.value)} />
                    </Field>
                </div>

                <button type="submit" disabled={submitting}
                        className="mt-10 w-full border border-black bg-black px-4 py-3 text-[12px] tracking-[.12em] text-white
                                   transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40">
                    {submitting ? "送出中…" : "完成"}
                </button>
            </form>
        </div>
    )
}

export default CompleteProfile;
