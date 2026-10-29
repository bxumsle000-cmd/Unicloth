import { Link } from "react-router-dom";

const FAQ_GROUPS = [
    {
        title: "訂單與付款",
        items: [
            {
                question: "可以用哪些方式付款？",
                answer: "目前提供信用卡、ATM 轉帳與貨到付款三種方式。",
            },
            {
                question: "下單後多久要完成付款？",
                answer: "信用卡請在 30 分鐘內完成付款；ATM 轉帳請在取得轉帳帳號後 3 天內完成。逾時未付款的訂單會自動取消。",
            },
            {
                question: "訂單成立後可以取消或修改嗎？",
                answer: "訂單尚未出貨前，請到「聯絡我們」建立客服單並附上訂單編號，客服人員會協助處理。已出貨的訂單無法取消，請於收到商品後申請退貨。",
            },
            {
                question: "在哪裡查詢訂單狀態？",
                answer: "登入後點選右上角的「訂單」，即可查看每筆訂單的付款與出貨狀態。",
            },
        ],
    },
    {
        title: "配送",
        items: [
            {
                question: "運費怎麼算？",
                answer: "單筆訂單商品金額滿 NT$2,500 免運費，未滿則酌收 NT$50。",
            },
            {
                question: "有哪些配送方式？",
                answer: "提供宅配與超商取貨兩種方式，結帳時可以選擇。",
            },
            {
                question: "下單後多久會收到？",
                answer: "訂單確認後約 2–4 個工作天出貨，出貨後通常 1–3 天內送達。",
            },
        ],
    },
    {
        title: "退換貨",
        items: [
            {
                question: "收到商品不合適，可以退貨嗎？",
                answer: "商品送達後享 7 天鑑賞期，商品保持全新、吊牌完整即可申請退貨。詳細規則請參考「配送與退貨」頁面。",
            },
            {
                question: "退款多久會收到？",
                answer: "收到退回商品並檢查無誤後，會在 7–14 個工作天內退款。",
            },
        ],
    },
    {
        title: "會員與折價券",
        items: [
            {
                question: "一定要註冊會員才能購物嗎？",
                answer: "是的，加入購物車、結帳與查詢訂單都需要登入會員。",
            },
            {
                question: "折價券在哪裡查看？可以一次用多張嗎？",
                answer: "登入後點選「折價券」即可查看可使用的折價券。每筆訂單限使用一張折價券。",
            },
        ],
    },
];

/**
 * 前台「常見問題」頁。
 *
 * 純文字頁面，不需要登入；用 <details> 做可展開的問答。
 */
function Faq() {
    return (
        <div className="mx-auto w-full max-w-[760px] px-5 py-12 font-kinu text-[#111] max-[600px]:py-8">
            <div className="mb-8">
                <div className="text-[10px] tracking-[.22em] text-muted">FAQ</div>
                <h1 className="mt-1 text-[28px] font-medium tracking-[.08em]">常見問題</h1>
                <p className="mt-3 text-[13px] leading-[1.8] text-muted">
                    點選問題即可展開解答。
                </p>
            </div>

            {FAQ_GROUPS.map(group => (
                <section key={group.title} className="mt-8 first-of-type:mt-0">
                    <h2 className="mb-3 text-[16px] font-medium tracking-[.08em]">{group.title}</h2>
                    <div className="border border-line bg-white">
                        {group.items.map(item => (
                            <details key={item.question} className="group border-b border-line last:border-b-0">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[13px] [&::-webkit-details-marker]:hidden">
                                    {item.question}
                                    <span className="text-[16px] text-muted transition-transform group-open:rotate-45">+</span>
                                </summary>
                                <p className="px-5 pb-4 text-[13px] leading-[1.8] text-muted">
                                    {item.answer}
                                </p>
                            </details>
                        ))}
                    </div>
                </section>
            ))}

            <div className="mt-10 border border-line bg-white p-7 text-center max-[600px]:p-5">
                <p className="text-[13px] leading-[1.8]">找不到你要的答案嗎？</p>
                <Link
                    to="/support"
                    className="mt-4 inline-block border border-black bg-black px-5 py-2.5 text-[12px] tracking-[.08em] text-white hover:opacity-80"
                >
                    聯絡客服
                </Link>
            </div>
        </div>
    );
}

export default Faq;
