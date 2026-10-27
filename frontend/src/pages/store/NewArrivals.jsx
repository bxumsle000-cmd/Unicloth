import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../../component/store/product/ProductCard.jsx";
import SortSelect from "../../component/store/product/SortSelect.jsx";
import Pagination from "../../component/common/Pagination.jsx";
import { api, getToken, toast } from "../../js/kinu.js";

function NewArrivals() {
    const navigate = useNavigate();
    const loggedIn = Boolean(getToken());

    // 已收藏的商品 slug；訪客不呼叫會員收藏 API。
    const [likedSet, setLikedSet] = useState(new Set());
    useEffect(() => {
        if (!loggedIn) {
            return;
        }

        api("/api/wishlist")
            .then(list =>
                setLikedSet(
                    new Set(
                        list.map(item => item.slug)
                    )
                )
            )
            .catch(() => {});
    }, [loggedIn]);

    // 收藏是會員功能，訪客按愛心時前往登入頁。
    async function toggleLike(slug) {
        if (!loggedIn) {
            navigate("/login");
            return;
        }

        const liked = likedSet.has(slug);

        try {
            await api(
                `/api/wishlist/${slug}`,
                { method: liked ? "DELETE" : "POST" }
            );

            setLikedSet(current => {
                const next = new Set(current);

                if (liked) {
                    next.delete(slug);
                } else {
                    next.add(slug);
                }

                return next;
            });

            toast(
                liked
                    ? "已取消收藏"
                    : "已加入收藏"
            );
        } catch (error) {
            toast(error.message, true);
        }
    }

    // 新品預設由新到舊，也可切換價格排序。
    const [sort, setSort] = useState("id,desc");
    const [page, setPage] = useState(0);
    const [products, setProducts] = useState(null);

    function changeSort(newSort) {
        setSort(newSort);
        setPage(0);
    }

    useEffect(() => {
        const params = new URLSearchParams({
            page: page,
            sort: sort
        });
        let ignore = false;

        setProducts(null);

        api(`/api/products/new-arrivals?${params}`)
            .then(data => {
                if (!ignore) {
                    setProducts(data);
                }
            })
            .catch(error => {
                if (!ignore) {
                    setProducts({
                        content: [],
                        page: { totalElements: 0 }
                    });
                    toast(error.message, true);
                }
            });

        return () => {
            ignore = true;
        };
    }, [sort, page]);

    const totalCount =
        products?.page?.totalElements ?? 0;

    return (
        <div className="px-[5.5%] pt-[38px] pb-[90px]
                        max-[760px]:px-[4%]
                        max-[760px]:pt-[26px]
                        max-[760px]:pb-[70px]">
            {/* 標題區 */}
            <div className="mb-2 text-[10px] tracking-[.22em] text-[#76716c]">
                NEW ARRIVALS
            </div>

            <h1 className="mb-1.5 text-[clamp(24px,3vw,34px)] font-medium tracking-[.08em]">
                新品
            </h1>

            {products && (
                <p className="mb-6 text-[12px] tracking-[.06em] text-[#76716c]">
                    共 {totalCount} 件
                </p>
            )}

            {!products ? (
                <div className="py-24 text-center text-[11px] tracking-[.06em] text-[#76716c]">
                    載入新品中…
                </div>
            ) : totalCount === 0 ? (
                <div className="py-24 text-center text-[15px] tracking-[.06em] text-[#76716c]">
                    目前沒有新品
                </div>
            ) : (
                <>
                    {/* 排序 */}
                    <SortSelect
                        sort={sort}
                        setSort={changeSort}
                    />

                    {/* 新品列表 */}
                    <div className="grid grid-cols-6 gap-x-5 gap-y-9
                                    max-[1100px]:grid-cols-3
                                    max-[760px]:grid-cols-2
                                    max-[760px]:gap-x-3
                                    max-[760px]:gap-y-[26px]">
                        {products.content.map(product => (
                            <ProductCard
                                key={product.slug}
                                product={product}
                                liked={likedSet.has(product.slug)}
                                toggleLike={toggleLike}
                            />
                        ))}
                    </div>

                    {/* 換頁 */}
                    <Pagination
                        page={page}
                        totalPages={products.page?.totalPages}
                        setPage={setPage}
                    />
                </>
            )}
        </div>
    );
}

export default NewArrivals;