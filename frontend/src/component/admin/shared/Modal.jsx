/** 彈出視窗的外框：點灰色背景就關閉 */
function Modal({ title, onClose, children }) {
    return (
        <div onClick={onClose} className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
            {/* stopPropagation：點視窗裡面不要觸發外面的 onClose */}
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[440px] bg-white px-7 py-7">
                <h2 className="mb-6 text-[18px] font-medium tracking-[.08em]">{title}</h2>
                {children}
            </div>
        </div>
    )
}

export default Modal;
