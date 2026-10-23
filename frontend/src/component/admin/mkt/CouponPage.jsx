import { useEffect, useState } from "react";
import { adminApi } from "../../../js/admin.js";
import { toast } from "../../../js/kinu.js";
import CouponTable from "./CouponTable.jsx";
import CouponCreateModal from "./CouponCreateModal.jsx";
import CouponEditModal from "./CouponEditModal.jsx";

/** 折價券子頁面：新增按鈕、折價券表格 */
function CouponPage() {
    // 後端回的 AdminCouponResponse 陣列；null = 還沒載入完
    const [couponList, setCouponList] = useState(null);
    // 目前開著哪個視窗：{ type: 'create' | 'edit', coupon: 被點的券（新增時沒有） }；null = 都沒開
    const [modal, setModal] = useState(null);

    // 新增、編輯、停用、啟用成功後 +1，讓下面查列表的 useEffect 再跑一次
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        adminApi('/api/admin/mkt/coupons')
            .then(setCouponList)
            .catch((e) => toast(e.message, true));
    }, [reloadKey]);

    // 重新查一次折價券列表（reloadKey 變了，上面的 useEffect 就會再跑）
    function reload() {
        setReloadKey(key => key + 1);
    }

    // 停用只是不能再發；已經發出去的券會員還是能用
    async function toggleActive(coupon) {
        const action = coupon.active ? 'disable' : 'enable';
        try {
            await adminApi(`/api/admin/mkt/coupons/${coupon.id}/${action}`, { method: 'PATCH' });
            toast(`${coupon.code} 已${coupon.active ? '停用' : '啟用'}`);
            reload();
        } catch (e) {
            toast(e.message, true);
        }
    }

    return (
        <section>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="text-[10px] tracking-[.22em] text-muted">COUPONS</div>
                    <h1 className="text-[24px] font-medium tracking-[.08em]">折價券</h1>
                </div>
                <button type="button" onClick={() => setModal({ type: 'create' })}
                        className="border border-black bg-black px-4 py-2.5 text-[12px] tracking-[.12em] text-white hover:opacity-80">
                    ＋ 新增折價券
                </button>
            </div>

            {couponList && (
                <CouponTable couponList={couponList}
                             onEdit={(coupon) => setModal({ type: 'edit', coupon: coupon })}
                             onToggleActive={toggleActive}/>
            )}

            {modal?.type === 'create' && <CouponCreateModal onClose={()=>setModal(null)} reload={reload}/>}
            {modal?.type === 'edit' && <CouponEditModal coupon={modal.coupon} onClose={()=>setModal(null)} reload={reload}/>}
        </section>
    )
}

export default CouponPage;
