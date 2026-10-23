import { useEffect, useState } from "react";
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

function ProductBatchCategoryModal({
                                       productIds,
                                       onClose,
                                       onFinished,
                                   }) {
    const [categories, setCategories] = useState([]);
    const [categoryId, setCategoryId] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadCategories() {
            try {
                const data = await adminRequest(
                    "/api/admin/product/categories"
                );

                setCategories(data || []);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }

        loadCategories();
    }, []);

    async function moveCategory() {
        if (!categoryId) {
            setError("請選擇目的分類");
            return;
        }

        const category = categories.find(
            item => item.id === Number(categoryId)
        );

        const confirmed = window.confirm(
            `確定將選取的 ${productIds.length} 件商品移到「${category?.path || ""}」嗎？`
        );

        if (!confirmed) {
            return;
        }

        setSaving(true);
        setError("");

        try {
            await adminRequest(
                "/api/admin/product/products/batch-category",
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        productIds,
                        categoryId: Number(categoryId),
                    }),
                }
            );

            toast(
                `已將 ${productIds.length} 件商品移動分類`
            );

            onFinished();
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            role="dialog"
            aria-modal="true"
        >
            <div className="w-full max-w-[480px] bg-white">
                <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
                    <div>
                        <div className="text-[10px] tracking-[.2em] text-muted">
                            BATCH CATEGORY
                        </div>

                        <h2 className="mt-1 text-[18px] font-medium">
                            整批移動分類
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        aria-label="關閉"
                        className="flex h-8 w-8 items-center justify-center border border-line text-[18px] hover:border-black disabled:opacity-40"
                    >
                        ×
                    </button>
                </div>

                <div className="px-6 py-5">
                    <p className="text-[13px] text-muted">
                        即將移動 {productIds.length} 件已選取商品。
                    </p>

                    {loading && (
                        <p className="mt-5 text-[12px] text-muted">
                            分類載入中……
                        </p>
                    )}

                    {!loading && (
                        <label className="mt-5 block">
                            <span className="mb-1.5 block text-[11px] text-muted">
                                移動到分類
                            </span>

                            <select
                                value={categoryId}
                                onChange={event =>
                                    setCategoryId(event.target.value)
                                }
                                className="w-full border border-line bg-paper px-3 py-2.5 text-[13px]"
                            >
                                <option value="">
                                    請選擇最底層分類
                                </option>

                                {categories.map(category => (
                                    <option
                                        key={category.id}
                                        value={category.id}
                                    >
                                        {category.path}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}

                    {error && (
                        <p className="mt-4 border border-[#b0413e] px-3 py-2 text-[12px] text-[#b0413e]">
                            {error}
                        </p>
                    )}
                </div>

                <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="border border-line px-5 py-2.5 text-[12px] disabled:opacity-40"
                    >
                        關閉
                    </button>

                    <button
                        type="button"
                        onClick={moveCategory}
                        disabled={loading || saving}
                        className="border border-black bg-black px-5 py-2.5 text-[12px] text-white disabled:opacity-40"
                    >
                        {saving ? "移動中……" : "確認移動"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProductBatchCategoryModal;