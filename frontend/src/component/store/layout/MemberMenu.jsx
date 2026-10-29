import { useState, useEffect, useRef } from 'react'
import { Link } from "react-router-dom";
import { useLanguage } from "../../../js/i18n.js";
import { logoutMember } from "../../../js/firebase.js";

const itemClass =
    "block w-full px-4 py-2 text-left text-[11px] tracking-[.06em] whitespace-nowrap text-[#36322e] hover:bg-[#ebe7e1]";

/** 會員中心選單：點「會員中心」打開，選了項目或點選單以外的地方就收起來 */
function MemberMenu({ className }) {
    const { t } = useLanguage();

    const [memberMenuOpen, setMemberMenuOpen] = useState(false);
    const memberMenuRef = useRef(null);
    useEffect(() => {
        if (!memberMenuOpen) return;
        function closeOnOutsideClick(e) {
            if (!memberMenuRef.current.contains(e.target)) setMemberMenuOpen(false);
        }
        document.addEventListener('click', closeOnOutsideClick);
        return () => document.removeEventListener('click', closeOnOutsideClick);
    }, [memberMenuOpen]);

    return (
        <div ref={memberMenuRef} className="relative">
            <button aria-expanded={memberMenuOpen}
                    onClick={() => setMemberMenuOpen(!memberMenuOpen)}
                    className={className}>
                {t('memberCenter')}
            </button>
            {memberMenuOpen && (
                <ul className="absolute right-0 top-full z-50 min-w-[110px] border border-[#dfd9d2] bg-[#F6F5F2] py-1.5">
                    <li>
                        <Link to="/member" onClick={() => setMemberMenuOpen(false)} className={itemClass}>
                            會員資料
                        </Link>
                    </li>
                    <li>
                        <Link to="/member/recommendation-settings" onClick={() => setMemberMenuOpen(false)} className={itemClass}>
                            推薦設定
                        </Link>
                    </li>
                    <li>
                        <button onClick={logoutMember} className={itemClass}>
                            {t('logout')}
                        </button>
                    </li>
                </ul>
            )}
        </div>
    )
}

export default MemberMenu;
