import { useState } from "react";

// 側邊選單的大類和底下的子頁面；page.key 要跟 MktHome 切換頁面用的值一樣
const MENU_GROUPS = [
    { key: 'coupon', name: 'Coupon', pages: [
        { key: 'coupon',  name: '折價券' },
        { key: 'issue',   name: '發券給會員' },
        { key: 'records', name: '發券紀錄' },
    ] },
    { key: 'sales', name: '銷售數據', pages: [
        { key: 'salesOverview', name: '營收總覽' },
        { key: 'productSales',  name: '商品銷售' },
        { key: 'orderStructure', name: '訂單結構' },
        { key: 'memberCustomers', name: '會員與顧客' },
        { key: 'couponPerformance', name: '折價券成效' },
    ] },
];

/**
 * 行銷頁面的側邊選單
 * currentPage：目前在哪個子頁面（page.key），那一個會反黑
 * onChangePage：點子頁面時呼叫，傳入 page.key
 */
function SideMenu({ currentPage, onChangePage }) {
    // 目前展開的大類 key，同時只能展開一個；null = 都收合。一開始展開目前子頁面所在的那一類
    const [openGroupKey, setOpenGroupKey] = useState(
        MENU_GROUPS.find(group => group.pages.some(page => page.key === currentPage))?.key ?? null
    );

    // 點已展開的就收合，點別的就換成展開那一個（原本展開的會自動收起來）
    function toggleGroup(groupKey) {
        setOpenGroupKey(openGroupKey === groupKey ? null : groupKey);
    }

    return (
        <aside className="w-[220px] shrink-0 border-r border-line bg-white max-[760px]:w-full max-[760px]:border-r-0 max-[760px]:border-b">
            <nav className="flex flex-col pb-6 max-[760px]:pb-3">
                {MENU_GROUPS.map(group => {
                    const isOpen = openGroupKey === group.key;
                    return (
                        <div key={group.key} className="flex flex-col">
                            {/* 大類標題：點了展開／收合 */}
                            <button type="button" onClick={() => toggleGroup(group.key)} aria-expanded={isOpen}
                                    className="flex items-center justify-between px-6 py-3 text-left text-[13px] font-medium tracking-[.08em] hover:bg-paper max-[760px]:px-4">
                                <span>{group.name}</span>
                                <span className={`text-[10px] text-muted transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                            </button>

                            {isOpen && group.pages.map(page => (
                                <button key={page.key} type="button" onClick={() => onChangePage(page.key)}
                                        className={'border-l-2 py-2.5 pl-10 pr-6 text-left text-[13px] tracking-[.08em] max-[760px]:pl-8 '
                                            + (page.key === currentPage ? 'border-black bg-paper font-medium' : 'border-transparent text-muted hover:text-[#111]')}>
                                    {page.name}
                                </button>
                            ))}
                        </div>
                    );
                })}
            </nav>
        </aside>
    )
}

export default SideMenu;
