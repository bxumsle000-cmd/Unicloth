import { useState } from "react";
import ProductAnalyticsPanel from "../../component/admin/product/ProductAnalyticsPanel.jsx";
import ProductCategoryPanel from "../../component/admin/product/ProductCategoryPanel.jsx";
import ProductInventoryPanel from "../../component/admin/product/ProductInventoryPanel.jsx";
import ProductSchedulePanel from "../../component/admin/product/ProductSchedulePanel.jsx";
import ProductStockWarningPanel from "../../component/admin/product/ProductStockWarningPanel.jsx";
import ProductHome from "./ProductHome.jsx";
import AdminHeader from "../../component/admin/shared/AdminHeader.jsx";

const TABS = [
    { key: "products", label: "商品列表" },
    { key: "analytics", label: "銷售分析" },
    { key: "inventory", label: "進貨入庫" },
    { key: "stock-warning", label: "庫存警示" },
    { key: "schedule", label: "預定下架" },
    { key: "categories", label: "分類管理" },
];

/**
 * 商品部功能列。
 * 桌機在右側與新增商品按鈕對齊；手機可橫向滑動。
 */
function ProductTabNavigation({
                                  activeTab,
                                  onChangeTab,
                              }) {
    return (
        <nav
            className="flex max-w-full items-center gap-1 overflow-x-auto"
            aria-label="商品部功能"
        >
            {TABS.map(tab => {
                const active = activeTab === tab.key;

                return (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => onChangeTab(tab.key)}
                        className={
                            "shrink-0 border px-5 py-2.5 text-[12px] tracking-[.08em] " +
                            (active
                                ? "border-black bg-black text-white"
                                : "border-transparent bg-white text-muted hover:border-line hover:text-black")
                        }
                    >
                        {tab.label}
                    </button>
                );
            })}
        </nav>
    );
}

/**
 * 商品列表以外的功能頁共用版面。
 * 功能列固定放在內容區右上角。
 */
function ProductPanelLayout({
                                tabNavigation,
                                children,
                            }) {
    return (
        <main className="px-8 py-10 max-[760px]:px-4 max-[760px]:py-6">
            <div className="mb-6 flex justify-end">
                {tabNavigation}
            </div>

            {children}
        </main>
    );
}

function ProductDepartmentHome() {
    const [activeTab, setActiveTab] = useState("products");
    const [receiveProductId, setReceiveProductId] = useState(null);

    function changeTab(tabKey) {
        setActiveTab(tabKey);

        if (tabKey === "inventory") {
            setReceiveProductId(null);
        }
    }

    function goToReceive(productId) {
        setReceiveProductId(productId);
        setActiveTab("inventory");
    }

    const tabNavigation = (
        <ProductTabNavigation
            activeTab={activeTab}
            onChangeTab={changeTab}
        />
    );

    return (
        <div className="min-h-screen bg-paper font-kinu text-[#111]">
            <header className="sticky top-0 z-40 border-b border-line bg-white">
                <div className="flex min-h-[68px] items-center justify-between gap-5 px-8 max-[760px]:px-4">
                    <div className="shrink-0">
                        <div className="text-[9px] tracking-[.22em] text-muted">
                            KINU ADMIN
                        </div>

                        <div className="mt-1 text-[16px] font-medium tracking-[.08em]">
                            商品部
                        </div>
                    </div>

                    <AdminHeader />
                </div>
            </header>

            {activeTab === "products" && (
                <ProductHome
                    tabNavigation={tabNavigation}
                />
            )}

            {activeTab === "analytics" && (
                <ProductPanelLayout
                    tabNavigation={tabNavigation}
                >
                    <ProductAnalyticsPanel />
                </ProductPanelLayout>
            )}

            {activeTab === "inventory" && (
                <ProductPanelLayout
                    tabNavigation={tabNavigation}
                >
                    <ProductInventoryPanel
                        initialProductId={receiveProductId}
                    />
                </ProductPanelLayout>
            )}

            {activeTab === "stock-warning" && (
                <ProductPanelLayout
                    tabNavigation={tabNavigation}
                >
                    <ProductStockWarningPanel
                        onReceive={goToReceive}
                    />
                </ProductPanelLayout>
            )}

            {activeTab === "schedule" && (
                <ProductPanelLayout
                    tabNavigation={tabNavigation}
                >
                    <ProductSchedulePanel />
                </ProductPanelLayout>
            )}

            {activeTab === "categories" && (
                <ProductPanelLayout
                    tabNavigation={tabNavigation}
                >
                    <ProductCategoryPanel />
                </ProductPanelLayout>
            )}
        </div>
    );
}

export default ProductDepartmentHome;