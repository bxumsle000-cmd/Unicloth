import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProductCard from "../../component/product/ProductCard.jsx";
import { api, getToken, toast } from "../../js/kinu.js";

function Recommendations() {
    const navigate = useNavigate();
    const loggedIn = Boolean(getToken());

    // null 代表推薦商品仍在載入。
    const [products, setProducts] = useState(null);
    const [likedSet, setLikedSet] = useState(new Set());

    useEffect(() => {
        let ignore = false;

        // 訪客只取得熱門推薦，不呼叫需要登入的收藏 API。
        const wishlistRequest =
            loggedIn
                ? api("/api/wishlist")
                : Promise.resolve([]);

        Promise.all([
            api("/api/recommendations?limit=12"),
            wishlistRequest
        ])
            .then(([recommendations, wishlist]) => {
                if (ignore) {
                    return;
                }

                setProducts(recommendations);
                setLikedSet(
                    new Set(
                        wishlist.map(item => item.slug)
                    )
                );
            })
            .catch(error => {
                if (!ignore) {
                    setProducts([]);
                    toast(error.message, true);
                }
            });

        return () => {
            ignore = true;
        };
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

    return (
        <div className="px-[5.5%] pt-[38px] pb-[90px]
                        max-[760px]:px-[4%] max-[760px]:pt-[26px]">
            {/* 標題與會員功能入口 */}
            <div className="mb-2 text-[10px] tracking-[.22em] text-[#76716c]">
                FOR YOU
            </div>

            <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                    <h1 className="mb-2 text-[clamp(24px,3vw,34px)] font-medium tracking-[.08em]">
                        為你推薦
                    </h1>

                    <p className="text-[11px] leading-6 tracking-[.06em] text-[#76716c]">
                        {loggedIn
                            ? "根據你的瀏覽喜好與熱門商品，挑選可能適合你的款式。"
                            : "先看看目前熱門商品，登入後可獲得個人化推薦。"}
                    </p>
                </div>

                <Link
                    to={
                        loggedIn
                            ? "/recommendation-settings"
                            : "/login"
                    }
                    className="shrink-0 border-b border-[#76716c] pb-1 text-[10px] tracking-[.08em] text-[#76716c]"
                >
                    {loggedIn
                        ? "推薦設定"
                        : "登入取得個人推薦"}
                </Link>
            </div>

            {!products ? (
                <div className="py-24 text-center text-[11px] tracking-[.06em] text-[#76716c]">
                    載入推薦商品中…
                </div>
            ) : products.length === 0 ? (
                <div className="py-24 text-center text-[14px] tracking-[.06em] text-[#76716c]">
                    目前還沒有適合的推薦商品
                </div>
            ) : (
                /* 推薦商品列表 */
                <div className="grid grid-cols-6 gap-x-5 gap-y-9
                                max-[1100px]:grid-cols-3
                                max-[760px]:grid-cols-2
                                max-[760px]:gap-x-3
                                max-[760px]:gap-y-[26px]">
                    {products.map(product => (
                        <ProductCard
                            key={product.slug}
                            product={product}
                            liked={likedSet.has(product.slug)}
                            toggleLike={toggleLike}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Recommendations;