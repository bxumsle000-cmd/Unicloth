import { useEffect, useState } from "react";
import { getAdminToken } from "../../../js/admin.js";
import { toast } from "../../../js/kinu.js";

const HISTORY_PAGE_SIZE = 10;

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

function formatDateTime(value) {
    if (!value) {
        return "";
    }

    return new Date(value).toLocaleString(
        "zh-TW",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }
    );
}

function transactionTypeLabel(type) {
    if (type === "RECEIVE") {
        return "進貨入庫";
    }

    if (type === "ADJUSTMENT") {
        return "盤點調整";
    }

    return type;
}

function ProductInventoryPanel({
                                   initialProductId = null,
                               }) {
    const [keywordInput, setKeywordInput] =
        useState("");
    const [searchResults, setSearchResults] =
        useState([]);
    const [searching, setSearching] =
        useState(false);
    const [searchError, setSearchError] =
        useState("");

    const [selectedProduct, setSelectedProduct] =
        useState(null);
    const [loadingProduct, setLoadingProduct] =
        useState(false);
    const [quantities, setQuantities] =
        useState({});

    const [receiptLines, setReceiptLines] =
        useState([]);
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] =
        useState(false);

    const [transactions, setTransactions] =
        useState([]);
    const [historyPage, setHistoryPage] =
        useState(0);
    const [
        historyTotalPages,
        setHistoryTotalPages,
    ] = useState(0);
    const [historyLoading, setHistoryLoading] =
        useState(true);
    const [historyError, setHistoryError] =
        useState("");
    const [historyVersion, setHistoryVersion] =
        useState(0);

    useEffect(() => {
        loadTransactions();
    }, [historyPage, historyVersion]);

    /*
     * 從「庫存警示」按下「去入庫」時，
     * 自動載入指定商品。
     */
    useEffect(() => {
        if (initialProductId === null) {
            return;
        }

        let cancelled = false;

        async function loadInitialProduct() {
            setLoadingProduct(true);
            setSearchError("");

            try {
                const product =
                    await adminRequest(
                        `/api/admin/product/products/${initialProductId}`
                    );

                if (cancelled) {
                    return;
                }

                setKeywordInput(product.slug);

                setSearchResults([
                    {
                        id: product.id,
                        name: product.name,
                        slug: product.slug,
                        totalStock:
                            (
                                product.variants ||
                                []
                            ).reduce(
                                (total, variant) =>
                                    total +
                                    variant.stock,
                                0
                            ),
                    },
                ]);

                setSelectedProduct(product);

                setQuantities(
                    Object.fromEntries(
                        (
                            product.variants ||
                            []
                        ).map(variant => [
                            variant.id,
                            "",
                        ])
                    )
                );
            } catch (e) {
                if (!cancelled) {
                    toast(e.message, true);
                }
            } finally {
                if (!cancelled) {
                    setLoadingProduct(false);
                }
            }
        }

        loadInitialProduct();

        return () => {
            cancelled = true;
        };
    }, [initialProductId]);

    async function loadTransactions() {
        setHistoryLoading(true);
        setHistoryError("");

        try {
            const params = new URLSearchParams({
                page: String(historyPage),
                size: String(
                    HISTORY_PAGE_SIZE
                ),
                sort: "createdAt,desc",
            });

            const data = await adminRequest(
                `/api/admin/product/inventory/transactions?${params.toString()}`
            );

            setTransactions(
                data.content || []
            );

            setHistoryTotalPages(
                data.page?.totalPages || 0
            );
        } catch (e) {
            setHistoryError(e.message);
        } finally {
            setHistoryLoading(false);
        }
    }

    async function searchProducts(event) {
        event.preventDefault();

        const keyword =
            keywordInput.trim();

        setSearching(true);
        setSearchError("");
        setSelectedProduct(null);
        setQuantities({});

        try {
            const params =
                new URLSearchParams({
                    keyword,
                    page: "0",
                    size: "10",
                    sort: "id,desc",
                });

            const data = await adminRequest(
                `/api/admin/product/products?${params.toString()}`
            );

            setSearchResults(
                data.content || []
            );
        } catch (e) {
            setSearchError(e.message);
        } finally {
            setSearching(false);
        }
    }

    async function selectProduct(productId) {
        setLoadingProduct(true);

        try {
            const product =
                await adminRequest(
                    `/api/admin/product/products/${productId}`
                );

            setSelectedProduct(product);

            setQuantities(
                Object.fromEntries(
                    (
                        product.variants || []
                    ).map(variant => [
                        variant.id,
                        "",
                    ])
                )
            );
        } catch (e) {
            toast(e.message, true);
        } finally {
            setLoadingProduct(false);
        }
    }

    function updateQuantity(
        variantId,
        value
    ) {
        setQuantities(current => ({
            ...current,
            [variantId]: value,
        }));
    }

    function addProductToReceipt() {
        if (!selectedProduct) {
            toast(
                "請先選擇商品",
                true
            );
            return;
        }

        const newLines = [];

        for (
            const variant of
        selectedProduct.variants || []
            ) {
            const rawValue =
                quantities[variant.id];

            if (
                rawValue === "" ||
                rawValue == null
            ) {
                continue;
            }

            const quantity =
                Number(rawValue);

            if (
                !Number.isInteger(
                    quantity
                ) ||
                quantity < 0
            ) {
                toast(
                    `${variant.color}／${variant.size} 的進貨數量必須是 0 以上的整數`,
                    true
                );
                return;
            }

            if (quantity === 0) {
                continue;
            }

            newLines.push({
                variantId: variant.id,
                skuCode:
                variant.skuCode,
                productName:
                selectedProduct.name,
                productSlug:
                selectedProduct.slug,
                color: variant.color,
                size: variant.size,
                currentStock:
                variant.stock,
                quantity,
            });
        }

        if (newLines.length === 0) {
            toast(
                "請至少輸入一筆大於 0 的進貨數量",
                true
            );
            return;
        }

        setReceiptLines(current => {
            const lineMap = new Map(
                current.map(line => [
                    line.variantId,
                    line,
                ])
            );

            for (
                const newLine of
                newLines
                ) {
                const existing =
                    lineMap.get(
                        newLine.variantId
                    );

                if (existing) {
                    lineMap.set(
                        newLine.variantId,
                        {
                            ...existing,
                            quantity:
                                existing.quantity +
                                newLine.quantity,
                        }
                    );
                } else {
                    lineMap.set(
                        newLine.variantId,
                        newLine
                    );
                }
            }

            return Array.from(
                lineMap.values()
            );
        });

        setQuantities(
            Object.fromEntries(
                (
                    selectedProduct.variants ||
                    []
                ).map(variant => [
                    variant.id,
                    "",
                ])
            )
        );

        toast(
            `已將「${selectedProduct.name}」加入進貨單`
        );
    }

    function updateReceiptQuantity(
        variantId,
        value
    ) {
        const quantity =
            Number(value);

        setReceiptLines(current =>
            current.map(line =>
                line.variantId ===
                variantId
                    ? {
                        ...line,
                        quantity:
                            Number.isFinite(
                                quantity
                            )
                                ? quantity
                                : 0,
                    }
                    : line
            )
        );
    }

    function removeReceiptLine(
        variantId
    ) {
        setReceiptLines(current =>
            current.filter(
                line =>
                    line.variantId !==
                    variantId
            )
        );
    }

    async function reloadSelectedProduct() {
        if (!selectedProduct) {
            return;
        }

        try {
            const updated =
                await adminRequest(
                    `/api/admin/product/products/${selectedProduct.id}`
                );

            setSelectedProduct(updated);

            setQuantities(
                Object.fromEntries(
                    (
                        updated.variants ||
                        []
                    ).map(variant => [
                        variant.id,
                        "",
                    ])
                )
            );
        } catch {
            // 入庫成功後重新載入失敗時，不改成錯誤提示
        }
    }

    async function submitReceipt() {
        if (
            receiptLines.length === 0
        ) {
            toast(
                "進貨單目前是空的",
                true
            );
            return;
        }

        for (
            const line of receiptLines
            ) {
            if (
                !Number.isInteger(
                    line.quantity
                ) ||
                line.quantity <= 0
            ) {
                toast(
                    `${line.skuCode} 的進貨數量必須大於 0`,
                    true
                );
                return;
            }
        }

        const confirmed =
            window.confirm(
                `確定將進貨單中的 ${receiptLines.length} 筆 SKU 入庫嗎？`
            );

        if (!confirmed) {
            return;
        }

        setSubmitting(true);

        try {
            await adminRequest(
                "/api/admin/product/inventory/receive",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        note:
                            note.trim() ||
                            null,
                        items:
                            receiptLines.map(
                                line => ({
                                    variantId:
                                    line.variantId,
                                    quantity:
                                    line.quantity,
                                })
                            ),
                    }),
                }
            );

            toast(
                `已完成 ${receiptLines.length} 筆 SKU 入庫`
            );

            setReceiptLines([]);
            setNote("");
            setHistoryPage(0);

            setHistoryVersion(
                current =>
                    current + 1
            );

            await reloadSelectedProduct();
        } catch (e) {
            toast(e.message, true);
        } finally {
            setSubmitting(false);
        }
    }

    const receiptTotalQuantity =
        receiptLines.reduce(
            (total, line) =>
                total +
                line.quantity,
            0
        );

    return (
        <div className="grid gap-5">
            <section className="border border-line bg-white p-5 max-[600px]:p-4">
                <div>
                    <div className="text-[10px] tracking-[.2em] text-muted">
                        INVENTORY RECEIVE
                    </div>

                    <h2 className="mt-1 text-[20px] font-medium tracking-[.06em]">
                        進貨入庫
                    </h2>

                    <p className="mt-2 text-[12px] text-muted">
                        搜尋商品、輸入本次進貨數量，再加入進貨單。
                    </p>
                </div>

                <form
                    onSubmit={
                        searchProducts
                    }
                    className="mt-5 flex gap-2 max-[600px]:flex-col"
                >
                    <input
                        value={
                            keywordInput
                        }
                        onChange={event =>
                            setKeywordInput(
                                event.target
                                    .value
                            )
                        }
                        placeholder="搜尋商品名稱或商品貨號"
                        className="min-w-0 flex-1 border border-line bg-paper px-3 py-2.5 text-[13px] outline-none focus:border-black"
                    />

                    <button
                        type="submit"
                        disabled={searching}
                        className="border border-black bg-black px-5 py-2.5 text-[12px] text-white disabled:opacity-40"
                    >
                        {searching
                            ? "搜尋中……"
                            : "搜尋商品"}
                    </button>
                </form>

                {searchError && (
                    <p className="mt-3 text-[12px] text-[#b0413e]">
                        {searchError}
                    </p>
                )}

                {searchResults.length >
                    0 && (
                        <div className="mt-4 grid gap-2">
                            {searchResults.map(
                                product => (
                                    <button
                                        key={
                                            product.id
                                        }
                                        type="button"
                                        onClick={() =>
                                            selectProduct(
                                                product.id
                                            )
                                        }
                                        className={
                                            "flex items-center justify-between gap-4 border px-4 py-3 text-left hover:border-black " +
                                            (selectedProduct?.id ===
                                            product.id
                                                ? "border-black bg-cream"
                                                : "border-line bg-white")
                                        }
                                    >
                                    <span>
                                        <span className="block text-[13px] font-medium">
                                            {
                                                product.name
                                            }
                                        </span>

                                        <span className="mt-1 block text-[10px] text-muted">
                                            {
                                                product.slug
                                            }
                                        </span>
                                    </span>

                                        <span className="shrink-0 text-[11px] text-muted">
                                        庫存{" "}
                                            {
                                                product.totalStock
                                            }
                                    </span>
                                    </button>
                                )
                            )}
                        </div>
                    )}

                {!searching &&
                    searchResults.length ===
                    0 &&
                    keywordInput.trim() && (
                        <p className="mt-4 text-center text-[12px] text-muted">
                            尚未搜尋或沒有搜尋結果
                        </p>
                    )}
            </section>

            {loadingProduct && (
                <p className="border border-line bg-white py-8 text-center text-[12px] text-muted">
                    SKU 資料載入中……
                </p>
            )}

            {!loadingProduct &&
                selectedProduct && (
                    <section className="border border-line bg-white p-5 max-[600px]:p-4">
                        <h3 className="text-[14px] font-medium">
                            {
                                selectedProduct.name
                            }
                        </h3>

                        <p className="mt-1 text-[11px] text-muted">
                            {
                                selectedProduct.slug
                            }
                        </p>

                        {!selectedProduct
                            .variants
                            ?.length && (
                            <p className="mt-4 border border-line bg-paper px-4 py-6 text-center text-[12px] text-muted">
                                這件商品尚未建立
                                SKU
                            </p>
                        )}

                        <div className="mt-4 grid gap-3">
                            {(
                                selectedProduct.variants ||
                                []
                            ).map(
                                variant => (
                                    <div
                                        key={
                                            variant.id
                                        }
                                        className="grid grid-cols-[1fr_100px_120px] items-end gap-3 border border-line bg-paper p-3 max-[560px]:grid-cols-2"
                                    >
                                        <div className="min-w-0 max-[560px]:col-span-2">
                                            <div className="text-[13px]">
                                                {
                                                    variant.color
                                                }
                                                {
                                                    " ／ "
                                                }
                                                {
                                                    variant.size
                                                }
                                            </div>

                                            <div className="mt-1 break-all text-[10px] text-muted">
                                                {
                                                    variant.skuCode
                                                }
                                            </div>
                                        </div>

                                        <div>
                                            <span className="block text-[10px] text-muted">
                                                目前庫存
                                            </span>

                                            <span className="mt-1 block text-[13px]">
                                                {
                                                    variant.stock
                                                }
                                            </span>
                                        </div>

                                        <label>
                                            <span className="mb-1 block text-[10px] text-muted">
                                                本次進貨
                                            </span>

                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={
                                                    quantities[
                                                        variant
                                                            .id
                                                        ] ??
                                                    ""
                                                }
                                                onChange={event =>
                                                    updateQuantity(
                                                        variant.id,
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                placeholder="0"
                                                className="w-full border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-black"
                                            />
                                        </label>
                                    </div>
                                )
                            )}
                        </div>

                        {!!selectedProduct
                            .variants
                            ?.length && (
                            <div className="mt-4 flex justify-end">
                                <button
                                    type="button"
                                    onClick={
                                        addProductToReceipt
                                    }
                                    className="border border-black bg-black px-5 py-2.5 text-[12px] text-white max-[480px]:w-full"
                                >
                                    加入進貨單
                                </button>
                            </div>
                        )}
                    </section>
                )}

            <section className="border border-line bg-white p-5 max-[600px]:p-4">
                <div className="flex items-end justify-between gap-3 max-[600px]:flex-col max-[600px]:items-start">
                    <div>
                        <h2 className="text-[16px] font-medium">
                            本次進貨單
                        </h2>

                        <p className="mt-1 text-[11px] text-muted">
                            {
                                receiptLines.length
                            }{" "}
                            筆 SKU，共進貨{" "}
                            {
                                receiptTotalQuantity
                            }{" "}
                            件
                        </p>
                    </div>

                    {receiptLines.length >
                        0 && (
                            <button
                                type="button"
                                onClick={() =>
                                    setReceiptLines(
                                        []
                                    )
                                }
                                disabled={
                                    submitting
                                }
                                className="text-[11px] text-muted hover:text-[#b0413e]"
                            >
                                清空進貨單
                            </button>
                        )}
                </div>

                {receiptLines.length ===
                    0 && (
                        <p className="mt-4 border border-line bg-paper px-4 py-8 text-center text-[12px] text-muted">
                            尚未加入進貨商品
                        </p>
                    )}

                <div className="mt-4 grid gap-3">
                    {receiptLines.map(
                        line => (
                            <div
                                key={
                                    line.variantId
                                }
                                className="grid grid-cols-[1fr_120px_70px] items-end gap-3 border border-line bg-paper p-3 max-[560px]:grid-cols-[1fr_90px]"
                            >
                                <div className="min-w-0">
                                    <div className="text-[13px] font-medium">
                                        {
                                            line.productName
                                        }
                                    </div>

                                    <div className="mt-1 text-[11px]">
                                        {
                                            line.color
                                        }
                                        {
                                            " ／ "
                                        }
                                        {
                                            line.size
                                        }
                                    </div>

                                    <div className="mt-1 break-all text-[10px] text-muted">
                                        {
                                            line.skuCode
                                        }
                                    </div>
                                </div>

                                <label>
                                    <span className="mb-1 block text-[10px] text-muted">
                                        進貨數量
                                    </span>

                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={
                                            line.quantity
                                        }
                                        onChange={event =>
                                            updateReceiptQuantity(
                                                line.variantId,
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="w-full border border-line bg-white px-3 py-2 text-[13px]"
                                    />
                                </label>

                                <button
                                    type="button"
                                    onClick={() =>
                                        removeReceiptLine(
                                            line.variantId
                                        )
                                    }
                                    disabled={
                                        submitting
                                    }
                                    className="border border-line bg-white px-3 py-2 text-[11px] text-[#b0413e] hover:border-[#b0413e] max-[560px]:col-span-2"
                                >
                                    移除
                                </button>
                            </div>
                        )
                    )}
                </div>

                {receiptLines.length >
                    0 && (
                        <div className="mt-5 border-t border-line pt-4">
                            <label className="block">
                            <span className="mb-1.5 block text-[11px] text-muted">
                                進貨單號或備註
                            </span>

                                <input
                                    value={note}
                                    onChange={event =>
                                        setNote(
                                            event.target
                                                .value
                                        )
                                    }
                                    maxLength={
                                        255
                                    }
                                    placeholder="例如：PO-20261020-001"
                                    className="w-full border border-line bg-paper px-3 py-2.5 text-[13px] outline-none focus:border-black"
                                />
                            </label>

                            <div className="mt-4 flex justify-end">
                                <button
                                    type="button"
                                    onClick={
                                        submitReceipt
                                    }
                                    disabled={
                                        submitting
                                    }
                                    className="border border-black bg-black px-6 py-2.5 text-[12px] text-white disabled:opacity-40 max-[480px]:w-full"
                                >
                                    {submitting
                                        ? "入庫處理中……"
                                        : `確認入庫 ${receiptTotalQuantity} 件`}
                                </button>
                            </div>
                        </div>
                    )}
            </section>

            <section className="border border-line bg-white p-5 max-[600px]:p-4">
                <h2 className="text-[16px] font-medium">
                    庫存異動紀錄
                </h2>

                <p className="mt-1 text-[11px] text-muted">
                    顯示進貨入庫與盤點修改紀錄
                </p>

                {historyLoading && (
                    <p className="py-8 text-center text-[12px] text-muted">
                        紀錄載入中……
                    </p>
                )}

                {historyError && (
                    <p className="mt-4 text-[12px] text-[#b0413e]">
                        {historyError}
                    </p>
                )}

                {!historyLoading &&
                    !historyError &&
                    transactions.length ===
                    0 && (
                        <p className="mt-4 border border-line bg-paper px-4 py-8 text-center text-[12px] text-muted">
                            尚無庫存異動紀錄
                        </p>
                    )}

                <div className="mt-4 grid gap-3">
                    {transactions.map(
                        transaction => (
                            <article
                                key={
                                    transaction.id
                                }
                                className="border border-line bg-paper p-4"
                            >
                                <div className="flex items-start justify-between gap-4 max-[560px]:flex-col">
                                    <div>
                                        <div className="text-[13px] font-medium">
                                            {transactionTypeLabel(
                                                transaction.type
                                            )}
                                        </div>

                                        <div className="mt-1 text-[11px] text-muted">
                                            {formatDateTime(
                                                transaction.createdAt
                                            )}
                                            {
                                                " · "
                                            }
                                            {
                                                transaction.staffName
                                            }
                                        </div>
                                    </div>

                                    <div className="text-[11px] text-muted">
                                        紀錄 #
                                        {
                                            transaction.id
                                        }
                                    </div>
                                </div>

                                {transaction.note && (
                                    <p className="mt-3 border-l-2 border-black pl-3 text-[12px]">
                                        {
                                            transaction.note
                                        }
                                    </p>
                                )}

                                <div className="mt-3 grid gap-2">
                                    {transaction.items.map(
                                        item => (
                                            <div
                                                key={
                                                    item.id
                                                }
                                                className="grid grid-cols-[1fr_auto] gap-3 border-t border-line pt-2 text-[11px]"
                                            >
                                                <div>
                                                    <div>
                                                        {
                                                            item.productName
                                                        }
                                                        {
                                                            " · "
                                                        }
                                                        {
                                                            item.color
                                                        }
                                                        {
                                                            " ／ "
                                                        }
                                                        {
                                                            item.size
                                                        }
                                                    </div>

                                                    <div className="mt-1 text-[10px] text-muted">
                                                        {
                                                            item.skuCode
                                                        }
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div
                                                        className={
                                                            item.quantityChange >
                                                            0
                                                                ? "text-[#2f6b3a]"
                                                                : "text-[#b0413e]"
                                                        }
                                                    >
                                                        {item.quantityChange >
                                                        0
                                                            ? "+"
                                                            : ""}
                                                        {
                                                            item.quantityChange
                                                        }
                                                    </div>

                                                    <div className="mt-1 text-[10px] text-muted">
                                                        {
                                                            item.stockBefore
                                                        }
                                                        {
                                                            " → "
                                                        }
                                                        {
                                                            item.stockAfter
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </article>
                        )
                    )}
                </div>

                {!historyLoading &&
                    historyTotalPages >
                    1 && (
                        <div className="mt-4 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                disabled={
                                    historyPage ===
                                    0
                                }
                                onClick={() =>
                                    setHistoryPage(
                                        current =>
                                            current -
                                            1
                                    )
                                }
                                className="border border-line px-3 py-2 text-[11px] disabled:opacity-30"
                            >
                                上一頁
                            </button>

                            <span className="text-[11px]">
                                {
                                    historyPage +
                                    1
                                }
                                ／
                                {
                                    historyTotalPages
                                }
                            </span>

                            <button
                                type="button"
                                disabled={
                                    historyPage >=
                                    historyTotalPages -
                                    1
                                }
                                onClick={() =>
                                    setHistoryPage(
                                        current =>
                                            current +
                                            1
                                    )
                                }
                                className="border border-black bg-black px-3 py-2 text-[11px] text-white disabled:opacity-30"
                            >
                                下一頁
                            </button>
                        </div>
                    )}
            </section>
        </div>
    );
}

export default ProductInventoryPanel;