import { useEffect, useRef, useState } from "react";
import { getAdminToken } from "../../../js/admin.js";
import { money, toast } from "../../../js/kinu.js";

const EMPTY_FORM = {
    name: "",
    description: "",
    price: "",
    origPrice: "",
    categoryId: "",
    newArrival: false,
    hot: false,
};

function emptyVariantRow() {
    return {
        size: "",
        stock: "0",
    };
}

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

function imageSrc(url) {
    if (!url) {
        return "";
    }

    if (
        url.startsWith("/") ||
        url.startsWith("http://") ||
        url.startsWith("https://")
    ) {
        return url;
    }

    return "/" + url;
}

function createStockValues(product) {
    return Object.fromEntries(
        (product?.variants || []).map(variant => [
            variant.id,
            String(variant.stock ?? 0),
        ])
    );
}

function ProductEditModal({
                              productId,
                              onClose,
                              onSaved,
                          }) {
    const fileInputRef = useRef(null);

    const [product, setProduct] = useState(null);
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [stockValues, setStockValues] = useState({});

    const [color, setColor] = useState("");
    const [colorCode, setColorCode] = useState("");
    const [image, setImage] = useState(null);
    const [variantRows, setVariantRows] = useState([
        emptyVariantRow(),
    ]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [savingBasic, setSavingBasic] = useState(false);
    const [savingVariants, setSavingVariants] =
        useState(false);
    const [savingStock, setSavingStock] = useState(false);
    const [deletingVariantId, setDeletingVariantId] =
        useState(null);

    const busy =
        savingBasic ||
        savingVariants ||
        savingStock ||
        deletingVariantId !== null;

    useEffect(() => {
        let active = true;

        async function loadData() {
            setLoading(true);
            setError("");

            try {
                const [productData, categoryData] =
                    await Promise.all([
                        adminRequest(
                            `/api/admin/product/products/${productId}`
                        ),
                        adminRequest(
                            "/api/admin/product/categories"
                        ),
                    ]);

                if (!active) {
                    return;
                }

                applyProduct(productData);
                setCategories(categoryData || []);
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

        loadData();

        return () => {
            active = false;
        };
    }, [productId]);

    function applyProduct(data) {
        setProduct(data);

        setForm({
            name: data.name || "",
            description: data.description || "",
            price: String(data.price ?? ""),
            origPrice:
                data.origPrice == null
                    ? ""
                    : String(data.origPrice),
            categoryId: String(
                data.categoryId ?? ""
            ),
            newArrival: Boolean(data.newArrival),
            hot: Boolean(data.hot),
        });

        setStockValues(createStockValues(data));
    }

    function updateField(event) {
        const {
            name,
            value,
            type,
            checked,
        } = event.target;

        setForm(current => ({
            ...current,
            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        }));
    }

    function closeEditor() {
        if (busy) {
            return;
        }

        if (product) {
            onSaved(product);
        } else {
            onClose();
        }
    }

    async function saveBasicData() {
        const name = form.name.trim();
        const price = Number(form.price);
        const categoryId = Number(form.categoryId);

        const origPrice =
            form.origPrice === ""
                ? null
                : Number(form.origPrice);

        if (!name) {
            toast("請輸入商品名稱", true);
            return;
        }

        if (
            !Number.isInteger(price) ||
            price <= 0
        ) {
            toast("售價必須是大於 0 的整數", true);
            return;
        }

        if (
            origPrice !== null &&
            (
                !Number.isInteger(origPrice) ||
                origPrice <= price
            )
        ) {
            toast("原價必須高於售價", true);
            return;
        }

        if (
            !Number.isInteger(categoryId) ||
            categoryId <= 0
        ) {
            toast("請選擇商品分類", true);
            return;
        }

        setSavingBasic(true);

        try {
            const updated = await adminRequest(
                `/api/admin/product/products/${productId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        name,
                        description:
                            form.description.trim() ||
                            null,
                        price,
                        origPrice,
                        categoryId,
                        newArrival: form.newArrival,
                        hot: form.hot,
                    }),
                }
            );

            applyProduct(updated);
            toast(`「${updated.name}」基本資料已更新`);
        } catch (e) {
            toast(e.message, true);
        } finally {
            setSavingBasic(false);
        }
    }

    function updateVariantRow(index, field, value) {
        setVariantRows(current =>
            current.map((row, rowIndex) =>
                rowIndex === index
                    ? {
                        ...row,
                        [field]: value,
                    }
                    : row
            )
        );
    }

    function addVariantRow() {
        setVariantRows(current => [
            ...current,
            emptyVariantRow(),
        ]);
    }

    function removeVariantRow(index) {
        if (variantRows.length === 1) {
            return;
        }

        setVariantRows(current =>
            current.filter(
                (_, rowIndex) => rowIndex !== index
            )
        );
    }

    function resetVariantForm() {
        setColor("");
        setColorCode("");
        setImage(null);
        setVariantRows([emptyVariantRow()]);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    async function createVariants() {
        const normalizedColor = color.trim();

        const normalizedColorCode = colorCode
            .trim()
            .toUpperCase();

        if (!normalizedColor) {
            toast("請輸入顏色名稱", true);
            return;
        }

        if (
            !/^COL\d{2}$/.test(
                normalizedColorCode
            )
        ) {
            toast(
                "顏色代碼格式必須像 COL09",
                true
            );
            return;
        }

        if (!image) {
            toast("請選擇商品圖片", true);
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(image.type)) {
            toast(
                "圖片只支援 JPG、PNG 或 WEBP",
                true
            );
            return;
        }

        if (image.size > 5 * 1024 * 1024) {
            toast("圖片大小不能超過 5MB", true);
            return;
        }

        const variants = [];
        const usedSizes = new Set();

        for (const row of variantRows) {
            const size = row.size
                .trim()
                .toUpperCase();

            const stock = Number(row.stock);

            if (!size) {
                toast("請輸入尺寸", true);
                return;
            }

            if (usedSizes.has(size)) {
                toast(`尺寸重複：${size}`, true);
                return;
            }

            if (
                !Number.isInteger(stock) ||
                stock < 0
            ) {
                toast(
                    `${size} 的庫存必須是 0 以上的整數`,
                    true
                );
                return;
            }

            usedSizes.add(size);

            variants.push({
                size,
                stock,
            });
        }

        setSavingVariants(true);

        try {
            const formData = new FormData();

            formData.append(
                "colorCode",
                normalizedColorCode
            );

            formData.append("image", image);

            const uploadResult = await adminRequest(
                `/api/admin/product/products/${productId}/images`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const updated = await adminRequest(
                `/api/admin/product/products/${productId}/variants`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        color: normalizedColor,
                        colorCode:
                        normalizedColorCode,
                        imageUrl:
                        uploadResult.imageUrl,
                        variants,
                    }),
                }
            );

            applyProduct(updated);
            resetVariantForm();

            toast(
                `${normalizedColor}的 SKU 已新增`
            );
        } catch (e) {
            toast(e.message, true);
        } finally {
            setSavingVariants(false);
        }
    }

    function updateStockValue(variantId, value) {
        setStockValues(current => ({
            ...current,
            [variantId]: value,
        }));
    }

    async function saveStock() {
        const variants = [];

        for (
            const variant of
        product.variants || []
            ) {
            const stock = Number(
                stockValues[variant.id]
            );

            if (
                !Number.isInteger(stock) ||
                stock < 0
            ) {
                toast(
                    `${variant.color}／${variant.size} 的庫存必須是 0 以上的整數`,
                    true
                );
                return;
            }

            variants.push({
                variantId: variant.id,
                stock,
            });
        }

        if (variants.length === 0) {
            toast("這件商品沒有 SKU", true);
            return;
        }

        setSavingStock(true);

        try {
            const updated = await adminRequest(
                `/api/admin/product/products/${productId}/stock`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        variants,
                    }),
                }
            );

            applyProduct(updated);
            toast(`「${updated.name}」庫存已更新`);
        } catch (e) {
            toast(e.message, true);
        } finally {
            setSavingStock(false);
        }
    }

    function variantDeleteReason(variant) {
        if (product.status !== "OFF_SHELF") {
            return "請先將商品下架";
        }

        if (variant.stock > 0) {
            return `尚有 ${variant.stock} 件庫存`;
        }

        return "";
    }

    async function deleteVariant(variant) {
        const reason = variantDeleteReason(variant);

        if (reason) {
            toast(reason, true);
            return;
        }

        const confirmed = window.confirm(
            `確定刪除 ${variant.color}／${variant.size}？\n\n` +
            `SKU：${variant.skuCode}`
        );

        if (!confirmed) {
            return;
        }

        setDeletingVariantId(variant.id);

        try {
            await adminRequest(
                `/api/admin/product/products/${productId}/variants/${variant.id}`,
                {
                    method: "DELETE",
                }
            );

            const updated = await adminRequest(
                `/api/admin/product/products/${productId}`
            );

            applyProduct(updated);

            toast(
                `${variant.color}／${variant.size} 已刪除`
            );
        } catch (e) {
            toast(e.message, true);
        } finally {
            setDeletingVariantId(null);
        }
    }

    const totalStock = Object.values(
        stockValues
    ).reduce(
        (total, value) =>
            total +
            (
                Number.isFinite(Number(value))
                    ? Number(value)
                    : 0
            ),
        0
    );

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
            role="dialog"
            aria-modal="true"
            aria-label="編輯商品"
        >
            <div className="max-h-full w-full max-w-[900px] overflow-y-auto border border-line bg-paper">
                <header className="sticky top-0 z-10 flex items-start justify-between border-b border-line bg-white px-6 py-4 max-[600px]:px-4">
                    <div>
                        <div className="text-[10px] tracking-[.2em] text-muted">
                            PRODUCT EDITOR
                        </div>

                        <h2 className="mt-1 text-[20px] font-medium tracking-[.06em]">
                            編輯商品
                        </h2>

                        {product && (
                            <p className="mt-1 text-[11px] text-muted">
                                {product.slug}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={closeEditor}
                        disabled={busy}
                        aria-label="關閉"
                        title="關閉"
                        className="flex h-9 w-9 items-center justify-center border border-line text-[24px] leading-none hover:border-black disabled:opacity-40"
                    >
                        ×
                    </button>
                </header>

                {loading && (
                    <p className="px-6 py-12 text-center text-[13px] text-muted">
                        商品資料載入中……
                    </p>
                )}

                {!loading && error && (
                    <div className="p-6 max-[600px]:p-4">
                        <p className="border border-[#b0413e] bg-white px-4 py-3 text-[13px] text-[#b0413e]">
                            {error}
                        </p>
                    </div>
                )}

                {!loading &&
                    !error &&
                    product && (
                        <div className="p-6 max-[600px]:p-4">
                            {/* 基本資料 */}
                            <section className="mb-5 border border-line bg-white p-5 max-[600px]:p-4">
                                <h3 className="mb-4 text-[14px] font-medium tracking-[.1em]">
                                    基本資料
                                </h3>

                                <div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
                                    <label className="col-span-2 flex flex-col gap-1.5 max-[600px]:col-span-1">
                                        <span className="text-[11px] text-muted">
                                            商品名稱 *
                                        </span>

                                        <input
                                            name="name"
                                            value={form.name}
                                            onChange={updateField}
                                            maxLength={200}
                                            className="border border-line bg-paper px-3 py-2.5 text-[14px] outline-none focus:border-black"
                                        />
                                    </label>

                                    <label className="flex flex-col gap-1.5">
                                        <span className="text-[11px] text-muted">
                                            商品代碼
                                        </span>

                                        <input
                                            value={product.slug}
                                            disabled
                                            className="border border-line bg-cream px-3 py-2.5 text-[13px] text-muted"
                                        />
                                    </label>

                                    <label className="flex flex-col gap-1.5">
                                        <span className="text-[11px] text-muted">
                                            商品分類 *
                                        </span>

                                        <select
                                            name="categoryId"
                                            value={form.categoryId}
                                            onChange={updateField}
                                            className="border border-line bg-paper px-3 py-2.5 text-[13px] outline-none focus:border-black"
                                        >
                                            <option value="">
                                                請選擇分類
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

                                    <label className="flex flex-col gap-1.5">
                                        <span className="text-[11px] text-muted">
                                            售價 *
                                        </span>

                                        <input
                                            type="number"
                                            name="price"
                                            value={form.price}
                                            onChange={updateField}
                                            min="1"
                                            step="1"
                                            className="border border-line bg-paper px-3 py-2.5 text-[14px] outline-none focus:border-black"
                                        />
                                    </label>

                                    <label className="flex flex-col gap-1.5">
                                        <span className="text-[11px] text-muted">
                                            原價
                                        </span>

                                        <input
                                            type="number"
                                            name="origPrice"
                                            value={form.origPrice}
                                            onChange={updateField}
                                            min="1"
                                            step="1"
                                            placeholder="沒有特價時留空"
                                            className="border border-line bg-paper px-3 py-2.5 text-[14px] outline-none focus:border-black"
                                        />
                                    </label>

                                    <label className="col-span-2 flex flex-col gap-1.5 max-[600px]:col-span-1">
                                        <span className="text-[11px] text-muted">
                                            商品說明
                                        </span>

                                        <textarea
                                            name="description"
                                            value={form.description}
                                            onChange={updateField}
                                            rows="6"
                                            className="resize-y border border-line bg-paper px-3 py-2.5 text-[13px] leading-6 outline-none focus:border-black"
                                        />
                                    </label>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-5 border-t border-line pt-4">
                                    <label className="flex items-center gap-2 text-[13px]">
                                        <input
                                            type="checkbox"
                                            name="newArrival"
                                            checked={form.newArrival}
                                            onChange={updateField}
                                            className="accent-black"
                                        />
                                        新品標籤
                                    </label>

                                    <label className="flex items-center gap-2 text-[13px]">
                                        <input
                                            type="checkbox"
                                            name="hot"
                                            checked={form.hot}
                                            onChange={updateField}
                                            className="accent-black"
                                        />
                                        熱門標籤
                                    </label>
                                </div>

                                <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4 max-[480px]:flex-col">
                                    <span className="text-[12px] text-muted">
                                        售價預覽：
                                        {money(
                                            Number(form.price) ||
                                            0
                                        )}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={saveBasicData}
                                        disabled={busy}
                                        className="border border-black bg-black px-5 py-2.5 text-[12px] text-white disabled:opacity-40 max-[480px]:w-full"
                                    >
                                        {savingBasic
                                            ? "儲存中……"
                                            : "儲存基本資料"}
                                    </button>
                                </div>
                            </section>

                            {/* 新增 SKU */}
                            <section className="mb-5 border border-line bg-white p-5 max-[600px]:p-4">
                                <h3 className="text-[14px] font-medium tracking-[.1em]">
                                    新增顏色與尺寸
                                </h3>

                                <p className="mt-2 text-[12px] text-muted">
                                    一個顏色上傳一張圖片，再加入販售尺寸。
                                </p>

                                <div className="mt-4 grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
                                    <label className="flex flex-col gap-1.5">
                                        <span className="text-[11px] text-muted">
                                            顏色名稱 *
                                        </span>

                                        <input
                                            value={color}
                                            onChange={event =>
                                                setColor(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="例如：黑色"
                                            className="border border-line bg-paper px-3 py-2.5 text-[13px] outline-none focus:border-black"
                                        />
                                    </label>

                                    <label className="flex flex-col gap-1.5">
                                        <span className="text-[11px] text-muted">
                                            顏色代碼 *
                                        </span>

                                        <input
                                            value={colorCode}
                                            onChange={event =>
                                                setColorCode(
                                                    event.target.value
                                                        .toUpperCase()
                                                )
                                            }
                                            maxLength={5}
                                            placeholder="例如：COL09"
                                            className="border border-line bg-paper px-3 py-2.5 text-[13px] uppercase outline-none focus:border-black"
                                        />
                                    </label>

                                    <label className="col-span-2 flex flex-col gap-1.5 max-[600px]:col-span-1">
                                        <span className="text-[11px] text-muted">
                                            商品圖片 *
                                        </span>

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                            onChange={event =>
                                                setImage(
                                                    event.target
                                                        .files?.[0] ||
                                                    null
                                                )
                                            }
                                            className="border border-line bg-paper px-3 py-2.5 text-[12px]"
                                        />

                                        <span className="text-[10px] text-muted">
                                            JPG、PNG、WEBP，最大 5MB
                                        </span>
                                    </label>
                                </div>

                                <div className="mt-5 border-t border-line pt-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <span className="text-[11px] text-muted">
                                            尺寸與初始庫存
                                        </span>

                                        <button
                                            type="button"
                                            onClick={addVariantRow}
                                            disabled={busy}
                                            className="border border-line px-3 py-1.5 text-[11px] hover:border-black disabled:opacity-40"
                                        >
                                            ＋ 增加尺寸
                                        </button>
                                    </div>

                                    <div className="grid gap-3">
                                        {variantRows.map(
                                            (row, index) => (
                                                <div
                                                    key={index}
                                                    className="grid grid-cols-[1fr_150px_42px] gap-3 max-[520px]:grid-cols-[1fr_100px_38px]"
                                                >
                                                    <input
                                                        value={row.size}
                                                        onChange={event =>
                                                            updateVariantRow(
                                                                index,
                                                                "size",
                                                                event.target
                                                                    .value
                                                            )
                                                        }
                                                        placeholder="尺寸，例如 S"
                                                        className="min-w-0 border border-line bg-paper px-3 py-2 text-[13px] uppercase outline-none focus:border-black"
                                                    />

                                                    <input
                                                        type="number"
                                                        value={row.stock}
                                                        onChange={event =>
                                                            updateVariantRow(
                                                                index,
                                                                "stock",
                                                                event.target
                                                                    .value
                                                            )
                                                        }
                                                        min="0"
                                                        step="1"
                                                        aria-label="初始庫存"
                                                        className="min-w-0 border border-line bg-paper px-3 py-2 text-[13px] outline-none focus:border-black"
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeVariantRow(
                                                                index
                                                            )
                                                        }
                                                        disabled={
                                                            busy ||
                                                            variantRows.length ===
                                                            1
                                                        }
                                                        aria-label="移除尺寸"
                                                        className="border border-line text-[18px] disabled:opacity-30"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="mt-5 flex justify-end border-t border-line pt-4">
                                    <button
                                        type="button"
                                        onClick={createVariants}
                                        disabled={busy}
                                        className="border border-black bg-black px-5 py-2.5 text-[12px] text-white disabled:opacity-40 max-[480px]:w-full"
                                    >
                                        {savingVariants
                                            ? "圖片與 SKU 儲存中……"
                                            : "新增這個顏色的 SKU"}
                                    </button>
                                </div>
                            </section>

                            {/* SKU 與庫存 */}
                            <section className="mb-5 border border-line bg-white p-5 max-[600px]:p-4">
                                <div className="flex items-end justify-between gap-4 max-[600px]:flex-col max-[600px]:items-stretch">
                                    <div>
                                        <h3 className="text-[14px] font-medium tracking-[.1em]">
                                            SKU 庫存
                                        </h3>

                                        <p className="mt-2 text-[12px] text-muted">
                                            共{" "}
                                            {product.variants
                                                ?.length || 0}{" "}
                                            個 SKU，總庫存{" "}
                                            {totalStock} 件
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={saveStock}
                                        disabled={
                                            busy ||
                                            !product.variants
                                                ?.length
                                        }
                                        className="border border-black bg-black px-5 py-2.5 text-[12px] text-white disabled:opacity-40"
                                    >
                                        {savingStock
                                            ? "儲存中……"
                                            : "儲存庫存"}
                                    </button>
                                </div>

                                {!product.variants?.length && (
                                    <p className="mt-4 border border-line bg-paper px-4 py-6 text-center text-[12px] text-muted">
                                        尚未建立 SKU
                                    </p>
                                )}

                                <div className="mt-4 grid gap-3">
                                    {(product.variants || []).map(
                                        variant => {
                                            const reason =
                                                variantDeleteReason(
                                                    variant
                                                );

                                            return (
                                                <article
                                                    key={variant.id}
                                                    className="grid grid-cols-[64px_1fr_120px_76px] items-center gap-3 border border-line bg-paper p-3 max-[650px]:grid-cols-[56px_1fr]"
                                                >
                                                    {variant.imageUrl ? (
                                                        <img
                                                            src={imageSrc(
                                                                variant.imageUrl
                                                            )}
                                                            alt={
                                                                variant.color
                                                            }
                                                            className="h-16 w-14 border border-line object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-16 w-14 items-center justify-center border border-line bg-white text-[9px] text-muted">
                                                            無圖
                                                        </div>
                                                    )}

                                                    <div className="min-w-0">
                                                        <div className="text-[13px] font-medium">
                                                            {variant.color}
                                                            {" ／ "}
                                                            {variant.size}
                                                        </div>

                                                        <div className="mt-1 break-all text-[10px] text-muted">
                                                            {variant.skuCode}
                                                        </div>

                                                        {reason && (
                                                            <div className="mt-1 text-[10px] text-[#8a5a23]">
                                                                {reason}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <label className="max-[650px]:col-start-1 max-[650px]:col-end-2">
                                                        <span className="mb-1 block text-[10px] text-muted">
                                                            庫存
                                                        </span>

                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            value={
                                                                stockValues[
                                                                    variant.id
                                                                    ] ?? ""
                                                            }
                                                            onChange={event =>
                                                                updateStockValue(
                                                                    variant.id,
                                                                    event.target
                                                                        .value
                                                                )
                                                            }
                                                            className="w-full border border-line bg-white px-2 py-2 text-[13px] outline-none focus:border-black"
                                                        />
                                                    </label>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            deleteVariant(
                                                                variant
                                                            )
                                                        }
                                                        disabled={
                                                            busy ||
                                                            Boolean(reason)
                                                        }
                                                        title={
                                                            reason ||
                                                            "刪除 SKU"
                                                        }
                                                        className="border border-[#b0413e] bg-white px-3 py-2 text-[11px] text-[#b0413e] hover:bg-[#b0413e] hover:text-white disabled:cursor-not-allowed disabled:border-line disabled:text-muted disabled:hover:bg-white max-[650px]:col-start-2"
                                                    >
                                                        {deletingVariantId ===
                                                        variant.id
                                                            ? "刪除中"
                                                            : "刪除"}
                                                    </button>
                                                </article>
                                            );
                                        }
                                    )}
                                </div>
                            </section>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={closeEditor}
                                    disabled={busy}
                                    className="border border-line bg-white px-5 py-2.5 text-[12px] hover:border-black disabled:opacity-40 max-[480px]:w-full"
                                >
                                    關閉
                                </button>
                            </div>
                        </div>
                    )}
            </div>
        </div>
    );
}

export default ProductEditModal;