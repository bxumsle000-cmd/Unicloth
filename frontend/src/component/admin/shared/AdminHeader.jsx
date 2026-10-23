import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoSettingsOutline } from "react-icons/io5";
import { MdLockOutline, MdLogout } from "react-icons/md";
import { ADMIN_ACCOUNT_KEY, ADMIN_NAME_KEY, clearAdminSession } from "../../../js/admin.js";
import ChangePasswordModal from "./ChangePasswordModal.jsx";

const itemClass = "flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] tracking-[.06em] hover:bg-paper";

/** 後台頁面的頂部列：目前登入的人 + 右邊設定按鈕（點開有「更改密碼」「登出」），各部門頁面共用 */
function AdminHeader() {
    const navigate = useNavigate();
    const myAccount = localStorage.getItem(ADMIN_ACCOUNT_KEY);
    const myName = localStorage.getItem(ADMIN_NAME_KEY) ?? '';

    const [open, setOpen] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const menuRef = useRef(null);

    // 選單打開時，點選單外面任何地方就關起來
    useEffect(() => {
        if (!open) return;
        function handleClick(e) {
            if (!menuRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    return (
        <header className="flex items-center justify-end gap-4 border-b border-line bg-white px-8 py-4 max-[760px]:px-4">
            <span className="text-[12px] tracking-[.06em] text-muted">
                目前登入：<b className="font-medium text-[#111]">{myName}{myAccount && `（${myAccount}）`}</b>
            </span>

            <div ref={menuRef} className="relative">
                <button type="button" onClick={() => setOpen(!open)} aria-label="設定"
                        className={'flex h-8 w-8 items-center justify-center border transition-colors '
                            + (open ? 'border-black' : 'border-line hover:border-black')}>
                    <IoSettingsOutline className="text-[17px]"/>
                </button>
                {open && (
                    <div className="absolute right-0 top-full z-30 mt-2 w-[160px] border border-line bg-white py-1 shadow-sm">
                        <button type="button" onClick={() => { setOpen(false); setShowPasswordModal(true); }} className={itemClass}>
                            <MdLockOutline className="text-[15px] text-muted"/>更改密碼
                        </button>
                        <button type="button" onClick={() => { clearAdminSession(); navigate('/admin/login'); }} className={itemClass}>
                            <MdLogout className="text-[15px] text-muted"/>登出
                        </button>
                    </div>
                )}
            </div>

            {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)}/>}
        </header>
    )
}

export default AdminHeader;
