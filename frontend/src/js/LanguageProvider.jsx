import { useEffect, useState } from 'react'
import { DICTIONARY, LANGUAGES, LanguageContext } from './i18n.js';

const STORAGE_KEY = 'kinu-language';

/** 讀上次選的語言；沒存過、存的值不認得、或瀏覽器不讓用 localStorage 時就用中文 */
function loadLanguage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return DICTIONARY[saved] ? saved : 'zh';
    } catch {
        return 'zh';
    }
}

/** 包在 App 最外層，底下所有元件都能用 useLanguage() 拿到目前語言 */
export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(loadLanguage);

    // 語言一變就記起來，並更新 <html lang>
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, language);
        } catch {
            // 存不了就算了，只是下次打開會回到中文
        }
        document.documentElement.lang = LANGUAGES.find((lang) => lang.code === language).htmlLang;
    }, [language]);

    /** 用 key 查目前語言的文字，查不到就直接顯示 key，方便發現漏翻 */
    function t(key) {
        return DICTIONARY[language][key] ?? key;
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}
