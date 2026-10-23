import { useEffect, useState } from "react";
import { getAdminToken } from "../../../js/admin.js";

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

/**
 * 將資料庫內的相對圖片路徑轉成網站根目錄路徑。
 *
 * img/products/... 會轉成 /img/products/...
 * /uploads/... 會保持不變。
 * http、https 與 data 圖片也會保持不變。
 */
function resolveImageUrl(imageUrl) {
    if (!imageUrl) {
        return "";
    }

    if (
        imageUrl.startsWith("/") ||
        imageUrl.startsWith("http://") ||
        imageUrl.startsWith("https://") ||
        imageUrl.startsWith("data:")
    ) {
        return imageUrl;
    }

    return `/${imageUrl}`;
}

function VariantList({
                         variants,
                         type,
                     }) {
    if (!variants.length) {
        return (
            <span className="text-muted">
                —
            </span>
        );
    }

    const isOutOfStock =
        type === "out-of-stock";

    return (
        <div className="grid gap-1.5">
            <div
                className={
                    "text-[12px] font-medium " +
                    (isOutOfStock
                        ? "text-[#b0413e]"
                        : "text-[#a66d1f]")
                }
            >
                {variants.length} 個規格
            </div>

            <div className="flex flex-wrap gap-1.5">
                {variants.map(variant => (
                    <span
                        key={variant.variantId}
                        title={variant.skuCode}
                        className={
                            "border px-2 py-1 text-[11px] " +
                            (isOutOfStock
                                ? "border-[#d9aaa8] bg-[#fff7f7] text-[#b0413e]"
                                : "border-[#ddc59c] bg-[#fffaf0] text-[#8a5b18]")
                        }
                    >
                        {variant.color}
                        {" ／ "}
                        {variant.size}

                        {!isOutOfStock && (
                            <>
                                {" "}
                                （{variant.stock}）
                            </>
                        )}
                    </span>
                ))}
            </div>
        </div>
    );
}

function ProductImage({
                          imageUrl,
                      }) {
    const resolvedUrl =
        resolveImageUrl(imageUrl);

    if (!resolvedUrl) {
        return (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-cream text-[9px] text-muted">
                無圖片
            </div>
        );
    }

    return (
        <img
            src={resolvedUrl}
            alt=""
            className="h-14 w-14 shrink-0 bg-cream object-cover"
        />
    );
}

function DesktopWarningTable({
                                 warnings,
                                 onReceive,
                             }) {
    return (
        <div className="overflow-x-auto border border-line bg-white max-[760px]:hidden">
            <table className="w-full min-w-[760px] text-left text-[13px]">
                <thead className="border-b border-line bg-cream text-[11px] tracking-[.08em] text-muted">
                <tr>
                    <th className="px-4 py-3 font-medium">
                        商品
                    </th>

                    <th className="px-4 py-3 font-medium">
                        缺貨
                    </th>

                    <th className="px-4 py-3 font-medium">
                        快賣完
                    </th>

                    <th className="px-4 py-3" />
                </tr>
                </thead>

                <tbody>
                {warnings.map(warning => (
                    <tr
                        key={warning.productId}
                        className="border-b border-line align-top last:border-b-0"
                    >
                        <td className="px-4 py-4">
                            <div className="flex min-w-[220px] items-center gap-3">
                                <ProductImage
                                    imageUrl={
                                        warning.imageUrl
                                    }
                                />

                                <div className="min-w-0">
                                    <div className="font-medium">
                                        {
                                            warning.productName
                                        }
                                    </div>

                                    <div className="mt-1 break-all text-[10px] text-muted">
                                        {
                                            warning.slug
                                        }
                                    </div>
                                </div>
                            </div>
                        </td>

                        <td className="px-4 py-4">
                            <VariantList
                                variants={
                                    warning.outOfStockVariants ||
                                    []
                                }
                                type="out-of-stock"
                            />
                        </td>

                        <td className="px-4 py-4">
                            <VariantList
                                variants={
                                    warning.lowStockVariants ||
                                    []
                                }
                                type="low-stock"
                            />
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-right">
                            <button
                                type="button"
                                onClick={() =>
                                    onReceive(
                                        warning.productId
                                    )
                                }
                                className="border border-black bg-black px-3 py-2 text-[12px] text-white hover:opacity-80"
                            >
                                去入庫
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

function MobileWarningCards({
                                warnings,
                                onReceive,
                            }) {
    return (
        <div className="hidden gap-3 max-[760px]:grid">
            {warnings.map(warning => (
                <article
                    key={warning.productId}
                    className="border border-line bg-white p-4"
                >
                    <div className="flex items-center gap-3">
                        <ProductImage
                            imageUrl={
                                warning.imageUrl
                            }
                        />

                        <div className="min-w-0 flex-1">
                            <h3 className="text-[14px] font-medium">
                                {
                                    warning.productName
                                }
                            </h3>

                            <p className="mt-1 break-all text-[10px] text-muted">
                                {warning.slug}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 border-t border-line pt-4">
                        <div className="text-[10px] tracking-[.08em] text-muted">
                            缺貨規格
                        </div>

                        <div className="mt-2">
                            <VariantList
                                variants={
                                    warning.outOfStockVariants ||
                                    []
                                }
                                type="out-of-stock"
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="text-[10px] tracking-[.08em] text-muted">
                            快賣完規格
                        </div>

                        <div className="mt-2">
                            <VariantList
                                variants={
                                    warning.lowStockVariants ||
                                    []
                                }
                                type="low-stock"
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            onReceive(
                                warning.productId
                            )
                        }
                        className="mt-4 w-full border border-black bg-black px-4 py-2.5 text-[12px] text-white"
                    >
                        去入庫
                    </button>
                </article>
            ))}
        </div>
    );
}

function ProductStockWarningPanel({
                                      onReceive,
                                  }) {
    const [
        thresholdInput,
        setThresholdInput,
    ] = useState("5");
    const [threshold, setThreshold] =
        useState(5);

    const [warnings, setWarnings] =
        useState([]);
    const [loading, setLoading] =
        useState(true);
    const [error, setError] =
        useState("");
    const [
        refreshVersion,
        setRefreshVersion,
    ] = useState(0);

    useEffect(() => {
        async function loadWarnings() {
            setLoading(true);
            setError("");

            try {
                const params =
                    new URLSearchParams({
                        threshold:
                            String(
                                threshold
                            ),
                    });

                const data =
                    await adminRequest(
                        `/api/admin/product/inventory/warnings?${params.toString()}`
                    );

                setWarnings(data || []);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }

        loadWarnings();
    }, [threshold, refreshVersion]);

    function applyThreshold(event) {
        event.preventDefault();

        const nextThreshold =
            Number(thresholdInput);

        if (
            !Number.isInteger(
                nextThreshold
            ) ||
            nextThreshold < 0
        ) {
            setError(
                "庫存警示值必須是 0 以上的整數"
            );
            return;
        }

        setError("");

        if (
            nextThreshold ===
            threshold
        ) {
            setRefreshVersion(
                current =>
                    current + 1
            );
        } else {
            setThreshold(
                nextThreshold
            );
        }
    }

    const outOfStockCount =
        warnings.reduce(
            (total, warning) =>
                total +
                (
                    warning.outOfStockVariants ||
                    []
                ).length,
            0
        );

    const lowStockCount =
        warnings.reduce(
            (total, warning) =>
                total +
                (
                    warning.lowStockVariants ||
                    []
                ).length,
            0
        );

    return (
        <div>
            <div className="mb-6 flex items-end justify-between gap-5 max-[700px]:flex-col max-[700px]:items-stretch">
                <div>
                    <div className="text-[10px] tracking-[.22em] text-muted">
                        STOCK WARNING
                    </div>

                    <h1 className="mt-1 text-[24px] font-medium tracking-[.08em]">
                        庫存警示
                    </h1>

                    <p className="mt-2 max-w-[680px] text-[12px] leading-5 text-muted">
                        顯示上架中商品缺貨或快賣完的規格，方便安排補貨。
                    </p>
                </div>

                <form
                    onSubmit={
                        applyThreshold
                    }
                    className="flex items-end gap-2 max-[480px]:grid max-[480px]:grid-cols-[1fr_auto]"
                >
                    <label>
                        <span className="mb-1.5 block text-[11px] text-muted">
                            快賣完的庫存標準
                        </span>

                        <div className="flex items-center border border-line bg-white">
                            <span className="pl-3 text-[12px] text-muted">
                                ≤
                            </span>

                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={
                                    thresholdInput
                                }
                                onChange={event =>
                                    setThresholdInput(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                className="w-[80px] px-2 py-2.5 text-[13px] outline-none"
                            />

                            <span className="pr-3 text-[12px] text-muted">
                                件
                            </span>
                        </div>
                    </label>

                    <button
                        type="submit"
                        disabled={loading}
                        className="border border-black bg-black px-4 py-2.5 text-[12px] text-white disabled:opacity-40"
                    >
                        套用
                    </button>
                </form>
            </div>

            {!loading && !error && (
                <div className="mb-4 grid grid-cols-3 gap-3 max-[600px]:grid-cols-1">
                    <div className="border border-line bg-white p-4">
                        <div className="text-[10px] text-muted">
                            警示商品
                        </div>

                        <div className="mt-1 text-[22px] font-medium">
                            {
                                warnings.length
                            }
                        </div>
                    </div>

                    <div className="border border-[#d9aaa8] bg-[#fff7f7] p-4">
                        <div className="text-[10px] text-[#9b5a57]">
                            缺貨 SKU
                        </div>

                        <div className="mt-1 text-[22px] font-medium text-[#b0413e]">
                            {
                                outOfStockCount
                            }
                        </div>
                    </div>

                    <div className="border border-[#ddc59c] bg-[#fffaf0] p-4">
                        <div className="text-[10px] text-[#8a6a38]">
                            低庫存 SKU
                        </div>

                        <div className="mt-1 text-[22px] font-medium text-[#a66d1f]">
                            {lowStockCount}
                        </div>
                    </div>
                </div>
            )}

            {loading && (
                <p className="border border-line bg-white py-10 text-center text-[13px] text-muted">
                    庫存警示載入中……
                </p>
            )}

            {error && (
                <p className="border border-[#b0413e] bg-white px-4 py-3 text-[13px] text-[#b0413e]">
                    {error}
                </p>
            )}

            {!loading &&
                !error &&
                warnings.length ===
                0 && (
                    <p className="border border-line bg-white py-12 text-center text-[13px] text-muted">
                        上架中的商品都有足夠庫存
                    </p>
                )}

            {!loading &&
                !error &&
                warnings.length >
                0 && (
                    <>
                        <DesktopWarningTable
                            warnings={
                                warnings
                            }
                            onReceive={
                                onReceive
                            }
                        />

                        <MobileWarningCards
                            warnings={
                                warnings
                            }
                            onReceive={
                                onReceive
                            }
                        />
                    </>
                )}
        </div>
    );
}

export default ProductStockWarningPanel;