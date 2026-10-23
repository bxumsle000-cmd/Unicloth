import { useEffect, useState } from "react";
import { getAdminToken } from "../../../js/admin.js";
import { toast } from "../../../js/kinu.js";

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

function CategoryNode({
                          category,
                          level,
                          onAddChild,
                      }) {
    const children =
        category.children || [];

    return (
        <div>
            <div
                className={
                    "flex items-center justify-between gap-4 border-b border-line px-4 py-3 last:border-b-0 " +
                    (level === 0
                        ? "bg-cream"
                        : "bg-white")
                }
                style={{
                    paddingLeft:
                        16 +
                        Math.min(level, 5) *
                        18,
                }}
            >
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={
                                level === 0
                                    ? "text-[14px] font-medium tracking-[.08em]"
                                    : "text-[13px]"
                            }
                        >
                            {category.name}
                        </span>

                        <span className="break-all text-[10px] text-muted">
                            {category.code}
                        </span>
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted">
                        <span>
                            直接商品{" "}
                            {
                                category.directProductCount
                            }{" "}
                            件
                        </span>

                        {children.length > 0 && (
                            <span>
                                含子分類共{" "}
                                {
                                    category.totalProductCount
                                }{" "}
                                件
                            </span>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        onAddChild(category)
                    }
                    className="shrink-0 border border-line bg-white px-3 py-1.5 text-[11px] hover:border-black"
                >
                    ＋ 子分類
                </button>
            </div>

            {children.map(child => (
                <CategoryNode
                    key={child.id}
                    category={child}
                    level={level + 1}
                    onAddChild={
                        onAddChild
                    }
                />
            ))}
        </div>
    );
}

function CreateCategoryModal({
                                 parent,
                                 onClose,
                                 onCreated,
                             }) {
    const [name, setName] =
        useState("");
    const [code, setCode] =
        useState(
            parent.code
                ? `${parent.code}-`
                : ""
        );
    const [submitting, setSubmitting] =
        useState(false);
    const [error, setError] =
        useState("");

    useEffect(() => {
        function handleKeyDown(event) {
            if (
                event.key ===
                "Escape" &&
                !submitting
            ) {
                onClose();
            }
        }

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [onClose, submitting]);

    async function submitCategory(event) {
        event.preventDefault();

        const normalizedName =
            name.trim();

        const normalizedCode =
            code.trim().toLowerCase();

        if (!normalizedName) {
            setError(
                "請輸入分類名稱"
            );
            return;
        }

        if (!normalizedCode) {
            setError(
                "請輸入分類代碼"
            );
            return;
        }

        if (
            !/^[a-z0-9_-]+$/.test(
                normalizedCode
            )
        ) {
            setError(
                "分類代碼只能使用小寫英文、數字、底線和連字號"
            );
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            await adminRequest(
                "/api/admin/product/categories",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        parentId:
                        parent.id,
                        name:
                        normalizedName,
                        code:
                        normalizedCode,
                    }),
                }
            );

            toast(
                `已在「${parent.name}」下新增「${normalizedName}」`
            );

            onCreated();
        } catch (e) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-category-title"
        >
            <div className="w-full max-w-[500px] bg-white">
                <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
                    <div>
                        <div className="text-[10px] tracking-[.2em] text-muted">
                            NEW CATEGORY
                        </div>

                        <h2
                            id="create-category-title"
                            className="mt-1 text-[18px] font-medium"
                        >
                            新增子分類
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        aria-label="關閉"
                        className="flex h-8 w-8 items-center justify-center border border-line text-[18px] hover:border-black disabled:opacity-40"
                    >
                        ×
                    </button>
                </div>

                <form
                    onSubmit={
                        submitCategory
                    }
                >
                    <div className="grid gap-4 px-6 py-5">
                        <div className="border border-line bg-cream px-4 py-3">
                            <div className="text-[10px] text-muted">
                                上層分類
                            </div>

                            <div className="mt-1 text-[13px] font-medium">
                                {parent.name}
                            </div>

                            <div className="mt-1 break-all text-[10px] text-muted">
                                {parent.code}
                            </div>
                        </div>

                        <label>
                            <span className="mb-1.5 block text-[11px] text-muted">
                                分類名稱
                            </span>

                            <input
                                autoFocus
                                value={name}
                                onChange={event =>
                                    setName(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                maxLength={50}
                                placeholder="例如：針織外套"
                                className="w-full border border-line bg-paper px-3 py-2.5 text-[13px] outline-none focus:border-black"
                            />
                        </label>

                        <label>
                            <span className="mb-1.5 block text-[11px] text-muted">
                                分類代碼
                            </span>

                            <input
                                value={code}
                                onChange={event =>
                                    setCode(
                                        event
                                            .target
                                            .value
                                            .toLowerCase()
                                    )
                                }
                                maxLength={100}
                                placeholder="例如：all_women-outer-knit"
                                className="w-full border border-line bg-paper px-3 py-2.5 font-mono text-[12px] outline-none focus:border-black"
                            />

                            <span className="mt-1.5 block text-[10px] leading-4 text-muted">
                                代碼會用在網址與前台查詢，建立後不建議修改。只能使用小寫英文、數字、底線與連字號。
                            </span>
                        </label>

                        {error && (
                            <p className="border border-[#b0413e] px-3 py-2 text-[12px] text-[#b0413e]">
                                {error}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 border-t border-line px-6 py-4 max-[480px]:grid max-[480px]:grid-cols-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={
                                submitting
                            }
                            className="border border-line px-5 py-2.5 text-[12px] hover:border-black disabled:opacity-40"
                        >
                            關閉
                        </button>

                        <button
                            type="submit"
                            disabled={
                                submitting
                            }
                            className="border border-black bg-black px-5 py-2.5 text-[12px] text-white disabled:opacity-40"
                        >
                            {submitting
                                ? "新增中……"
                                : "新增分類"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ProductCategoryPanel() {
    const [categories, setCategories] =
        useState([]);
    const [loading, setLoading] =
        useState(true);
    const [error, setError] =
        useState("");
    const [refreshVersion, setRefreshVersion] =
        useState(0);
    const [createParent, setCreateParent] =
        useState(null);

    useEffect(() => {
        async function loadCategories() {
            setLoading(true);
            setError("");

            try {
                const data =
                    await adminRequest(
                        "/api/admin/product/categories/tree"
                    );

                setCategories(data || []);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }

        loadCategories();
    }, [refreshVersion]);

    function handleCreated() {
        setCreateParent(null);

        setRefreshVersion(
            current => current + 1
        );
    }

    const totalCategoryCount =
        countCategories(categories);

    return (
        <div>
            <div className="mb-6">
                <div className="text-[10px] tracking-[.22em] text-muted">
                    CATEGORIES
                </div>

                <h1 className="mt-1 text-[24px] font-medium tracking-[.08em]">
                    分類管理
                </h1>

                <p className="mt-2 text-[12px] leading-5 text-muted">
                    管理商城商品使用的多層分類。商品只能選擇目前沒有子分類的最底層分類。
                </p>

                {!loading && !error && (
                    <p className="mt-1 text-[11px] text-muted">
                        目前共有{" "}
                        {totalCategoryCount}{" "}
                        個分類
                    </p>
                )}
            </div>

            {loading && (
                <p className="border border-line bg-white py-10 text-center text-[13px] text-muted">
                    分類資料載入中……
                </p>
            )}

            {error && (
                <div className="border border-[#b0413e] bg-white px-4 py-3">
                    <p className="text-[13px] text-[#b0413e]">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            setRefreshVersion(
                                current =>
                                    current + 1
                            )
                        }
                        className="mt-3 border border-line px-3 py-2 text-[11px]"
                    >
                        重新載入
                    </button>
                </div>
            )}

            {!loading &&
                !error &&
                categories.length === 0 && (
                    <p className="border border-line bg-white py-10 text-center text-[13px] text-muted">
                        目前沒有分類資料
                    </p>
                )}

            {!loading &&
                !error &&
                categories.length > 0 && (
                    <div className="grid grid-cols-3 items-start gap-4 max-[1100px]:grid-cols-2 max-[760px]:grid-cols-1">
                        {categories.map(
                            category => (
                                <section
                                    key={
                                        category.id
                                    }
                                    className="overflow-hidden border border-line bg-white"
                                >
                                    <CategoryNode
                                        category={
                                            category
                                        }
                                        level={0}
                                        onAddChild={
                                            setCreateParent
                                        }
                                    />
                                </section>
                            )
                        )}
                    </div>
                )}

            {createParent && (
                <CreateCategoryModal
                    parent={createParent}
                    onClose={() =>
                        setCreateParent(
                            null
                        )
                    }
                    onCreated={
                        handleCreated
                    }
                />
            )}
        </div>
    );
}

function countCategories(categories) {
    return categories.reduce(
        (total, category) =>
            total +
            1 +
            countCategories(
                category.children || []
            ),
        0
    );
}

export default ProductCategoryPanel;