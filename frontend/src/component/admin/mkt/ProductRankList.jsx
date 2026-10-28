import { useEffect, useState } from "react";
import { adminApi } from "../../../js/admin.js";
import { imgSrc, toast } from "../../../js/kinu.js";
import Pagination from "../../common/Pagination.jsx";
import ToggleButtons from "./ToggleButtons.jsx";

const RANK_OPTIONS = [
    { key: 'hot',  name: '熱銷' },
    { key: 'slow', name: '滯銷' },
];

/**
 * 商品排行，可切換熱銷、滯銷，都依件數排，每頁 10 件（分頁在後端做，換頁只重抓這一塊）
 *   - 熱銷：有賣出的商品，件數多的排前面，有長條（長度 = 跟第 1 名比的比例）
 *   - 滯銷：上架中的商品，件數少的排前面，件數一樣時庫存多的排前面，右邊多顯示庫存
 * range、mainId、subId：商品銷售頁目前的期間和篩選，換了就回到第 1 頁
 * slowCount：上架中一件都沒賣出的商品共幾件
 */
function ProductRankList({ range, mainId, subId, slowCount }) {
    const [rankType, setRankType] = useState('hot');   // RANK_OPTIONS 的 key
    // 第幾頁（從 0 開始）連同「是哪個期間、篩選、排行的頁數」一起記，條件一換就自動回到第 1 頁
    const queryKey = `${range}|${mainId}|${subId}|${rankType}`;
    const [pageState, setPageState] = useState({ queryKey: queryKey, page: 0 });
    const page = pageState.queryKey === queryKey ? pageState.page : 0;
    // 後端回的分頁物件：content = 這一頁的商品，page.totalPages = 總頁數；null = 還沒載入完
    const [rankPage, setRankPage] = useState(null);
    // 熱銷長條的基準：第 1 名的件數（第 2 頁以後也跟第 1 名比）
    const [topQty, setTopQty] = useState(0);

    useEffect(() => {
        const params = new URLSearchParams({ range: range, type: rankType, page: String(page) });
        if (mainId !== null) params.set('main', String(mainId));
        if (subId !== null) params.set('sub', String(subId));
        adminApi(`/api/admin/mkt/sales/products/rank?${params}`)
            .then(result => {
                setRankPage(result);
                if (page === 0) setTopQty(result.content.length > 0 ? result.content[0].qty : 0);
            })
            .catch((e) => toast(e.message, true));
    }, [range, mainId, subId, rankType, page]);

    const isHot = rankType === 'hot';
    const rankList = rankPage ? rankPage.content : [];

    return (
        <div className="mb-6 border border-line bg-white p-6 max-[760px]:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-[14px] font-medium tracking-[.08em]">商品排行</h2>
                    <p className="mt-1 text-[12px] tracking-[.06em] text-muted">
                        {isHot
                            ? '有賣出的商品依賣出件數，最多的排前面'
                            : `上架中的商品依賣出件數，最少的排前面；件數一樣時庫存多的排前面。一件都沒賣出的共 ${slowCount.toLocaleString('zh-TW')} 件`}
                        {rankPage && `・共 ${rankPage.page.totalElements.toLocaleString('zh-TW')} 件`}
                    </p>
                </div>
                <ToggleButtons optionList={RANK_OPTIONS} currentKey={rankType} onChange={setRankType}/>
            </div>
            {rankPage && rankList.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-muted">{isHot ? '這段期間沒有賣出的商品' : '沒有上架中的商品'}</p>
            ) : (
                <ol className="mt-4">
                    {rankList.map(product => (
                        <li key={product.id} className="flex items-center gap-4 border-b border-line py-3 last:border-b-0">
                            <span className={'w-8 text-right text-[14px] font-semibold tabular-nums ' + (product.rank <= 3 ? '' : 'text-muted')}>
                                {product.rank}
                            </span>
                            <img src={imgSrc(product.imageUrl)} alt="" className="h-12 w-12 shrink-0 bg-paper object-cover"/>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center text-[13px] tracking-[.04em]">
                                    <span className="truncate">{product.name}</span>
                                    {product.onSale && (
                                        <span className="ml-2 shrink-0 border border-line px-1.5 py-0.5 text-[11px] text-muted">特價</span>
                                    )}
                                </div>
                                <div className="mt-0.5 text-[12px] tracking-[.04em] text-muted">
                                    {product.mainName} / {product.subName}・NT$ {product.price.toLocaleString('zh-TW')}
                                </div>
                                {isHot && topQty > 0 && (
                                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#e6eef9]">
                                        <div className="h-1.5 rounded-full bg-[#2a78d6]" style={{ width: `${product.qty / topQty * 100}%` }}></div>
                                    </div>
                                )}
                            </div>
                            <div className="w-[120px] shrink-0 text-right tabular-nums max-[560px]:w-[88px]">
                                <div className="text-[14px] font-semibold">{product.qty.toLocaleString('zh-TW')} 件</div>
                                <div className="text-[12px] text-muted">
                                    {isHot ? `NT$ ${product.amount.toLocaleString('zh-TW')}` : `庫存 ${product.stock.toLocaleString('zh-TW')}`}
                                </div>
                            </div>
                        </li>
                    ))}
                </ol>
            )}
            {rankPage && (
                <Pagination page={page} totalPages={rankPage.page.totalPages} scrollToTop={false} marginClass="mt-6"
                            setPage={newPage => setPageState({ queryKey: queryKey, page: newPage })}/>
            )}
        </div>
    )
}

export default ProductRankList;
