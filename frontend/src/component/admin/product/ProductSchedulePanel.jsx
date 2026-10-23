import { useState } from "react";
import { getAdminToken } from "../../../js/admin.js";
import { toast } from "../../../js/kinu.js";

async function adminRequest(path, options = {}) {
    const response = await fetch(path, {
        ...options,
        headers: {
            Authorization: "Bearer " + getAdminToken(),
            ...(options.headers || {}),
        },
    });

    if (!response.ok) {
        let message = `連線發生問題（${response.status}）`;

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

function formatDateTime(value) {
    if (!value) {
        return "未設定";
    }

    return new Date(value).toLocaleString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function toDateTimeLocalValue(value) {
    return value ? value.slice(0, 16) : "";
}

function ProductSchedulePanel() {
    const [keywordInput, setKeywordInput] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [loadingProduct, setLoadingProduct] = useState(false);
    const [scheduledOffAt, setScheduledOffAt] = useState("");
    const [saving, setSaving] = useState(false);

    async function searchProducts(event) {
        event.preventDefault();

        setSearching(true);
        setSearchError("");
        setSelectedProduct(null);
        setScheduledOffAt("");

        try {
            const params = new URLSearchParams({
                keyword: keywordInput.trim(),
                status: "ON_SALE",
                page: "0",
                size: "20",
                sort: "id,desc",
            });

            const data = await adminRequest(
                `/api/admin/product/products?${params.toString()}`
            );

            setSearchResults(data.content || []);
        } catch (e) {
            setSearchError(e.message);
        } finally {
            setSearching(false);
        }
    }

    async function selectProduct(productId) {
        setLoadingProduct(true);

        try {
            const [product, schedule] = await Promise.all([
                adminRequest(
                    `/api/admin/product/products/${productId}`
                ),
                adminRequest(
                    `/api/admin/product/product-schedules/${productId}`
                ),
            ]);

            setSelectedProduct(product);
            setScheduledOffAt(
                toDateTimeLocalValue(schedule.scheduledOffAt)
            );
        } catch (e) {
            toast(e.message, true);
        } finally {
            setLoadingProduct(false);
        }
    }

    async function saveSchedule(value = scheduledOffAt) {
        if (!selectedProduct) {
            return;
        }

        setSaving(true);

        try {
            const data = await adminRequest(
                `/api/admin/product/product-schedules/${selectedProduct.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        scheduledOffAt: value || null,
                    }),
                }
            );

            setScheduledOffAt(
                toDateTimeLocalValue(data.scheduledOffAt)
            );

            toast(
                data.scheduledOffAt
                    ? "已設定預定下架時間"
                    : "已清除預定下架時間"
            );
        } catch (e) {
            toast(e.message, true);
        } finally {
            setSaving(false);
        }
    }

    async function clearSchedule() {
        if (!selectedProduct) {
            return;
        }

        const confirmed = window.confirm(
            `確定要清除「${selectedProduct.name}」的預定下架時間嗎？`
        );

        if (!confirmed) {
            return;
        }

        await saveSchedule("");
    }

    return (
        <div className="grid gap-5">
            <section className="border border-line bg-white p-5 max-[600px]:p-4">
                <div className="text-[10px] tracking-[.2em] text-muted">
                    PRODUCT SCHEDULE
                </div>

                <h1 className="mt-1 text-[20px] font-medium tracking-[.06em]">
                    預定自動下架
                </h1>

                <p className="mt-2 text-[12px] leading-5 text-muted">
                    商品維持上架中，到達指定時間後，後端會在一分鐘內自動下架。
                </p>

                <form
                    onSubmit={searchProducts}
                    className="mt-5 flex gap-2 max-[600px]:flex-col"
                >
                    <input
                        value={keywordInput}
                        onChange={event =>
                            setKeywordInput(event.target.value)
                        }
                        placeholder="搜尋上架中的商品名稱或商品貨號"
                        className="min-w-0 flex-1 border border-line bg-paper px-3 py-2.5 text-[13px] outline-none focus:border-black"
                    />

                    <button
                        type="submit"
                        disabled={searching}
                        className="border border-black bg-black px-5 py-2.5 text-[12px] text-white disabled:opacity-40"
                    >
                        {searching ? "搜尋中……" : "搜尋商品"}
                    </button>
                </form>

                {searchError && (
                    <p className="mt-3 text-[12px] text-[#b0413e]">
                        {searchError}
                    </p>
                )}

                {searchResults.length > 0 && (
                    <div className="mt-4 grid gap-2">
                        {searchResults.map(product => (
                            <button
                                key={product.id}
                                type="button"
                                onClick={() => selectProduct(product.id)}
                                className={
                                    "flex items-center justify-between gap-4 border px-4 py-3 text-left hover:border-black " +
                                    (selectedProduct?.id === product.id
                                        ? "border-black bg-cream"
                                        : "border-line bg-white")
                                }
                            >
                                <span className="min-w-0">
                                    <span className="block text-[13px] font-medium">
                                        {product.name}
                                    </span>

                                    <span className="mt-1 block break-all text-[10px] text-muted">
                                        {product.slug}
                                    </span>
                                </span>

                                <span className="shrink-0 text-[11px] text-muted">
                                    庫存 {product.totalStock}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {!searching &&
                    searchResults.length === 0 &&
                    keywordInput.trim() && (
                        <p className="mt-4 text-center text-[12px] text-muted">
                            尚未搜尋或沒有搜尋結果
                        </p>
                    )}
            </section>

            {loadingProduct && (
                <p className="border border-line bg-white py-8 text-center text-[12px] text-muted">
                    商品資料載入中……
                </p>
            )}

            {!loadingProduct && selectedProduct && (
                <section className="border border-line bg-white p-5 max-[600px]:p-4">
                    <h2 className="text-[16px] font-medium">
                        {selectedProduct.name}
                    </h2>

                    <p className="mt-1 break-all text-[11px] text-muted">
                        {selectedProduct.slug}
                    </p>

                    <div className="mt-5 border-y border-line bg-paper px-4 py-3">
                        <div className="text-[10px] text-muted">
                            目前預定下架時間
                        </div>

                        <div className="mt-1 text-[13px]">
                            {formatDateTime(scheduledOffAt)}
                        </div>
                    </div>

                    <label className="mt-5 block">
                        <span className="mb-1.5 block text-[11px] text-muted">
                            新的預定下架時間
                        </span>

                        <input
                            type="datetime-local"
                            value={scheduledOffAt}
                            onChange={event =>
                                setScheduledOffAt(event.target.value)
                            }
                            className="w-full border border-line bg-paper px-3 py-2.5 text-[13px] outline-none focus:border-black"
                        />

                        <span className="mt-1.5 block text-[10px] leading-4 text-muted">
                            留白後儲存，或按下清除時間，都會讓商品持續販售。
                        </span>
                    </label>

                    <div className="mt-5 flex justify-end gap-2 max-[480px]:grid max-[480px]:grid-cols-2">
                        <button
                            type="button"
                            onClick={clearSchedule}
                            disabled={saving || !scheduledOffAt}
                            className="border border-line px-5 py-2.5 text-[12px] disabled:opacity-30"
                        >
                            清除時間
                        </button>

                        <button
                            type="button"
                            onClick={() => saveSchedule()}
                            disabled={saving}
                            className="border border-black bg-black px-5 py-2.5 text-[12px] text-white disabled:opacity-40"
                        >
                            {saving ? "儲存中……" : "儲存設定"}
                        </button>
                    </div>
                </section>
            )}
        </div>
    );
}

export default ProductSchedulePanel;