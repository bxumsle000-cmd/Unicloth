import { useState } from "react";
import ProductBatchCategoryModal from "./ProductBatchCategoryModal.jsx";

function ProductBatchActionBar({
                                   selectedIds,
                                   processing,
                                   onPublish,
                                   onUnpublish,
                                   onClear,
                                   onCategoryMoved,
                               }) {
    const [showCategoryModal, setShowCategoryModal] =
        useState(false);

    const selectedCount = selectedIds.length;

    if (selectedCount === 0) {
        return null;
    }

    function handleCategoryMoved() {
        setShowCategoryModal(false);
        onCategoryMoved();
    }

    return (
        <>
            <div className="mb-4 flex items-center justify-between gap-4 border border-black bg-white px-4 py-3 max-[600px]:flex-col max-[600px]:items-stretch">
                <div>
                    <div className="text-[13px] font-medium">
                        已選擇 {selectedCount} 件商品
                    </div>

                    <div className="mt-1 text-[11px] text-muted">
                        整批操作會一次套用到所有已選商品
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 max-[600px]:grid max-[600px]:grid-cols-2">
                    <button
                        type="button"
                        onClick={onPublish}
                        disabled={processing}
                        className="border border-black bg-black px-4 py-2 text-[12px] text-white disabled:opacity-40"
                    >
                        {processing ? "處理中……" : "整批上架"}
                    </button>

                    <button
                        type="button"
                        onClick={onUnpublish}
                        disabled={processing}
                        className="border border-line bg-white px-4 py-2 text-[12px] hover:border-black disabled:opacity-40"
                    >
                        整批下架
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            setShowCategoryModal(true)
                        }
                        disabled={processing}
                        className="border border-line bg-white px-4 py-2 text-[12px] hover:border-black disabled:opacity-40"
                    >
                        移動分類
                    </button>

                    <button
                        type="button"
                        onClick={onClear}
                        disabled={processing}
                        className="border border-line bg-white px-4 py-2 text-[12px] text-muted hover:border-black hover:text-black disabled:opacity-40"
                    >
                        取消選取
                    </button>
                </div>
            </div>

            {showCategoryModal && (
                <ProductBatchCategoryModal
                    productIds={selectedIds}
                    onClose={() =>
                        setShowCategoryModal(false)
                    }
                    onFinished={handleCategoryMoved}
                />
            )}
        </>
    );
}

export default ProductBatchActionBar;