import {api} from "../js/kinu.js";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Breadcrumb from "../component/Breadcrumb.jsx";
import SubCategories from "../component/SubCategories.jsx";
import Filters from "../component/Filters.jsx";
import ProductCard from "../component/ProductCard.jsx";

function Category(){
    const {code} = useParams();

    const [category, setCategory] = useState(null);
    useEffect(() => {
        api(`/api/categories/${code}`).then(setCategory);
    }, [code]);

    const [breadcrumb, setBreadcrumb] = useState([]);
    useEffect(() => {
        api(`/api/categories/${code}/breadcrumb`).then(setBreadcrumb);
    }, [code]);

    const [filters, setFilters] = useState({ colors: [], sizes: [] });
    useEffect(() => {
        api(`/api/categories/${code}/filters`).then(setFilters);
    }, [code]);

    const [products, setProducts] = useState({ content: [], page: null });
    useEffect(() => {
        api(`/api/categories/${code}/products?page=0`).then(setProducts);
    }, [code]);

    if (!category) return <div className="flex-1 py-24 text-center text-[11px] tracking-[.06em] text-[#76716c]">載入中…</div>;
    return(
        <main className="px-[5.5%] pt-[38px] pb-[90px]
        max-[760px]:px-[4%] max-[760px]:pt-[26px] max-[760px]:pb-[70px]">
            <Breadcrumb breadcrumb={breadcrumb} />
            {/* 標題區 */}
            <h1 className="mt-2.5 mb-1.5 text-[clamp(24px,3vw,34px)] font-medium tracking-[.08em]">{category.name}</h1>
            {/* 下一層分類 */}
            <SubCategories children={category.children} />
            {/* 篩選面板 */}
            <div className="pt-[18px]">
                <Filters filters={filters} />
            </div>
            {/*商品*/}
            <div className="grid grid-cols-6 gap-x-5 gap-y-9
                            max-[1100px]:grid-cols-3 max-[760px]:grid-cols-2 max-[760px]:gap-x-3 max-[760px]:gap-y-[26px]">
                {products.content.map((product) => (
                    <ProductCard key={product.slug} product={product} />
                ))}
            </div>

        </main>
    )
}

export default Category;