import { useState, useEffect, useRef } from 'react'
import { MdLanguage } from "react-icons/md";
import { LANGUAGES, useLanguage } from "../../../js/i18n.js";

/** 語言選單：點地球打開，選了語言或點選單以外的地方就收起來 */
function LanguageMenu() {
    const { t, language, setLanguage } = useLanguage();

    const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
    const languageMenuRef = useRef(null);
    useEffect(() => {
        if (!languageMenuOpen) return;
        function closeOnOutsideClick(e) {
            if (!languageMenuRef.current.contains(e.target)) setLanguageMenuOpen(false);
        }
        document.addEventListener('click', closeOnOutsideClick);
        return () => document.removeEventListener('click', closeOnOutsideClick);
    }, [languageMenuOpen]);

    /** 選了某個語言：切換並收起選單 */
    function chooseLanguage(code) {
        setLanguage(code);
        setLanguageMenuOpen(false);
    }

    return (
        <div ref={languageMenuRef} className="relative">
            <button aria-label={t('chooseLanguage')} aria-expanded={languageMenuOpen}
                    onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                    className="grid size-8 place-items-center">
                <MdLanguage className="size-5" />
            </button>
            {languageMenuOpen && (
                <ul className="absolute right-0 top-full z-50 min-w-[110px] border border-[#dfd9d2] bg-[#F6F5F2] py-1.5">
                    {LANGUAGES.map((lang) => (
                        <li key={lang.code}>
                            <button onClick={() => chooseLanguage(lang.code)}
                                    className={`block w-full px-4 py-2 text-left text-[11px] tracking-[.06em] whitespace-nowrap hover:bg-[#ebe7e1]
                                                ${lang.code === language ? "text-black" : "text-[#76716c]"}`}>
                                {lang.label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default LanguageMenu;
