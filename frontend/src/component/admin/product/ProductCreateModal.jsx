import { useEffect, useState } from "react";
import { getAdminToken } from "../../../js/admin.js";
import { money, toast } from "../../../js/kinu.js";

const EMPTY_FORM = {
    productNumber: "",
    name: "",
    description: "",
    price: "",
    origPrice: "",
    categoryId: "",
    newArrival: false,
    hot: false,
};

async function adminRequest(path, options = {}) {
    const token = getAdminToken();

    const response = await fetch(path, {
        ...options,
        headers: {
            Authorization: "Bearer " + token,
            ...(options.headers || {}),
        },
    });

    if (!response.ok) {
        let message =
            "連線發生問題（" +
            response.status +
            "）";

        try {
            const errorData = await response.json();
            message = errorData.message || message;
        } catch {
            // 回應不是 JSON 時使用預設訊息
        }

        throw new Error(message);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

function ProductCreateModal({
                                onClose,
                                onCreated,
                            }) {
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadCategories() {
            setLoading(true);
            setError("");

            try {
                const data = await adminRequest(
                    "/api/admin/product/categories"
                );

                if (active) {
                    setCategories(data || []);
                }
            } catch (e) {
                if (active) {
                    setError(e.message);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadCategories();

        return () => {
            active = false;
        };
    }, []);

    function updateField(event) {
        const {
            name,
            value,
            type,
            checked,
        } = event.target;

        let nextValue =
            type === "checkbox"
                ? checked
                : value;

        if (name === "productNumber") {
            nextValue = value
                .replace(/\D/g, "")
                .slice(0, 6);
        }

        setForm(current => ({
            ...current,
            [name]: nextValue,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const productNumber =
            form.productNumber.trim();

        const name = form.name.trim();
        const price = Number(form.price);
        const categoryId = Number(form.categoryId);

        const origPrice =
            form.origPrice === ""
                ? null
                : Number(form.origPrice);

        if (!/^\d{6}$/.test(productNumber)) {
            toast(
                "商品貨號必須是 6 位數字",
                true
            );
            return;
        }

        if (!name) {
            toast("請輸入商品名稱", true);
            return;
        }

        if (
            !Number.isInteger(price) ||
            price <= 0
        ) {
            toast(
                "售價必須是大於 0 的整數",
                true
            );
            return;
        }

        if (
            origPrice !== null &&
            (
                !Number.isInteger(origPrice) ||
                origPrice <= price
            )
        ) {
            toast(
                "原價必須是高於售價的整數",
                true
            );
            return;
        }

        if (
            !Number.isInteger(categoryId) ||
            categoryId <= 0
        ) {
            toast("請選擇商品分類", true);
            return;
        }

        setSaving(true);

        try {
            const createdProduct =
                await adminRequest(
                    "/api/admin/product/products",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            productNumber,
                            name,
                            description:
                                form.description.trim() ||
                                null,
                            price,
                            origPrice,
                            categoryId,
                            newArrival:
                            form.newArrival,
                            hot: form.hot,
                        }),
                    }
                );

            toast(
                `「${createdProduct.name}」已建立`
            );

            onCreated(createdProduct);
        } catch (e) {
            toast(e.message, true);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
            role="dialog"
            aria-modal="true"
            aria-label="新增商品"
        >
            <div className="max-h-full w-full max-w-[760px] overflow-y-auto border border-line bg-paper">
                <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-white px-6 py-4 max-[600px]:px-4">
                    <div>
                        <div className="text-[10px] tracking-[.2em] text-muted">
                            NEW PRODUCT
                        </div>

                        <h2 className="mt-1 text-[20px] font-medium tracking-[.06em]">
                            新增商品
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        aria-label="關閉"
                        title="關閉"
                        className="flex h-9 w-9 items-center justify-center border border-line text-[24px] font-light leading-none hover:border-black disabled:opacity-40"
                    >
                        ×
                    </button>
                </div>

                {loading && (
                    <p className="px-6 py-12 text-center text-[13px] text-muted">
                        分類資料載入中……
                    </p>
                )}

                {!loading && error && (
                    <div className="p-6 max-[600px]:p-4">
                        <p className="border border-[#b0413e] bg-white px-4 py-3 text-[13px] text-[#b0413e]">
                            {error}
                        </p>
                    </div>
                )}

                {!loading && !error && (
                    <form
                        onSubmit={handleSubmit}
                        className="p-6 max-[600px]:p-4"
                    >
                        <div className="mb-5 border border-line bg-white p-5 max-[600px]:p-4">
                            <div className="mb-5 border border-line bg-cream px-4 py-3 text-[12px] leading-5 text-muted">
                                新商品建立後會先保持下架。
                                下一步會進入編輯視窗，建立 SKU、
                                設定庫存及商品圖片後才能上架。
                            </div>

                            <div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-[11px] tracking-[.1em] text-muted">
                                        商品貨號 *
                                    </span>

                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        name="productNumber"
                                        value={
                                            form.productNumber
                                        }
                                        onChange={
                                            updateField
                                        }
                                        maxLength={6}
                                        placeholder="例如 123456"
                                        className="border border-line bg-paper px-3 py-2.5 text-[14px] outline-none focus:border-black"
                                    />

                                    <span className="text-[10px] text-muted">
                                        請輸入 6 位數字，
                                        建立後不能修改
                                    </span>
                                </label>

                                <label className="flex flex-col gap-1.5">
                                    <span className="text-[11px] tracking-[.1em] text-muted">
                                        商品分類 *
                                    </span>

                                    <select
                                        name="categoryId"
                                        value={
                                            form.categoryId
                                        }
                                        onChange={
                                            updateField
                                        }
                                        className="border border-line bg-paper px-3 py-2.5 text-[13px] outline-none focus:border-black"
                                    >
                                        <option value="">
                                            請選擇分類
                                        </option>

                                        {categories.map(
                                            category => (
                                                <option
                                                    key={
                                                        category.id
                                                    }
                                                    value={
                                                        category.id
                                                    }
                                                >
                                                    {
                                                        category.path
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </label>

                                <label className="col-span-2 flex flex-col gap-1.5 max-[600px]:col-span-1">
                                    <span className="text-[11px] tracking-[.1em] text-muted">
                                        商品名稱 *
                                    </span>

                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={
                                            updateField
                                        }
                                        maxLength={200}
                                        className="border border-line bg-paper px-3 py-2.5 text-[14px] outline-none focus:border-black"
                                    />
                                </label>

                                <label className="flex flex-col gap-1.5">
                                    <span className="text-[11px] tracking-[.1em] text-muted">
                                        售價 *
                                    </span>

                                    <input
                                        type="number"
                                        name="price"
                                        value={form.price}
                                        onChange={
                                            updateField
                                        }
                                        min="1"
                                        step="1"
                                        className="border border-line bg-paper px-3 py-2.5 text-[14px] outline-none focus:border-black"
                                    />
                                </label>

                                <label className="flex flex-col gap-1.5">
                                    <span className="text-[11px] tracking-[.1em] text-muted">
                                        原價
                                    </span>

                                    <input
                                        type="number"
                                        name="origPrice"
                                        value={
                                            form.origPrice
                                        }
                                        onChange={
                                            updateField
                                        }
                                        min="1"
                                        step="1"
                                        placeholder="沒有特價時留空"
                                        className="border border-line bg-paper px-3 py-2.5 text-[14px] outline-none focus:border-black"
                                    />
                                </label>

                                <label className="col-span-2 flex flex-col gap-1.5 max-[600px]:col-span-1">
                                    <span className="text-[11px] tracking-[.1em] text-muted">
                                        商品說明
                                    </span>

                                    <textarea
                                        name="description"
                                        value={
                                            form.description
                                        }
                                        onChange={
                                            updateField
                                        }
                                        rows="6"
                                        className="resize-y border border-line bg-paper px-3 py-2.5 text-[13px] leading-6 outline-none focus:border-black"
                                    />
                                </label>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-5 border-t border-line pt-4">
                                <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                                    <input
                                        type="checkbox"
                                        name="newArrival"
                                        checked={
                                            form.newArrival
                                        }
                                        onChange={
                                            updateField
                                        }
                                        className="accent-black"
                                    />
                                    新品標籤
                                </label>

                                <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                                    <input
                                        type="checkbox"
                                        name="hot"
                                        checked={
                                            form.hot
                                        }
                                        onChange={
                                            updateField
                                        }
                                        className="accent-black"
                                    />
                                    熱門標籤
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 max-[480px]:flex-col-reverse">
                            <span className="text-[12px] text-muted">
                                售價預覽：
                                {money(
                                    Number(form.price) || 0
                                )}
                            </span>

                            <div className="flex gap-2 max-[480px]:w-full">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={saving}
                                    className="border border-line bg-white px-5 py-2.5 text-[12px] hover:border-black disabled:opacity-40 max-[480px]:flex-1"
                                >
                                    取消
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="border border-black bg-black px-5 py-2.5 text-[12px] tracking-[.1em] text-white hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 max-[480px]:flex-1"
                                >
                                    {saving
                                        ? "建立中……"
                                        : "建立商品"}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default ProductCreateModal;