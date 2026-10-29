import { useEffect, useState } from "react";
import { api, toast } from "../../js/kinu.js";

const inputClass = "w-full border-b border-[#d6d0c7] bg-transparent py-2 text-[14px] tracking-[.04em] outline-none focus:border-black";

const GENDER_LABELS = {
    female: "女",
    male: "男",
};

/** 一個欄位：上面小標題，下面放輸入框或文字 */
function Field({ label, children }) {
    return (
        <label className="block">
            <span className="text-[11px] tracking-[.08em] text-[#76716c]">{label}</span>
            {children}
        </label>
    )
}

/** 只能看、不能改的欄位 */
function ReadOnlyField({ label, value }) {
    return (
        <div>
            <span className="text-[11px] tracking-[.08em] text-[#76716c]">{label}</span>
            <p className="border-b border-[#ece8e2] py-2 text-[14px] tracking-[.04em] text-[#76716c]">{value || "—"}</p>
        </div>
    )
}

/**
 * 會員中心：修改會員資料。
 *
 * 後端 PUT /api/member/me/profile 只能改姓名、手機、地址；
 * Email、性別、生日只顯示不能改。
 */
function MemberProfile() {
    const [member, setMember] = useState(null);
    const [form, setForm] = useState({ name: "", phone: "", address: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api("/api/member/me")
            .then((data) => {
                setMember(data);
                setForm({
                    name: data.name ?? "",
                    phone: data.phone ?? "",
                    address: data.address ?? "",
                });
            })
            .catch((err) => toast(err.message, true));
    }, []);

    function changeField(key, value) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    async function submit(e) {
        e.preventDefault();   // 不讓表單照瀏覽器預設的方式重新載入整頁
        setSaving(true);
        try {
            const updated = await api("/api/member/me/profile", {
                method: "PUT",
                // 地址沒填就送 null；欄位格式由後端檢查，錯了會回訊息
                body: { ...form, address: form.address.trim() || null },
            });
            setMember(updated);
            toast("會員資料已更新");
        } catch (err) {
            toast(err.message, true);
        } finally {
            setSaving(false);
        }
    }

    if (!member) {
        return <p className="text-[12px] tracking-[.06em] text-[#76716c]">載入中…</p>;
    }

    return (
        <form onSubmit={submit} className="w-full max-w-[460px]">
            <h2 className="mb-6 text-[15px] font-medium tracking-[.08em]">會員資料</h2>

            <div className="space-y-6">
                <ReadOnlyField label="Email" value={member.email} />
                <Field label="姓名">
                    <input className={inputClass} value={form.name} maxLength={50} required
                           onChange={(e) => changeField("name", e.target.value)} />
                </Field>
                <Field label="手機">
                    <input className={inputClass} type="tel" value={form.phone} maxLength={20} required
                           onChange={(e) => changeField("phone", e.target.value)} />
                </Field>
                <ReadOnlyField label="性別" value={GENDER_LABELS[member.gender]} />
                <ReadOnlyField label="生日" value={member.birthday?.replace(/-/g, "/")} />
                <Field label="地址（選填，結帳時當預設宅配地址）">
                    <input className={inputClass} value={form.address} maxLength={255}
                           onChange={(e) => changeField("address", e.target.value)} />
                </Field>
            </div>

            <p className="mt-6 text-[11px] tracking-[.06em] text-[#76716c]">性別與生日填寫後無法修改。</p>

            <button type="submit" disabled={saving}
                    className="mt-8 w-full border border-black bg-black px-4 py-3 text-[12px] tracking-[.12em] text-white
                               transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40">
                {saving ? "儲存中…" : "儲存"}
            </button>
        </form>
    )
}

export default MemberProfile;
