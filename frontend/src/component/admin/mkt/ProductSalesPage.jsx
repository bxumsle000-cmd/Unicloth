import { useEffect, useState } from "react";
import { SALES_RANGE_OPTIONS, adminApi, fmtDate } from "../../../js/admin.js";
import { toast } from "../../../js/kinu.js";
import ToggleButtons from "./ToggleButtons.jsx";
import SalesFilterBar from "./SalesFilterBar.jsx";
import SalesStatCards from "./SalesStatCards.jsx";
import ProductCategoryCharts from "./ProductCategoryCharts.jsx";
import ProductRankList from "./ProductRankList.jsx";
import ProductColorSizeCharts from "./ProductColorSizeCharts.jsx";

/**
 * 商品銷售子頁面：期間按鈕、篩選列、指標卡片、主／副分類圖、顏色／尺寸圖、熱銷排行、滯銷商品<br>
 * 點分類圖的長條可以篩選，篩選後重新跟 Python 要資料（兩張分類圖本身不受篩選影響）
 */
function ProductSalesPage() {
    const [range, setRange] = useState('30d');     // SALES_RANGE_OPTIONS 的 key
    // 篩選條件：主分類、副分類的 id，null = 不篩選；選副分類時一定也有主分類
    const [mainId, setMainId] = useState(null);
    const [subId, setSubId] = useState(null);
    // 後端回的資料（格式見 analytics/product_sales.py 的 get_product_sales）；null = 還沒載入完
    const [productSales, setProductSales] = useState(null);

    useEffect(() => {
        const params = new URLSearchParams({ range: range });
        if (mainId !== null) params.set('main', String(mainId));
        if (subId !== null) params.set('sub', String(subId));
        adminApi(`/api/admin/mkt/sales/products?${params}`)
            .then(setProductSales)
            .catch((e) => toast(e.message, true));
    }, [range, mainId, subId]);

    // 點主分類：點同一個（而且沒選副分類）就取消，否則換成這個主分類
    function clickMainCategory(category) {
        setMainId(mainId === category.id && subId === null ? null : category.id);
        setSubId(null);
    }

    // 點副分類：點同一個就取消副分類（主分類保留），否則換成這個副分類
    function clickSubCategory(category) {
        if (subId === category.id) {
            setSubId(null);
        } else {
            setMainId(category.mainId);
            setSubId(category.id);
        }
    }

    function clearFilter() {
        setMainId(null);
        setSubId(null);
    }

    return (
        <section>
            {/* 標題 + 期間篩選 */}
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="text-[10px] tracking-[.22em] text-muted">SALES</div>
                    <h1 className="text-[24px] font-medium tracking-[.08em]">商品銷售</h1>
                    {productSales && (
                        <p className="mt-1 text-[12px] tracking-[.06em] text-muted">
                            {fmtDate(productSales.start)} ～ {fmtDate(productSales.end)} ・ 只計算有效訂單（不含未付款、已取消）
                        </p>
                    )}
                </div>
                <ToggleButtons optionList={SALES_RANGE_OPTIONS} currentKey={range} onChange={setRange}/>
            </div>

            {productSales && (
                <>
                    <SalesFilterBar chipList={filterChipList(productSales.filter, clearFilter)} onClear={clearFilter}
                                    hint="目前顯示全部商品。點下方「主分類」或「副分類」的長條，整頁會跟著篩選"/>
                    <SalesStatCards cardList={kpiCardList(productSales.kpi)}
                                    gridClass="grid-cols-3 max-[1100px]:grid-cols-2 max-[560px]:grid-cols-1"/>
                    <ProductCategoryCharts productSales={productSales} mainId={mainId} subId={subId}
                                           onClickMain={clickMainCategory} onClickSub={clickSubCategory}/>
                    <ProductColorSizeCharts color={productSales.color} sizeGroupList={productSales.sizeGroupList}/>
                    <ProductRankList range={range} mainId={mainId} subId={subId} slowCount={productSales.kpi.slowProducts}/>
                </>
            )}
        </section>
    )
}

/** 篩選條件列：「女裝」或「女裝 / 下身類」一個就好（副分類一定搭配主分類），按 ✕ 全部取消；沒篩選回空陣列 */
function filterChipList(filter, clearFilter) {
    if (!filter.main) return [];
    return [{ name: filter.sub ? `${filter.main.name} / ${filter.sub.name}` : filter.main.name, onRemove: clearFilter }];
}

/** 三張指標卡片：銷售件數、有賣出的商品、滯銷商品 */
function kpiCardList(kpi) {
    return [
        { name: '銷售件數', value: kpi.qty.toLocaleString('zh-TW'), note: '' },
        { name: '有賣出的商品', value: kpi.soldProducts.toLocaleString('zh-TW'), note: `/ 上架中 ${kpi.onSaleProducts.toLocaleString('zh-TW')} 件` },
        { name: '滯銷商品', value: kpi.slowProducts.toLocaleString('zh-TW'), note: '上架中但一件都沒賣出，見下方商品排行的「滯銷」' },
    ];
}

export default ProductSalesPage;
