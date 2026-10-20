import { useState } from "react";
import { MdCheck, MdContentCopy } from "react-icons/md";
import { toast } from "../../../js/kinu.js";

/** 顯示臨時密碼 + 複製按鈕（新增員工、重設密碼共用） */
function TempPassword({ account, password }) {
    const [copied, setCopied] = useState(false);

    async function copy() {
        try {
            await navigator.clipboard.writeText(password);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast('複製失敗，請手動選取密碼', true);
        }
    }

    return (
        <div>
            <p className="mb-3 text-[13px] tracking-[.04em]">
                <b className="font-medium">{account}</b> 的臨時密碼如下，關閉視窗後就看不到了，請先複製交給員工。
            </p>
            <div className="flex items-stretch border border-line bg-paper">
                <code className="flex-1 break-all px-3 py-2.5 font-mono text-[14px] tracking-[.06em] select-all">{password}</code>
                <button type="button" onClick={copy}
                        className="flex shrink-0 items-center gap-1 border-l border-line px-3 text-[12px] tracking-[.08em] hover:bg-cream">
                    {copied ? <><MdCheck className="text-[15px]"/>已複製</> : <><MdContentCopy className="text-[14px]"/>複製</>}
                </button>
            </div>
        </div>
    )
}

export default TempPassword;
