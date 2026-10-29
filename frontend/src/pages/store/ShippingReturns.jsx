import { Link } from "react-router-dom";

/**
 * 前台「配送與退貨」說明頁。
 *
 * 純文字頁面，不需要登入；運費門檻、配送與付款方式要跟後端 CheckoutService 一致。
 */
function ShippingReturns() {
    return (
        <div className="mx-auto w-full max-w-[760px] px-5 py-12 font-kinu text-[#111] max-[600px]:py-8">
            <div className="mb-8">
                <div className="text-[10px] tracking-[.22em] text-muted">SHIPPING & RETURNS</div>
                <h1 className="mt-1 text-[28px] font-medium tracking-[.08em]">配送與退貨</h1>
                <p className="mt-3 text-[13px] leading-[1.8] text-muted">
                    以下說明 KINU 線上商店的運費、配送方式與退換貨規則。
                </p>
            </div>

            <section className="border border-line bg-white p-7 max-[600px]:p-5">
                <h2 className="text-[16px] font-medium tracking-[.08em]">運費</h2>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[13px] leading-[1.8]">
                    <li>單筆訂單商品金額滿 NT$2,500 免運費。</li>
                    <li>未滿 NT$2,500 酌收運費 NT$50。</li>
                    <li>免運門檻以折價券折抵前的商品金額計算。</li>
                </ul>
            </section>

            <section className="mt-5 border border-line bg-white p-7 max-[600px]:p-5">
                <h2 className="text-[16px] font-medium tracking-[.08em]">配送方式</h2>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[13px] leading-[1.8]">
                    <li>宅配：送貨到府，限台灣本島地址。</li>
                    <li>超商取貨：商品送達指定門市後會通知取貨，請於 7 天內完成取貨。</li>
                    <li>訂單確認後約 2–4 個工作天出貨（不含例假日）。</li>
                    <li>出貨後可在「訂單」頁查看物流狀態。</li>
                </ul>
            </section>

            <section className="mt-5 border border-line bg-white p-7 max-[600px]:p-5">
                <h2 className="text-[16px] font-medium tracking-[.08em]">退換貨規則</h2>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[13px] leading-[1.8]">
                    <li>商品送達後享 7 天鑑賞期，可申請退貨。</li>
                    <li>退回商品須保持全新狀態，吊牌、包裝與配件完整，未經穿著或洗滌。</li>
                    <li>內著、襪類等貼身衣物基於衛生考量，拆封後恕不退換。</li>
                    <li>如收到瑕疵或寄錯商品，運費由 KINU 負擔。</li>
                </ul>
            </section>

            <section className="mt-5 border border-line bg-white p-7 max-[600px]:p-5">
                <h2 className="text-[16px] font-medium tracking-[.08em]">如何申請退換貨</h2>
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[13px] leading-[1.8]">
                    <li>到「聯絡我們」建立客服單，問題類型選「退換貨」，並填寫訂單編號與原因。</li>
                    <li>客服人員確認後，會回覆退貨寄送方式。</li>
                    <li>收到退回商品並檢查無誤後，於 7–14 個工作天內退款。</li>
                </ol>
                <Link
                    to="/support"
                    className="mt-5 inline-block border border-black bg-black px-5 py-2.5 text-[12px] tracking-[.08em] text-white hover:opacity-80"
                >
                    聯絡客服
                </Link>
            </section>
        </div>
    );
}

export default ShippingReturns;
