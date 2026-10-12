import { useState } from "react";

/** 可摺疊的區塊：點標題展開 / 收合；defaultOpen 決定一開始是否展開 */
function Accordion({ title, defaultOpen = false, children }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-[#e5e0d8]">
            <button onClick={() => setOpen(!open)} aria-expanded={open}
                    className="flex w-full items-center justify-between py-5 text-[12px] tracking-[.12em] text-[#4a4643]">
                <span>{title}</span>
                {/* 展開時是 —，收合時是 + */}
                <span className="text-[16px] leading-none text-[#76716c]">{open ? "−" : "+"}</span>
            </button>

            {open && (
                <div className="pb-6 text-[13px] leading-[2] tracking-[.04em] text-[#3a3633]">
                    {children}
                </div>
            )}
        </div>
    )
}

export default Accordion;
