import SalesBarChart from "./SalesBarChart.jsx";

/**
 * 商品銷售的主分類、副分類銷售額圖，點長條可以篩選
 * productSales：後端回的資料，用到 mainCategoryList、subCategoryList
 * mainId、subId：目前篩選的主分類、副分類 id（被選到的長條維持原色，其他變淡）
 * onClickMain、onClickSub：點長條時呼叫，傳入那個分類
 */
function ProductCategoryCharts({ productSales, mainId, subId, onClickMain, onClickSub }) {
    const mainList = productSales.mainCategoryList;
    const subList = productSales.subCategoryList;

    return (
        <div className="mb-6 grid grid-cols-[2fr_3fr] gap-6 max-[1100px]:grid-cols-1">
            <div className="border border-line bg-white p-6 max-[760px]:p-4">
                <h2 className="text-[14px] font-medium tracking-[.08em]">主分類銷售額</h2>
                <p className="mt-1 text-[12px] tracking-[.06em] text-muted">點長條可以篩選，再點一次取消</p>
                <SalesBarChart labelList={mainList.map(category => category.name)}
                               valueList={mainList.map(category => category.amount)}
                               textList={mainList.map(category => `${category.percent.toFixed(1)}%`)}
                               hoverTemplate="%{x}<br>NT$ %{y:,}"
                               isSelectedList={mainList.map(category => category.id === mainId)}
                               onClickBar={index => onClickMain(mainList[index])}/>
            </div>
            <div className="border border-line bg-white p-6 max-[760px]:p-4">
                <h2 className="text-[14px] font-medium tracking-[.08em]">副分類銷售額</h2>
                <p className="mt-1 text-[12px] tracking-[.06em] text-muted">
                    {productSales.filter.main
                        ? `${productSales.filter.main.name}底下有賣出的副分類；點長條可以再篩選`
                        : '全部副分類的前 10 名；點長條可以篩選'}
                </p>
                {subList.length === 0 ? (
                    <p className="flex h-[300px] items-center justify-center text-[13px] text-muted">這段期間沒有賣出的商品</p>
                ) : (
                    <SalesBarChart horizontal
                                   // 沒選主分類時，不同主分類可能有同名的副分類（例如都有「外套類」），所以名稱前面加主分類
                                   labelList={subList.map(category => productSales.filter.main ? category.name : `${category.mainName}・${category.name}`)}
                                   valueList={subList.map(category => category.amount)}
                                   textList={subList.map(category => `NT$ ${category.amount.toLocaleString('zh-TW')}`)}
                                   hoverTemplate="%{y}<br>NT$ %{x:,}"
                                   isSelectedList={subList.map(category => category.id === subId)}
                                   onClickBar={index => onClickSub(subList[index])}/>
                )}
            </div>
        </div>
    )
}

export default ProductCategoryCharts;
