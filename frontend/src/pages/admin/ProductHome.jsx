import {
    useEffect,
    useState,
} from "react";
import ProductBatchActionBar from "../../component/admin/product/ProductBatchActionBar.jsx";
import ProductCreateModal from "../../component/admin/product/ProductCreateModal.jsx";
import ProductEditModal from "../../component/admin/product/ProductEditModal.jsx";
import { getAdminToken } from "../../js/admin.js";
import { imgSrc, money, toast } from "../../js/kinu.js";

const PAGE_SIZE = 20;

const STATUS_LABELS = {
    ON_SALE: "上架中",
    OFF_SHELF: "已下架",
};

async function adminRequest(path, options = {}) {
    const response = await fetch(path, {
        ...options,
        headers: {
            Authorization:
                "Bearer " + getAdminToken(),
            ...(options.headers || {}),
        },
    });

    if (!response.ok) {
        let message =
            `連線發生問題（${response.status}）`;

        try {
            const data = await response.json();
            message = data.message || message;
        } catch {
            // 使用預設錯誤訊息
        }

        throw new Error(message);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

function StatusBadge({ status }) {
    const isOnSale = status === "ON_SALE";

    return (
        <span
            className={
                "inline-block shrink-0 border px-2 py-1 text-[11px] " +
                (isOnSale
                    ? "border-black bg-black text-white"
                    : "border-line text-muted")
            }
        >
            {STATUS_LABELS[status] || status}
        </span>
    );
}

function DesktopProductTable({
                                 products,
                                 selectedIds,
                                 updatingId,
                                 batchProcessing,
                                 onToggleOne,
                                 onToggleAll,
                                 onEdit,
                                 onToggleStatus,
                             }) {
    const allSelected =
        products.length > 0 &&
        products.every(product =>
            selectedIds.has(product.id)
        );

    const someSelected =
        products.some(product =>
            selectedIds.has(product.id)
        );

    return (
        <div className="overflow-x-auto border border-line bg-white max-[760px]:hidden">
            <table className="w-full min-w-[980px] text-left text-[13px]">
                <thead className="border-b border-line bg-cream text-[11px] tracking-[.1em] text-muted">
                <tr>
                    <th className="w-[48px] px-4 py-3">
                        <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={onToggleAll}
                            disabled={batchProcessing}
                            aria-label={
                                allSelected
                                    ? "取消選取本頁商品"
                                    : "選取本頁商品"
                            }
                            title={
                                someSelected &&
                                !allSelected
                                    ? "已有部分商品被選取"
                                    : undefined
                            }
                            className="h-4 w-4 accent-black"
                        />
                    </th>

                    <th className="px-4 py-3 font-medium">
                        商品
                    </th>

                    <th className="px-4 py-3 font-medium">
                        分類
                    </th>

                    <th className="px-4 py-3 font-medium">
                        售價
                    </th>

                    <th className="px-4 py-3 font-medium">
                        總庫存
                    </th>

                    <th className="px-4 py-3 font-medium">
                        狀態
                    </th>

                    <th className="px-4 py-3 text-right font-medium">
                        操作
                    </th>
                </tr>
                </thead>

                <tbody>
                {products.map(product => {
                    const selected =
                        selectedIds.has(product.id);

                    const isUpdating =
                        updatingId === product.id;

                    const isOnSale =
                        product.status === "ON_SALE";

                    const busy =
                        batchProcessing ||
                        isUpdating;

                    return (
                        <tr
                            key={product.id}
                            className={
                                "border-b border-line last:border-b-0 " +
                                (selected
                                    ? "bg-cream"
                                    : "hover:bg-paper")
                            }
                        >
                            <td className="px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() =>
                                        onToggleOne(
                                            product.id
                                        )
                                    }
                                    disabled={
                                        batchProcessing
                                    }
                                    aria-label={`選取 ${product.name}`}
                                    className="h-4 w-4 accent-black"
                                />
                            </td>

                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-14 w-14 shrink-0 overflow-hidden bg-cream">
                                        {product.imageUrl && (
                                            <img
                                                src={imgSrc(
                                                    product.imageUrl
                                                )}
                                                alt={
                                                    product.name
                                                }
                                                className="h-full w-full object-cover"
                                            />
                                        )}
                                    </div>

                                    <div>
                                        <div className="font-medium">
                                            {product.name}
                                        </div>

                                        <div className="mt-1 text-[11px] text-muted">
                                            {product.slug}
                                        </div>
                                    </div>
                                </div>
                            </td>

                            <td className="px-4 py-3">
                                <div>
                                    {product.categoryName}
                                </div>

                                <div className="mt-1 text-[11px] text-muted">
                                    {product.categoryCode}
                                </div>
                            </td>

                            <td className="px-4 py-3">
                                {money(product.price)}
                            </td>

                            <td className="px-4 py-3">
                                    <span
                                        className={
                                            product.totalStock === 0
                                                ? "text-[#b0413e]"
                                                : ""
                                        }
                                    >
                                        {product.totalStock}
                                    </span>
                            </td>

                            <td className="px-4 py-3">
                                <StatusBadge
                                    status={product.status}
                                />
                            </td>

                            <td className="px-4 py-3">
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() =>
                                            onEdit(
                                                product.id
                                            )
                                        }
                                        className="border border-line bg-white px-3 py-2 text-[11px] hover:border-black disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        編輯
                                    </button>

                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() =>
                                            onToggleStatus(
                                                product
                                            )
                                        }
                                        className={
                                            "border px-3 py-2 text-[11px] disabled:cursor-not-allowed disabled:opacity-40 " +
                                            (isOnSale
                                                ? "border-line bg-white hover:border-black"
                                                : "border-black bg-black text-white hover:opacity-80")
                                        }
                                    >
                                        {isUpdating
                                            ? "處理中……"
                                            : isOnSale
                                                ? "下架"
                                                : "上架"}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}

function MobileProductCards({
                                products,
                                selectedIds,
                                updatingId,
                                batchProcessing,
                                onToggleOne,
                                onEdit,
                                onToggleStatus,
                            }) {
    return (
        <div className="hidden flex-col gap-3 max-[760px]:flex">
            {products.map(product => {
                const selected =
                    selectedIds.has(product.id);

                const isUpdating =
                    updatingId === product.id;

                const isOnSale =
                    product.status === "ON_SALE";

                const busy =
                    batchProcessing || isUpdating;

                return (
                    <article
                        key={product.id}
                        className={
                            "border p-4 " +
                            (selected
                                ? "border-black bg-cream"
                                : "border-line bg-white")
                        }
                    >
                        <div className="mb-3 flex items-center justify-between border-b border-line pb-3">
                            <label className="flex items-center gap-2 text-[12px]">
                                <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() =>
                                        onToggleOne(
                                            product.id
                                        )
                                    }
                                    disabled={
                                        batchProcessing
                                    }
                                    className="h-4 w-4 accent-black"
                                />

                                選取商品
                            </label>

                            <StatusBadge
                                status={product.status}
                            />
                        </div>

                        <div className="flex gap-3">
                            <div className="h-24 w-20 shrink-0 overflow-hidden bg-cream">
                                {product.imageUrl && (
                                    <img
                                        src={imgSrc(
                                            product.imageUrl
                                        )}
                                        alt={product.name}
                                        className="h-full w-full object-cover"
                                    />
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <h2 className="text-[14px] font-medium leading-5">
                                    {product.name}
                                </h2>

                                <p className="mt-1 break-all text-[11px] text-muted">
                                    {product.slug}
                                </p>

                                <p className="mt-2 text-[12px]">
                                    {product.categoryName}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 border-t border-line pt-3">
                            <div>
                                <div className="text-[10px] text-muted">
                                    售價
                                </div>

                                <div className="mt-1 text-[13px]">
                                    {money(product.price)}
                                </div>
                            </div>

                            <div>
                                <div className="text-[10px] text-muted">
                                    總庫存
                                </div>

                                <div
                                    className={
                                        "mt-1 text-[13px] " +
                                        (product.totalStock === 0
                                            ? "text-[#b0413e]"
                                            : "")
                                    }
                                >
                                    {product.totalStock}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                    onEdit(product.id)
                                }
                                className="border border-line bg-white px-4 py-2.5 text-[12px] hover:border-black disabled:opacity-40"
                            >
                                編輯商品
                            </button>

                            <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                    onToggleStatus(product)
                                }
                                className={
                                    "border px-4 py-2.5 text-[12px] disabled:opacity-40 " +
                                    (isOnSale
                                        ? "border-line bg-white"
                                        : "border-black bg-black text-white")
                                }
                            >
                                {isUpdating
                                    ? "處理中……"
                                    : isOnSale
                                        ? "下架商品"
                                        : "上架商品"}
                            </button>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}

function ProductHome() {
    const [products, setProducts] = useState([]);

    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalProducts, setTotalProducts] =
        useState(0);

    const [keywordInput, setKeywordInput] =
        useState("");
    const [keyword, setKeyword] = useState("");
    const [status, setStatus] = useState("");

    const [selectedIds, setSelectedIds] =
        useState(new Set());

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] =
        useState(null);
    const [batchProcessing, setBatchProcessing] =
        useState(false);

    const [creatingProduct, setCreatingProduct] =
        useState(false);
    const [editingProductId, setEditingProductId] =
        useState(null);
    const [refreshVersion, setRefreshVersion] =
        useState(0);

    useEffect(() => {
        async function loadProducts() {
            setLoading(true);
            setError("");

            try {
                const params = new URLSearchParams({
                    page: String(page),
                    size: String(PAGE_SIZE),
                    sort: "id,desc",
                });

                if (keyword) {
                    params.set("keyword", keyword);
                }

                if (status) {
                    params.set("status", status);
                }

                const data = await adminRequest(
                    `/api/admin/product/products?${params.toString()}`
                );

                setProducts(data.content || []);

                setTotalProducts(
                    data.page?.totalElements || 0
                );

                setTotalPages(
                    data.page?.totalPages || 0
                );
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }

        loadProducts();
    }, [
        page,
        keyword,
        status,
        refreshVersion,
    ]);

    function clearSelection() {
        setSelectedIds(new Set());
    }

    function toggleOne(productId) {
        setSelectedIds(current => {
            const next = new Set(current);

            if (next.has(productId)) {
                next.delete(productId);
            } else {
                next.add(productId);
            }

            return next;
        });
    }

    function toggleAllVisible() {
        setSelectedIds(current => {
            const next = new Set(current);

            const allSelected =
                products.length > 0 &&
                products.every(product =>
                    next.has(product.id)
                );

            if (allSelected) {
                products.forEach(product =>
                    next.delete(product.id)
                );
            } else {
                products.forEach(product =>
                    next.add(product.id)
                );
            }

            return next;
        });
    }

    function handleSearch(event) {
        event.preventDefault();
        clearSelection();
        setPage(0);
        setKeyword(keywordInput.trim());
    }

    function handleStatusChange(event) {
        clearSelection();
        setPage(0);
        setStatus(event.target.value);
    }

    function clearFilters() {
        clearSelection();
        setKeywordInput("");
        setKeyword("");
        setStatus("");
        setPage(0);
    }

    function changePage(nextPage) {
        clearSelection();
        setPage(nextPage);
    }

    function openEditor(productId) {
        clearSelection();
        setEditingProductId(productId);
    }

    function handleProductCreated(product) {
        setCreatingProduct(false);
        clearSelection();

        setRefreshVersion(
            current => current + 1
        );

        setEditingProductId(product.id);
    }

    function handleProductEditorClosed() {
        setEditingProductId(null);
        clearSelection();

        setRefreshVersion(
            current => current + 1
        );
    }

    async function updateProductStatus(product) {
        const nextStatus =
            product.status === "ON_SALE"
                ? "OFF_SHELF"
                : "ON_SALE";

        const action =
            nextStatus === "ON_SALE"
                ? "上架"
                : "下架";

        const confirmed = window.confirm(
            `確定要${action}「${product.name}」嗎？`
        );

        if (!confirmed) {
            return;
        }

        setUpdatingId(product.id);

        try {
            await adminRequest(
                `/api/admin/product/products/${product.id}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        status: nextStatus,
                    }),
                }
            );

            toast(
                `「${product.name}」已${action}`
            );

            clearSelection();

            setRefreshVersion(
                current => current + 1
            );
        } catch (e) {
            toast(e.message, true);
        } finally {
            setUpdatingId(null);
        }
    }

    async function updateBatchStatus(nextStatus) {
        if (selectedIds.size === 0) {
            toast("請先選擇商品", true);
            return;
        }

        const action =
            nextStatus === "ON_SALE"
                ? "上架"
                : "下架";

        const confirmed = window.confirm(
            `確定要將選取的 ${selectedIds.size} 件商品整批${action}嗎？`
        );

        if (!confirmed) {
            return;
        }

        setBatchProcessing(true);

        try {
            await adminRequest(
                "/api/admin/product/products/batch-status",
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        productIds:
                            Array.from(selectedIds),
                        status: nextStatus,
                    }),
                }
            );

            toast(
                `已將 ${selectedIds.size} 件商品整批${action}`
            );

            clearSelection();

            setRefreshVersion(
                current => current + 1
            );
        } catch (e) {
            toast(e.message, true);
        } finally {
            setBatchProcessing(false);
        }
    }

    const firstItemNumber =
        totalProducts === 0
            ? 0
            : page * PAGE_SIZE + 1;

    const lastItemNumber = Math.min(
        (page + 1) * PAGE_SIZE,
        totalProducts
    );

    return (
        <div className="min-h-screen bg-paper px-8 py-10 font-kinu text-[#111] max-[760px]:px-4 max-[760px]:py-6">
            <div className="mb-6 flex items-end justify-between gap-4 max-[520px]:items-stretch">
                <div>
                    <div className="text-[10px] tracking-[.22em] text-muted">
                        KINU ADMIN · PRODUCT
                    </div>

                    <h1 className="text-[26px] font-medium tracking-[.08em]">
                        商品列表
                    </h1>

                    <p className="mt-2 text-[12px] text-muted">
                        共 {totalProducts} 件商品
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        setCreatingProduct(true)
                    }
                    disabled={batchProcessing}
                    className="border border-black bg-black px-5 py-2.5 text-[12px] text-white hover:opacity-80 disabled:opacity-40"
                >
                    ＋ 新增商品
                </button>
            </div>

            <div className="mb-4 border border-line bg-white p-4">
                <form
                    onSubmit={handleSearch}
                    className="flex flex-wrap items-end gap-3"
                >
                    <label className="flex min-w-[240px] flex-1 flex-col gap-1.5 max-[760px]:w-full max-[760px]:min-w-0">
                        <span className="text-[11px] text-muted">
                            搜尋商品
                        </span>

                        <input
                            value={keywordInput}
                            onChange={event =>
                                setKeywordInput(
                                    event.target.value
                                )
                            }
                            placeholder="輸入商品名稱或商品貨號"
                            className="w-full border border-line bg-paper px-3 py-2.5 text-[13px] outline-none focus:border-black"
                        />
                    </label>

                    <label className="flex flex-col gap-1.5 max-[760px]:w-full">
                        <span className="text-[11px] text-muted">
                            商品狀態
                        </span>

                        <select
                            value={status}
                            onChange={handleStatusChange}
                            className="min-w-[150px] border border-line bg-paper px-3 py-2.5 text-[13px] max-[760px]:w-full"
                        >
                            <option value="">
                                全部狀態
                            </option>
                            <option value="ON_SALE">
                                上架中
                            </option>
                            <option value="OFF_SHELF">
                                已下架
                            </option>
                        </select>
                    </label>

                    <button
                        type="submit"
                        className="border border-black bg-black px-5 py-2.5 text-[12px] text-white max-[760px]:flex-1"
                    >
                        搜尋
                    </button>

                    {(keyword || status) && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="border border-line px-5 py-2.5 text-[12px] max-[760px]:flex-1"
                        >
                            清除
                        </button>
                    )}
                </form>
            </div>

            <ProductBatchActionBar
                selectedIds={Array.from(selectedIds)}
                processing={batchProcessing}
                onPublish={() =>
                    updateBatchStatus("ON_SALE")
                }
                onUnpublish={() =>
                    updateBatchStatus("OFF_SHELF")
                }
                onClear={clearSelection}
                onCategoryMoved={() => {
                    clearSelection();

                    setRefreshVersion(
                        current => current + 1
                    );
                }}
            />

            {loading && (
                <p className="border border-line bg-white py-10 text-center text-[13px] text-muted">
                    商品資料載入中……
                </p>
            )}

            {error && (
                <p className="border border-[#b0413e] bg-white px-4 py-3 text-[13px] text-[#b0413e]">
                    {error}
                </p>
            )}

            {!loading &&
                !error &&
                products.length === 0 && (
                    <p className="border border-line bg-white py-10 text-center text-[13px] text-muted">
                        沒有符合條件的商品
                    </p>
                )}

            {!loading &&
                !error &&
                products.length > 0 && (
                    <>
                        <DesktopProductTable
                            products={products}
                            selectedIds={selectedIds}
                            updatingId={updatingId}
                            batchProcessing={
                                batchProcessing
                            }
                            onToggleOne={toggleOne}
                            onToggleAll={
                                toggleAllVisible
                            }
                            onEdit={openEditor}
                            onToggleStatus={
                                updateProductStatus
                            }
                        />

                        <MobileProductCards
                            products={products}
                            selectedIds={selectedIds}
                            updatingId={updatingId}
                            batchProcessing={
                                batchProcessing
                            }
                            onToggleOne={toggleOne}
                            onEdit={openEditor}
                            onToggleStatus={
                                updateProductStatus
                            }
                        />
                    </>
                )}

            {!loading &&
                !error &&
                totalProducts > 0 && (
                    <div className="mt-5 flex items-center justify-between gap-4 border border-line bg-white px-4 py-3 max-[520px]:flex-col">
                        <p className="text-[12px] text-muted">
                            顯示第 {firstItemNumber}–
                            {lastItemNumber} 件，共{" "}
                            {totalProducts} 件
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={page === 0}
                                onClick={() =>
                                    changePage(page - 1)
                                }
                                className="border border-line px-4 py-2 text-[12px] disabled:opacity-30"
                            >
                                上一頁
                            </button>

                            <span className="min-w-[90px] text-center text-[12px]">
                                第 {page + 1}／
                                {Math.max(
                                    totalPages,
                                    1
                                )}{" "}
                                頁
                            </span>

                            <button
                                type="button"
                                disabled={
                                    totalPages === 0 ||
                                    page >=
                                    totalPages - 1
                                }
                                onClick={() =>
                                    changePage(page + 1)
                                }
                                className="border border-black bg-black px-4 py-2 text-[12px] text-white disabled:opacity-30"
                            >
                                下一頁
                            </button>
                        </div>
                    </div>
                )}

            {creatingProduct && (
                <ProductCreateModal
                    onClose={() =>
                        setCreatingProduct(false)
                    }
                    onCreated={
                        handleProductCreated
                    }
                />
            )}

            {editingProductId !== null && (
                <ProductEditModal
                    productId={editingProductId}
                    onClose={() =>
                        setEditingProductId(null)
                    }
                    onSaved={
                        handleProductEditorClosed
                    }
                />
            )}
        </div>
    );
}

export default ProductHome;