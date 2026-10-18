import { api, toast } from "../../js/kinu.js";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../../component/product/ProductCard.jsx";
import SortSelect from "../../component/product/SortSelect.jsx";
import Pagination from "../../component/product/Pagination.jsx";

function Search() {
    // 關鍵字從網址讀：/search?keyword=外套
    const [searchParams] = useSearchParams();
    const keyword = (searchParams.get("keyword") || "").trim();

    // 已收藏的商品 slug；進頁面抓一次就好，換頁、換排序都不會變
    const [likedSet, setLikedSet] = useState(new Set());
    useEffect(() => {
        api(`/api/wishlist`)
            .then(list => setLikedSet(new Set(list.map(item => item.slug))))
            .catch(() => {});   // 沒登入就當作都沒收藏
    }, []);

    // 按愛心：已收藏就取消，沒收藏就加入；後端成功才換愛心
    async function toggleLike(slug) {
        const liked = likedSet.has(slug);
        try {
            await api(`/api/wishlist/${slug}`, { method: liked ? 'DELETE' : 'POST' });
            const next = new Set(likedSet);   // 複製一份新的，React 才知道有變
            if (liked) {next.delete(slug);
            } else
            {next.add(slug);}
            setLikedSet(next);
            toast(liked ? '已取消收藏' : '已加入收藏');
        } catch (e) {
            toast(e.message, true);
        }
    }

    // 排序：值直接當 sort 參數送給後端，例如 price,asc
    const [sort, setSort] = useState("id,desc");
    const [page, setPage] = useState(0);

    // 換關鍵字時回到第 0 頁，避免停在新結果不存在的頁數
    const [searchedKeyword, setSearchedKeyword] = useState(keyword);
    if (searchedKeyword !== keyword) {
        setSearchedKeyword(keyword);
        setPage(0);
    }

    function changeSort(newSort) {
        setSort(newSort);
        setPage(0);
    }

    // products 為 null 代表還在載入
    const [products, setProducts] = useState(null);
    useEffect(() => {
        const params = new URLSearchParams({ keyword: keyword, page: page, sort: sort });

        // 條件連續變動時，只採用最後一次請求的結果
        let ignore = false;
        api(`/api/products?${params}`)
            .then((data) => {
                if (!ignore) setProducts(data);
            })
            .catch((e) => toast(e.message, true));
        return () => { ignore = true; };
    }, [keyword, sort, page]);

    const totalCount = products?.page?.totalElements ?? 0;

    return (
        <div className="px-[5.5%] pt-[38px] pb-[90px]
        max-[760px]:px-[4%] max-[760px]:pt-[26px] max-[760px]:pb-[70px]">
            {/* 標題區 */}
            <div className="mb-2 text-[10px] tracking-[.22em] text-[#76716c]">SEARCH</div>
            <h1 className="mb-1.5 text-[clamp(24px,3vw,34px)] font-medium tracking-[.08em]">
                「{keyword}」的搜尋結果
            </h1>
            {products && <p className="mb-6 text-[12px] tracking-[.06em] text-[#76716c]">共 {totalCount} 件</p>}

            {!products ? (
                <div className="py-24 text-center text-[11px] tracking-[.06em] text-[#76716c]">載入中…</div>
            ) : totalCount === 0 ? (
                <div className="py-24 text-center text-[15px] tracking-[.06em] text-[#76716c]">找不到符合的商品</div>
            ) : (
                <>
                    {/* 排序 */}
                    <SortSelect sort={sort} setSort={changeSort} />
                    {/* 商品 */}
                    <div className="grid grid-cols-6 gap-x-5 gap-y-9
                                    max-[1100px]:grid-cols-3 max-[760px]:grid-cols-2 max-[760px]:gap-x-3 max-[760px]:gap-y-[26px]">
                        {products.content.map((product) => (
                            <ProductCard key={product.slug} product={product}
                                         liked={likedSet.has(product.slug)} toggleLike={toggleLike} />
                        ))}
                    </div>
                    {/* 換頁 */}
                    <Pagination page={page} totalPages={products.page?.totalPages} setPage={setPage} />
                </>
            )}
        </div>
    )
}

export default Search;
