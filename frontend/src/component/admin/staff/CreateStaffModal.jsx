import { useState } from "react";
import { DEPARTMENTS, adminApi } from "../../../js/admin.js";
import { toast } from "../../../js/kinu.js";
import Modal from "../Modal.jsx";
import TempPassword from "../TempPassword.jsx";

const inputClass = "border border-line bg-paper px-3 py-2.5 text-[14px] outline-none focus:border-black disabled:text-muted";
const blackButtonClass = "border border-black bg-black px-4 py-2.5 text-[12px] tracking-[.12em] text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40";
const lineButtonClass = "border border-line px-4 py-2.5 text-[12px] tracking-[.12em] hover:border-black";

/** 新增員工：帳號、姓名、部門（單選）；成功後在同一個視窗顯示臨時密碼 */
function CreateStaffModal({ onClose, reload }) {
    const [department, setDepartment] = useState(DEPARTMENTS[0].key);
    const [loading, setLoading] = useState(false);
    // 建立成功後才有值：{ account: 帳號, tempPassword: 臨時密碼 }
    const [result, setResult] = useState(null);

    async function handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const account = formData.get('account').trim();
        const name = formData.get('name').trim();
        if (!account || !name) {
            toast('請填寫帳號和姓名', true);
            return;
        }

        setLoading(true);
        try {
            const data = await adminApi('/api/admin/admin/staff', { method: 'POST', body: { account: account, name: name, department: department } });
            setResult({ account, tempPassword: data.tempPassword });
            reload();
        } catch (e) {
            toast(e.message, true);
        } finally {
            setLoading(false);
        }
    }

    if (result) {
        return (
            <Modal title="新增員工" onClose={onClose}>
                <TempPassword account={result.account} password={result.tempPassword}/>
                <div className="mt-6 flex justify-end">
                    <button type="button" onClick={onClose} className={blackButtonClass}>完成</button>
                </div>
            </Modal>
        )
    }

    return (
        <Modal title="新增員工" onClose={onClose}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] tracking-[.12em] text-muted">帳號（建立後不能改）</span>
                    <input type="text" name="account" autoFocus className={inputClass}/>
                </label>
                <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] tracking-[.12em] text-muted">姓名</span>
                    <input type="text" name="name" className={inputClass}/>
                </label>
                <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] tracking-[.12em] text-muted">部門</span>
                    <div className="grid grid-cols-3 gap-2">
                        {DEPARTMENTS.map(dept => (
                            <button key={dept.key} type="button" onClick={() => setDepartment(dept.key)}
                                    className={'border px-2 py-2 text-[12px] tracking-[.08em] transition-colors '
                                        + (dept.key === department
                                            ? 'border-black bg-black text-white'
                                            : 'border-line bg-white hover:border-black')}>
                                {dept.name}
                            </button>
                        ))}
                    </div>
                </div>
                <p className="text-[11px] tracking-[.04em] text-muted">密碼由系統產生，建立後會顯示一次。</p>
                <div className="mt-2 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className={lineButtonClass}>取消</button>
                    <button type="submit" disabled={loading} className={blackButtonClass}>{loading ? '建立中…' : '建立'}</button>
                </div>
            </form>
        </Modal>
    )
}

export default CreateStaffModal;
