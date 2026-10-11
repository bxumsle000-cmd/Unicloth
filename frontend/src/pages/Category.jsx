import {api} from "../js/kinu.js";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Breadcrumb from "../component/Breadcrumb.jsx";
import SubCategories from "../component/SubCategories.jsx";
import Filters from "../component/Filters.jsx";
import ProductCard from "../component/ProductCard.jsx";
import SortSelect from "../component/SortSelect.jsx";
import Pagination from "../component/Pagination.jsx";

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

    const [products, setProducts] = useState({ content: [], page: null });

    const [filters, setFilters] = useState({ colors: [], sizes: [] });
    useEffect(() => {
        api(`/api/categories/${code}/filters`).then(setFilters);
    }, [code]);

    // 排序：值直接當 sort 參數送給後端，例如 price,asc
    const [sort, setSort] = useState("id,desc");
    // 頁數設定
    const [page, setPage] = useState(0)

    // 使用者選了哪些篩選條件；換分類時清空，避免帶著上一個分類的條件
    // 不用 useEffect 清：effect 在畫面畫完才跑，會先用舊條件打一次 API、價格框也會殘留舊值
    const EMPTY_SELECTED = { colors: [], sizes: [], minPrice: "", maxPrice: "" };
    const [selectedFilters, setSelectedFilters] = useState(EMPTY_SELECTED);
    const [selectedCode, setSelectedCode] = useState(code);
    if (selectedCode !== code) {
        setSelectedCode(code);
        setSelectedFilters(EMPTY_SELECTED);
        setPage(0)
    }

    // 換篩選條件時回到第 0 頁，避免停在條件改變後已經不存在的頁數
    function changeFilters(newFilters) {
        setSelectedFilters(newFilters);
        setPage(0);
    }

    function changeSort(newSort) {
        setSort(newSort);
        setPage(0);
    }

    useEffect(() => {
        const params = new URLSearchParams({ page: page, sort: sort });
        selectedFilters.colors.forEach((color) => params.append("colors", color));
        selectedFilters.sizes.forEach((size) => params.append("sizes", size));
        if (selectedFilters.minPrice !== "") params.append("minPrice", selectedFilters.minPrice);
        if (selectedFilters.maxPrice !== "") params.append("maxPrice", selectedFilters.maxPrice);

        // 條件連續變動時，只採用最後一次請求的結果
        let ignore = false;
        api(`/api/categories/${code}/products?${params}`).then((data) => {
            if (!ignore) setProducts(data);
        });
        return () => { ignore = true; };
    }, [code, sort, selectedFilters,page]);



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
            <Filters key={code} filters={filters} selectedFilters={selectedFilters} setSelectedFilters={changeFilters} />
            {/* 排序 */}
            <SortSelect sort={sort} setSort={changeSort} />
            {/*商品*/}
            <div className="grid grid-cols-6 gap-x-5 gap-y-9
                            max-[1100px]:grid-cols-3 max-[760px]:grid-cols-2 max-[760px]:gap-x-3 max-[760px]:gap-y-[26px]">
                {products.content.map((product) => (
                    <ProductCard key={product.slug} product={product} />
                ))}
            </div>
            {/* 換頁 */}
            <Pagination page={page} totalPages={products.page?.totalPages} setPage={setPage} />
        </main>
    )
}

export default Category;