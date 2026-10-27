import { useState } from "react";
import { api, toast } from "../../js/kinu.js";

function RecommendationSettings() {
    const [clearing, setClearing] = useState(false);

    async function clearHistory() {
        const confirmed = window.confirm(
            "確定要清除全部瀏覽紀錄嗎？清除後，個人推薦會重新累積。"
        );

        if (!confirmed) {
            return;
        }

        setClearing(true);

        try {
            const result = await api(
                "/api/member/product-views",
                { method: "DELETE" }
            );

            const message =
                result.deletedCount > 0
                    ? `已清除 ${result.deletedCount} 筆瀏覽紀錄`
                    : "目前沒有瀏覽紀錄";

            toast(message);
        } catch (error) {
            toast(error.message, true);
        } finally {
            setClearing(false);
        }
    }

    return (
        <div className="px-[5.5%] pt-[38px] pb-[90px]
                        max-[760px]:px-[4%] max-[760px]:pt-[26px]">
            <div className="mb-2 text-[10px] tracking-[.22em] text-[#76716c]">
                RECOMMENDATION SETTINGS
            </div>

            <h1 className="mb-3 text-[clamp(24px,3vw,34px)] font-medium tracking-[.08em]">
                推薦設定
            </h1>

            <p className="mb-8 text-[11px] tracking-[.06em] text-[#76716c]">
                系統會依照商品瀏覽紀錄分析你偏好的風格。
            </p>

            <section className="max-w-[680px] border border-[#d6d0c7] p-6">
                <h2 className="mb-3 text-[15px] font-medium tracking-[.08em]">
                    瀏覽紀錄
                </h2>

                <p className="mb-6 text-[12px] leading-6 text-[#76716c]">
                    清除後，現有的風格偏好會重設，之後會依新的瀏覽紀錄重新產生推薦。
                </p>

                <button
                    type="button"
                    onClick={clearHistory}
                    disabled={clearing}
                    className="border border-[#9e3d32] px-5 py-2.5
                               text-[11px] tracking-[.08em] text-[#9e3d32]
                               transition-colors hover:bg-[#9e3d32] hover:text-white
                               disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {clearing ? "清除中…" : "清除瀏覽紀錄"}
                </button>
            </section>
        </div>
    );
}

export default RecommendationSettings;