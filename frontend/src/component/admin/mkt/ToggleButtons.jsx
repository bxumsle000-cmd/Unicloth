/**
 * 一排切換按鈕（期間、排行依據、尺寸組別…都用這個），選中的反黑
 * optionList：[{ key, name }]；currentKey：目前選的 key；onChange：點按鈕時呼叫，傳入 key
 */
function ToggleButtons({ optionList, currentKey, onChange }) {
    return (
        <div className="flex flex-wrap border border-line bg-white">
            {optionList.map(option => (
                <button key={option.key} type="button" onClick={() => onChange(option.key)}
                        className={'px-4 py-2 text-[12px] tracking-[.06em] '
                            + (option.key === currentKey ? 'bg-black text-white' : 'text-muted hover:text-[#111]')}>
                    {option.name}
                </button>
            ))}
        </div>
    )
}

export default ToggleButtons;
