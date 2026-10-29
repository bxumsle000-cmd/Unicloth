import { useState, useEffect, useRef, useContext } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import {
  api,
  toast,
  money,
  imgSrc,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  SHIPPING_OPTIONS,
  PAYMENT_OPTIONS,
} from "../../js/kinu.js";
import { CountContext } from "../../js/CountProvider.jsx";

const inputClass =
  "w-full border-b border-[#d6d0c7] bg-transparent py-2 text-[14px] tracking-[.04em] outline-none focus:border-black";

// 目前只允許跳轉綠界官方測試環境
const ECPAY_STAGE_URL =
  "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5";

/**
 * 將 Spring Boot 產生的付款資料，
 * 透過 HTML form POST 送往綠界。
 *
 * 不能用 fetch 取代瀏覽器表單跳轉。
 */
function submitEcpayForm(paymentData, expectedAmount) {
  const paymentUrl = paymentData?.paymentUrl;
  const parameters = paymentData?.parameters;

  if (paymentUrl !== ECPAY_STAGE_URL) {
    throw new Error("綠界測試付款網址不正確");
  }

  if (!parameters || typeof parameters !== "object") {
    throw new Error("後端沒有回傳完整的付款參數");
  }

  if (
    !parameters.MerchantTradeNo ||
    !parameters.MerchantID ||
    !parameters.CheckMacValue
  ) {
    throw new Error("缺少必要的綠界付款參數");
  }

  if (String(parameters.TotalAmount) !== String(expectedAmount)) {
    throw new Error("綠界付款金額與訂單金額不一致");
  }

  // 建立隱藏表單，使用瀏覽器直接跳轉
  const paymentForm = document.createElement("form");

  paymentForm.method = "POST";
  paymentForm.action = ECPAY_STAGE_URL;
  paymentForm.acceptCharset = "UTF-8";
  paymentForm.style.display = "none";

  Object.entries(parameters).forEach(([key, value]) => {
    const input = document.createElement("input");

    input.type = "hidden";
    input.name = key;
    input.value = String(value);

    paymentForm.appendChild(input);
  });

  document.body.appendChild(paymentForm);

  // 跳轉綠界官方測試付款頁
  paymentForm.submit();
}

/** 一個欄位：上面小標題，下面放輸入框 */
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-[11px] tracking-[.08em] text-[#76716c]">
        {label}
      </span>
      {children}
    </label>
  );
}

/** 一組單選：options 是 [{ value, label }] */
function RadioGroup({ name, options, value, onChange }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
      {options.map((o) => (
        <label
          key={o.value}
          className="flex cursor-pointer items-center gap-2 text-[13px] tracking-[.06em]"
        >
          <input
            type="radio"
            name={name}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="size-4 accent-black"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}

function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshCart } = useContext(CountContext);

  // 購物車頁帶過來的折價券
  const coupon = location.state?.coupon ?? null;
  const discount = coupon ? coupon.discount : 0;

  // 購物車
  const [cartItemList, setCartItemList] = useState(null);

  useEffect(() => {
    api("/api/cart")
      .then(setCartItemList)
      .catch((e) => toast(e.message, true));
  }, []);

  // 上架中的商品
  const buyList = (cartItemList || []).filter((item) => item.onSale);

  const subtotal = buyList.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );

  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

  const total = subtotal - discount + shippingFee;

  // 結帳表單
  const [form, setForm] = useState({
    receiverName: "",
    receiverPhone: "",
    receiverEmail: "",
    shippingMethod: "HOME",
    shippingAddress: "",
    paymentMethod: "CREDIT",
    note: "",
  });

  function changeField(name, value) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // 會員資料
  const [member, setMember] = useState(null);

  useEffect(() => {
    api("/api/member/me")
      .then((data) => {
        setMember(data);

        // 預設是宅配：一進來就帶入會員資料的地址（使用者還沒自己填的話）
        setForm((previous) =>
          previous.shippingMethod === "HOME" && !previous.shippingAddress
            ? { ...previous, shippingAddress: data.address ?? "" }
            : previous,
        );
      })
      .catch(() => {});
  }, []);

  // 切換配送方式：宅配帶入會員地址，超商取貨清空讓使用者填門市名稱
  function changeShippingMethod(method) {
    setForm((previous) => ({
      ...previous,
      shippingMethod: method,
      shippingAddress: method === "HOME" ? (member?.address ?? "") : "",
    }));
  }

  // 同訂購人
  const [sameAsMember, setSameAsMember] = useState(false);

  function toggleSameAsMember(checked) {
    setSameAsMember(checked);

    setForm((previous) => ({
      ...previous,
      receiverName: checked ? (member?.name ?? "") : "",
      receiverPhone: checked ? (member?.phone ?? "") : "",
      receiverEmail: checked ? (member?.email ?? "") : "",
    }));
  }

  // 防止連續點擊送出
  const [submitting, setSubmitting] = useState(false);
  const submitLockedRef = useRef(false);

  // 訂單已建立後，不可再送出相同購物車
  const [createdOrder, setCreatedOrder] = useState(null);

  // 訂單建立後，若無法啟動綠界付款，顯示錯誤
  const [paymentError, setPaymentError] = useState("");

  /**
   * 結帳流程：
   *
   * 1. 驗證收件資料
   * 2. 建立 Unicloth 訂單
   * 3. 信用卡/ATM 建立綠界付款
   * 4. 表單 POST 跳轉綠界
   *
   * 貨到付款維持原本流程。
   */
  async function submitOrder() {
    if (submitLockedRef.current || createdOrder) {
      return;
    }

    if (!form.receiverName.trim()) {
      return toast("請填寫收件人", true);
    }

    if (!form.receiverPhone.trim()) {
      return toast("請填寫手機", true);
    }

    if (!form.receiverEmail.trim()) {
      return toast("請填寫 Email", true);
    }

    if (!form.shippingAddress.trim()) {
      return toast("請填寫地址", true);
    }

    if (buyList.length === 0) {
      return toast("沒有可以結帳的商品", true);
    }

    submitLockedRef.current = true;
    setSubmitting(true);
    setPaymentError("");

    let order = null;

    try {
      // 第一步：建立 Unicloth 訂單
      order = await api("/api/checkout", {
        method: "POST",
        body: {
          ...form,
          note: form.note.trim() || null,
          memberCouponId: coupon ? coupon.id : null,
          cartItemIdList: buyList.map((item) => item.id),
        },
      });

      if (!order?.orderNo) {
        throw new Error("訂單已送出，但沒有取得訂單編號，請先查詢我的訂單");
      }

      // 記住已建立的訂單，避免之後重複下單
      setCreatedOrder(order);

      // 結帳的商品已從購物車移除，通知 Header 更新數字
      refreshCart();

      // 貨到付款：維持原本訂單完成流程
      if (form.paymentMethod === "COD") {
        navigate("/order-complete", {
          state: { order },
          replace: true,
        });

        return;
      }

      // 只有 CREDIT / ATM 使用綠界
      if (form.paymentMethod !== "CREDIT" && form.paymentMethod !== "ATM") {
        throw new Error("目前不支援這個付款方式");
      }

      // 第二步：呼叫 Spring Boot 建立綠界交易
      const paymentData = await api("/api/payments/ecpay/create", {
        method: "POST",
        body: {
          orderNo: order.orderNo,
        },
      });

      // 第三步：使用後端確認的金額跳轉綠界
      submitEcpayForm(paymentData, order.total);
    } catch (e) {
      if (order?.orderNo) {
        // 訂單已建立，不可再次呼叫 /api/checkout
        setCreatedOrder(order);

        setPaymentError(e.message || "無法啟動綠界付款");
      } else {
        toast(e.message || "結帳失敗，請稍後再試", true);
      }
    } finally {
      submitLockedRef.current = false;
      setSubmitting(false);
    }
  }

  // 結帳頁必須由購物車導入
  if (!location.state) {
    return <Navigate to="/cart" replace />;
  }

  // 若訂單已建立，顯示付款啟動狀態
  // 不允許再次建立相同訂單
  if (createdOrder) {
    return (
      <div className="px-[5.5%] py-24">
        <div className="mx-auto max-w-[560px] border border-[#e5e0d8] bg-white p-8 text-center">
          <div className="mb-3 text-[11px] tracking-[.22em] text-[#76716c]">
            ORDER CREATED
          </div>

          <h1 className="mb-5 text-[24px] tracking-[.08em]">訂單已建立</h1>

          <p className="mb-4 text-[13px] text-[#76716c]">
            訂單編號：{createdOrder.orderNo}
          </p>

          {paymentError ? (
            <div className="mb-6 border border-[#d9aea7] bg-[#fff8f6] p-4 text-left">
              <p className="mb-2 text-[13px] font-medium text-[#9a3b2d]">
                尚未確認付款成功
              </p>

              <p className="text-[12px] leading-6 text-[#76716c]">
                綠界付款頁啟動失敗：{paymentError}
              </p>

              <p className="mt-3 text-[12px] leading-6 text-[#76716c]">
                請勿重新送出相同購物車。 訂單已存在，請先確認付款紀錄。
              </p>
            </div>
          ) : (
            <p className="mb-6 text-[13px] text-[#76716c]">
              正在前往綠界測試付款頁面， 此時尚未付款成功。
            </p>
          )}

          <Link
            to="/orders"
            className="inline-block w-full bg-black px-8 py-3 text-[12px] tracking-[.18em] text-white"
          >
            查看我的訂單
          </Link>
        </div>
      </div>
    );
  }

  if (!cartItemList) {
    return (
      <div className="py-24 text-center text-[11px] tracking-[.06em] text-[#76716c]">
        載入中…
      </div>
    );
  }

  if (buyList.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 text-center">
        <p className="text-[15px] tracking-[.06em] text-[#76716c]">
          沒有可以結帳的商品
        </p>

        <Link
          to="/cart"
          className="border border-black px-8 py-3 text-[12px] tracking-[.18em] transition-colors hover:bg-black hover:text-white"
        >
          回購物車
        </Link>
      </div>
    );
  }

  return (
    <div className="px-[5.5%] pt-[38px] pb-[90px] max-[760px]:px-[4%] max-[760px]:pt-[26px] max-[760px]:pb-[70px]">
      <div className="mx-auto max-w-[560px]">
        <div className="mb-2 text-[10px] tracking-[.22em] text-[#76716c]">
          CHECKOUT
        </div>

        <h1 className="mb-8 text-[clamp(24px,3vw,34px)] font-medium tracking-[.08em]">
          確認訂單
        </h1>

        <div className="border border-[#e5e0d8] bg-white p-8 max-[760px]:p-5">
          {/* 購買商品 */}
          <div className="mb-4 text-[12px] font-medium tracking-[.14em]">
            購買商品
          </div>

          <div className="border-b border-[#e5e0d8] pb-5">
            {buyList.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-2.5">
                <div className="aspect-[3/4] w-[48px] shrink-0 bg-[#F0EBE3]">
                  <img
                    src={imgSrc(item.imageUrl)}
                    alt={item.name}
                    className="size-full object-cover mix-blend-multiply"
                  />
                </div>

                <div className="flex-1 text-[12px] tracking-[.04em]">
                  <div>{item.name}</div>

                  <div className="mt-1 text-[11px] text-[#76716c]">
                    {item.color}
                    <span className="mx-2">/</span>
                    {item.size}
                    <span className="mx-2">×</span>
                    {item.qty}
                  </div>
                </div>

                <div className="text-[12px] tracking-[.05em]">
                  {money(item.price * item.qty)}
                </div>
              </div>
            ))}
          </div>

          {/* 收件資料 */}
          <div className="mt-7 mb-5 flex items-center justify-between">
            <span className="text-[12px] font-medium tracking-[.14em]">
              收件資料
            </span>

            <label
              className={`flex items-center gap-2 text-[12px] tracking-[.06em] ${
                member ? "cursor-pointer" : "cursor-not-allowed text-[#b5ada3]"
              }`}
            >
              <input
                type="checkbox"
                checked={sameAsMember}
                disabled={!member}
                onChange={(e) => toggleSameAsMember(e.target.checked)}
                className="size-4 accent-black"
              />
              同訂購人
            </label>
          </div>

          <div className="space-y-6">
            <Field label="收件人">
              <input
                className={inputClass}
                value={form.receiverName}
                maxLength={50}
                onChange={(e) => changeField("receiverName", e.target.value)}
              />
            </Field>

            <Field label="手機">
              <input
                className={inputClass}
                type="tel"
                value={form.receiverPhone}
                maxLength={20}
                onChange={(e) => changeField("receiverPhone", e.target.value)}
              />
            </Field>

            <Field label="Email（訂單通知用）">
              <input
                className={inputClass}
                type="email"
                value={form.receiverEmail}
                maxLength={255}
                onChange={(e) => changeField("receiverEmail", e.target.value)}
              />
            </Field>

            {/* 配送方式 */}
            <div>
              <span className="text-[11px] tracking-[.08em] text-[#76716c]">
                配送方式
              </span>

              <RadioGroup
                name="shippingMethod"
                options={SHIPPING_OPTIONS}
                value={form.shippingMethod}
                onChange={changeShippingMethod}
              />
            </div>

            <Field
              label={
                form.shippingMethod === "HOME" ? "宅配地址" : "超商門市名稱"
              }
            >
              <input
                className={inputClass}
                value={form.shippingAddress}
                maxLength={255}
                onChange={(e) => changeField("shippingAddress", e.target.value)}
              />
            </Field>

            {/* 付款方式 */}
            <div>
              <span className="text-[11px] tracking-[.08em] text-[#76716c]">
                付款方式
              </span>

              <RadioGroup
                name="paymentMethod"
                options={PAYMENT_OPTIONS}
                value={form.paymentMethod}
                onChange={(v) => changeField("paymentMethod", v)}
              />

              {(form.paymentMethod === "CREDIT" ||
                form.paymentMethod === "ATM") && (
                <p className="mt-3 text-[11px] leading-5 text-[#76716c]">
                  確認下單後將前往綠界官方測試付款頁。 訂單建立不代表付款成功。
                </p>
              )}
            </div>

            <Field label="備註（可不填）">
              <textarea
                className={`${inputClass} resize-y`}
                rows={2}
                value={form.note}
                maxLength={255}
                onChange={(e) => changeField("note", e.target.value)}
              />
            </Field>
          </div>

          {/* 金額明細 */}
          <div className="mt-8 space-y-3 border-t border-[#e5e0d8] pt-6 text-[12px] tracking-[.06em]">
            <div className="flex justify-between">
              <span>商品小計</span>
              <span>{money(subtotal)}</span>
            </div>

            <div className="flex justify-between">
              <span>運費</span>
              <span>{shippingFee === 0 ? "免運" : money(shippingFee)}</span>
            </div>

            {coupon && (
              <div className="flex justify-between text-[#9a3b2d]">
                <span>折價券（{coupon.title}）</span>
                <span>-{money(discount)}</span>
              </div>
            )}
          </div>

          <div className="mt-5 flex items-baseline justify-between border-t border-[#e5e0d8] pt-5">
            <span className="text-[14px] tracking-[.1em]">合計</span>

            <span className="text-[19px] tracking-[.05em]">{money(total)}</span>
          </div>

          <button
            type="button"
            onClick={submitOrder}
            disabled={submitting || Boolean(createdOrder)}
            className="mt-7 h-12 w-full bg-black text-[12px] tracking-[.18em] text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "處理中…"
              : form.paymentMethod === "CREDIT" || form.paymentMethod === "ATM"
                ? "確認下單並前往綠界付款"
                : "確認下單"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
