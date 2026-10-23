import { useState } from "react";
import { adminApi } from "../../../js/admin.js";
import { toast } from "../../../js/kinu.js";
import Modal from "../shared/Modal.jsx";
import TempPassword from "./TempPassword.jsx";

const blackButtonClass = "border border-black bg-black px-4 py-2.5 text-[12px] tracking-[.12em] text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40";
const lineButtonClass = "border border-line px-4 py-2.5 text-[12px] tracking-[.12em] hover:border-black";

/** 重設密碼：先確認，確認後在同一個視窗顯示新密碼 */
function ResetPasswordModal({ staff, onClose }) {
    const [loading, setLoading] = useState(false);
    const [tempPassword, setTempPassword] = useState(null);

    async function handleConfirm() {
        setLoading(true);
        try {
            const data = await adminApi(`/api/admin/admin/staff/${staff.account}/reset-password`, { method: 'POST' });
            setTempPassword(data.tempPassword);
        } catch (e) {
            toast(e.message, true);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal title="重設密碼" onClose={onClose}>
            {tempPassword ? (
                <>
                    <TempPassword account={staff.account} password={tempPassword}/>
                    <div className="mt-6 flex justify-end">
                        <button type="button" onClick={onClose} className={blackButtonClass}>完成</button>
                    </div>
                </>
            ) : (
                <>
                    <p className="text-[13px] tracking-[.04em]">
                        確定要重設 <b className="font-medium">{staff.account}（{staff.name}）</b> 的密碼嗎？舊密碼會立刻失效。
                    </p>
                    <div className="mt-6 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className={lineButtonClass}>取消</button>
                        <button type="button" onClick={handleConfirm} disabled={loading} className={blackButtonClass}>
                            {loading ? '重設中…' : '確認重設'}
                        </button>
                    </div>
                </>
            )}
        </Modal>
    )
}

export default ResetPasswordModal;
