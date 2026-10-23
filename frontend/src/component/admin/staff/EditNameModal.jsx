import { useState } from "react";
import { adminApi } from "../../../js/admin.js";
import { toast } from "../../../js/kinu.js";
import Modal from "../shared/Modal.jsx";

const inputClass = "border border-line bg-paper px-3 py-2.5 text-[14px] outline-none focus:border-black disabled:text-muted";
const blackButtonClass = "border border-black bg-black px-4 py-2.5 text-[12px] tracking-[.12em] text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40";
const lineButtonClass = "border border-line px-4 py-2.5 text-[12px] tracking-[.12em] hover:border-black";

/** 編輯員工：只能改姓名 */
function EditNameModal({ staff, onClose, reload }) {
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        const name = new FormData(event.target).get('name').trim();
        if (!name) {
            toast('請輸入姓名', true);
            return;
        }

        setLoading(true);
        try {
            await adminApi(`/api/admin/admin/staff/${staff.account}/name`, { method: 'PATCH', body: { name: name } });
            toast(`已更新 ${staff.account} 的姓名`);
            reload();
            onClose();
        } catch (e) {
            toast(e.message, true);
            setLoading(false);
        }
    }

    return (
        <Modal title="編輯員工" onClose={onClose}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] tracking-[.12em] text-muted">帳號</span>
                    <input type="text" value={staff.account} disabled className={inputClass}/>
                </label>
                <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] tracking-[.12em] text-muted">姓名</span>
                    <input type="text" name="name" defaultValue={staff.name} autoFocus className={inputClass}/>
                </label>
                <div className="mt-2 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className={lineButtonClass}>取消</button>
                    <button type="submit" disabled={loading} className={blackButtonClass}>{loading ? '儲存中…' : '儲存'}</button>
                </div>
            </form>
        </Modal>
    )
}

export default EditNameModal;
