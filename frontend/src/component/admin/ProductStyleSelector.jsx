function ProductStyleSelector({
                                  styles,
                                  selectedStyleIds,
                                  onChange,
                                  disabled = false,
                              }) {
    function toggleStyle(styleId) {
        const selected =
            selectedStyleIds.includes(styleId);

        if (selected) {
            onChange(
                selectedStyleIds.filter(
                    selectedId =>
                        selectedId !== styleId
                )
            );
            return;
        }

        onChange([
            ...selectedStyleIds,
            styleId,
        ]);
    }

    return (
        <div className="col-span-2 flex flex-col gap-2 max-[600px]:col-span-1">
            <span className="text-[11px] text-muted">
                風格標籤
            </span>

            {styles.length === 0 ? (
                <span className="text-[12px] text-muted">
                    目前沒有可選擇的風格
                </span>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {styles.map(style => {
                        const selected =
                            selectedStyleIds.includes(
                                style.id
                            );

                        return (
                            <label
                                key={style.id}
                                className={
                                    "cursor-pointer border px-3 py-2 text-[12px] " +
                                    (selected
                                        ? "border-black bg-black text-white"
                                        : "border-line bg-paper text-ink") +
                                    (disabled
                                        ? " cursor-not-allowed opacity-40"
                                        : "")
                                }
                            >
                                <input
                                    type="checkbox"
                                    checked={selected}
                                    disabled={disabled}
                                    onChange={() =>
                                        toggleStyle(style.id)
                                    }
                                    className="sr-only"
                                />

                                {style.name}
                            </label>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default ProductStyleSelector;