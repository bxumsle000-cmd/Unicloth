import { money, fmtDate } from "../js/kinu.js";

const STATUS_TEXT = { usable: "可使用", used: "已使用", expired: "已過期" };

/** 折扣顯示：PERCENT 的 value 是折幾 %，10 → 9 折、15 → 8.5 折；AMOUNT 的 value 是折多少元 */
function discountText(coupon) {
    if (coupon.type === "PERCENT") return `${(100 - coupon.value) / 10} 折`;
    return `${coupon.value} 元`;
}

/** 折價券卡片：coupon 是 /api/coupon 回來的一張 */
function CouponCard({ coupon }) {
    const usable = coupon.status === "usable";

    return (
        <div className={`flex min-h-[128px] border border-[#e5e0d8] bg-white ${usable ? "" : "opacity-55"}`}>
            {/* 左：折扣，不能用的券改成灰色 */}
            <div className={`grid w-[110px] shrink-0 place-items-center text-[20px] tracking-[.08em] text-white
                            ${usable ? "bg-black" : "bg-[#9a948d]"}`}>
                {discountText(coupon)}
            </div>

            {/* 右：券的資訊 */}
            <div className="flex flex-1 flex-col px-5 py-4">
                <div className="mb-3 text-[14px] tracking-[.06em]">{coupon.title}</div>
                <div className="mb-2 text-[11px] tracking-[.06em] text-[#76716c]">
                    滿 {money(coupon.minSubtotal)} 可使用
                </div>
                <div className="text-[11px] tracking-[.06em] text-[#76716c]">{fmtDate(coupon.expireAt)} 到期</div>

                <div className="mt-auto flex items-end justify-between pt-3">
                    <span className="text-[11px] tracking-[.12em] text-[#76716c]">{coupon.code}</span>
                    <span className="text-[11px] tracking-[.08em]">{STATUS_TEXT[coupon.status]}</span>
                </div>
            </div>
        </div>
    )
}

export default CouponCard;
