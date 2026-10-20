import { useState } from "react";
import { adminApi } from "../../../js/admin.js";
import { toast } from "../../../js/kinu.js";
import Modal from "../Modal.jsx";

const lineButtonClass = "border border-line px-4 py-2.5 text-[12px] tracking-[.12em] hover:border-black";

/** 停用帳號：停用後員工馬上不能登入，所以先確認 */
function DisableModal({ staff, onClose, reload }) {
    const [loading, setLoading] = useState(false);

    async function handleConfirm() {
        setLoading(true);
        try {
            await adminApi(`/api/admin/admin/staff/${staff.account}/disable`, { method: 'PATCH' });
            toast(`${staff.account} 已停用`);
            reload();
            onClose();
        } catch (e) {
            toast(e.message, true);
            setLoading(false);
        }
    }

    return (
        <Modal title="停用帳號" onClose={onClose}>
            <p className="text-[13px] tracking-[.04em]">
                確定要停用 <b className="font-medium">{staff.account}（{staff.name}）</b> 嗎？停用後無法登入，之後可以再啟用。
            </p>
            <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={onClose} className={lineButtonClass}>取消</button>
                <button type="button" onClick={handleConfirm} disabled={loading}
                        className="border border-[#b0413e] bg-[#b0413e] px-4 py-2.5 text-[12px] tracking-[.12em] text-white hover:opacity-80 disabled:opacity-40">
                    {loading ? '停用中…' : '確認停用'}
                </button>
            </div>
        </Modal>
    )
}

export default DisableModal;
