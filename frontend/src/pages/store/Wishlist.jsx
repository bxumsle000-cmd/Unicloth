import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CiHeart } from "react-icons/ci";
import {api, toast} from "../../js/kinu.js";
import WishListCard from "../../component/WishListCard.jsx";

function Wishlist(){
    const  [wishlist,setWishlist] = useState([])
    useEffect(()=>{
        api(`/api/wishlist`).then(setWishlist);
    },[] )

    // 取消收藏：後端刪掉成功後，再把這件從畫面上的清單拿掉
    async function remove(slug){
        try {
            await api(`/api/wishlist/${slug}`, { method: 'DELETE' });
            setWishlist(wishlist.filter((item) => item.slug !== slug));
            toast('已取消收藏');
        } catch (e) {
            toast(e.message, true);
        }
    }

    return (
        <div className="px-[5.5%] pt-[38px] pb-[90px]
                        max-[760px]:px-[4%] max-[760px]:pt-[26px] max-[760px]:pb-[70px]">
            {/* 標題區 */}
            <div className="mb-8 flex items-baseline gap-4 border-b border-[#e5e0d8] pb-5 max-[760px]:mb-6">
                <h1 className="text-[clamp(24px,3vw,34px)] font-medium tracking-[.08em]">收藏</h1>
                <span className="text-[15px] tracking-[.06em] text-[#76716c]">共 {wishlist.length} 件商品</span>
            </div>

            {wishlist.length === 0 ? (
                /* 沒有收藏 */
                <div className="flex min-h-[45vh] flex-col items-center justify-center gap-5 text-center">
                    <CiHeart className="size-[46px] text-[#b5ada3]" />
                    <p className="text-[15px] tracking-[.06em] text-[#76716c]">目前沒有收藏的商品</p>
                    <Link to="/"
                          className="border border-black px-8 py-3 text-[12px] tracking-[.18em]
                                     transition-colors hover:bg-black hover:text-white">
                        去逛逛
                    </Link>
                </div>
            ) : (
                /* 商品 */
                <section className="grid grid-cols-6 gap-x-5 gap-y-9
                            max-[1100px]:grid-cols-3 max-[760px]:grid-cols-2 max-[760px]:gap-x-3 max-[760px]:gap-y-[26px]">
                    {wishlist.map((list)=>(
                        <WishListCard key={list.slug} list={list} remove={remove} />
                    ))}
                </section>
            )}
        </div>
    )
}

export default Wishlist
