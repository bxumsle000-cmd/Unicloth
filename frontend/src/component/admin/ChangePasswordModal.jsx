import { useState } from "react";
import { adminApi } from "../../js/admin.js";
import { toast } from "../../js/kinu.js";
import Modal from "./Modal.jsx";

const inputClass = "border border-line bg-paper px-3 py-2.5 text-[14px] outline-none focus:border-black disabled:text-muted";
const blackButtonClass = "border border-black bg-black px-4 py-2.5 text-[12px] tracking-[.12em] text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40";
const lineButtonClass = "border border-line px-4 py-2.5 text-[12px] tracking-[.12em] hover:border-black";

/** 改自己的密碼（AdminAuthService.changePassword） */
function ChangePasswordModal({ onClose }) {
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const oldPassword = formData.get('oldPassword');
        const newPassword = formData.get('newPassword');
        if (!oldPassword || !newPassword) {
            toast('請輸入舊密碼和新密碼', true);
            return;
        }
        // 長度規則跟後端 ChangePasswordRequest 一樣，先在前端擋一次
        if (newPassword.length < 8 || newPassword.length > 72) {
            toast('密碼長度需為 8～72 字', true);
            return;
        }
        if (newPassword !== formData.get('confirmPassword')) {
            toast('兩次輸入的新密碼不一樣', true);
            return;
        }

        setLoading(true);
        try {
            await adminApi('/api/admin/auth/password', { method: 'PATCH', body: { oldPassword: oldPassword, newPassword: newPassword } });
            toast('密碼已更新');
            onClose();
        } catch (e) {
            toast(e.message, true);
            setLoading(false);
        }
    }

    return (
        <Modal title="更改密碼" onClose={onClose}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] tracking-[.12em] text-muted">舊密碼</span>
                    <input type="password" name="oldPassword" autoComplete="current-password" autoFocus className={inputClass}/>
                </label>
                <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] tracking-[.12em] text-muted">新密碼（8～72 字）</span>
                    <input type="password" name="newPassword" autoComplete="new-password" className={inputClass}/>
                </label>
                <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] tracking-[.12em] text-muted">再輸入一次新密碼</span>
                    <input type="password" name="confirmPassword" autoComplete="new-password" className={inputClass}/>
                </label>
                <div className="mt-2 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className={lineButtonClass}>取消</button>
                    <button type="submit" disabled={loading} className={blackButtonClass}>{loading ? '更新中…' : '更新密碼'}</button>
                </div>
            </form>
        </Modal>
    )
}

export default ChangePasswordModal;
