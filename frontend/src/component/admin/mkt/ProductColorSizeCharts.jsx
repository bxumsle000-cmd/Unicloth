import { useState } from "react";
import SalesBarChart from "./SalesBarChart.jsx";
import ToggleButtons from "./ToggleButtons.jsx";

/**
 * 依顏色、依尺寸的銷售件數圖
 * color：{ topList: 前 10 名顏色, otherCount: 其餘幾種顏色, otherQty: 其餘合計件數 }
 * sizeGroupList：尺寸組別，沒篩選時有「成人」「童裝」兩組可以切換，有篩選時只有一組
 */
function ProductColorSizeCharts({ color, sizeGroupList }) {
    const [sizeGroupKey, setSizeGroupKey] = useState('adult');
    // 篩選後組別可能變了（例如只剩童裝），找不到目前選的就用第一組
    const sizeGroup = sizeGroupList.find(group => group.key === sizeGroupKey) ?? sizeGroupList[0];

    return (
        <div className="mb-6 grid grid-cols-2 gap-6 max-[1100px]:grid-cols-1">
            <div className="border border-line bg-white p-6 max-[760px]:p-4">
                <h2 className="text-[14px] font-medium tracking-[.08em]">依顏色（銷售件數）</h2>
                <p className="mt-1 text-[12px] tracking-[.06em] text-muted">
                    {color.otherCount > 0
                        ? `前 10 名；其餘 ${color.otherCount} 種顏色合計 ${color.otherQty.toLocaleString('zh-TW')} 件`
                        : `共 ${color.topList.length} 種顏色`}
                </p>
                {color.topList.length === 0 ? (
                    <p className="flex h-[300px] items-center justify-center text-[13px] text-muted">這段期間沒有賣出的商品</p>
                ) : (
                    <SalesBarChart labelList={color.topList.map(row => row.name)}
                                   valueList={color.topList.map(row => row.qty)}
                                   textList={color.topList.map(row => row.qty.toLocaleString('zh-TW'))}
                                   hoverTemplate="%{x}<br>%{y:,} 件"/>
                )}
            </div>
            <div className="border border-line bg-white p-6 max-[760px]:p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-[14px] font-medium tracking-[.08em]">依尺寸（銷售件數）</h2>
                    {sizeGroupList.length > 1 && (
                        <ToggleButtons optionList={sizeGroupList} currentKey={sizeGroup.key} onChange={setSizeGroupKey}/>
                    )}
                </div>
                <p className="mt-1 text-[12px] tracking-[.06em] text-muted">{sizeGroup.note}</p>
                {sizeGroup.list.length === 0 ? (
                    <p className="flex h-[300px] items-center justify-center text-[13px] text-muted">這段期間沒有賣出的商品</p>
                ) : (
                    <SalesBarChart labelList={sizeGroup.list.map(row => row.size)}
                                   valueList={sizeGroup.list.map(row => row.qty)}
                                   textList={sizeGroup.list.map(row => row.qty.toLocaleString('zh-TW'))}
                                   hoverTemplate="%{x}<br>%{y:,} 件"/>
                )}
            </div>
        </div>
    )
}

export default ProductColorSizeCharts;
