    const FREE_SHIPPING = 2500;   // 公告列寫的「滿 NT$2,500 免運」
    const SHIPPING_FEE = 50;      // 未滿免運的運費；跟 CheckoutService 的 SHIPPING_FEE 一樣，改的話兩邊要一起改
    let items = [];
    let showCheckout = false;       // 按過「前往結帳」就展開收件資料表單
    let submitting = false;         // 送出中，避免連按重複下單
    let coupons = [];               // 這次小計下，未使用、未過期的券（含未達低消的）
    let selectedCouponId = null;    // 選中的券（MemberCoupon.id），null = 不使用
    let couponRequest = 0;          // 快速連按改數量時，只採用最後一次的查詢結果

    async function load() {
        try {
            items = await api('/api/cart');
            render();
        } catch (e) {
            document.getElementById('content').innerHTML = `<div class="state">${esc(e.message)}</div>`;
        }
    }

    function render() {
        const box = document.getElementById('content');
        const totalQty = items.reduce((sum, it) => sum + it.qty, 0);
        document.getElementById('count').textContent = items.length ? `共 ${totalQty} 件` : '';

        if (items.length === 0) {
            box.innerHTML = '<div class="state">購物車目前是空的。<br><a href="/products.html?category=all_women">去逛逛本季新品</a></div>';
            return;
        }

        // 已下架、或數量超過庫存的品項，不算進金額，也不能結帳
        const valid = items.filter(it => it.onSale && it.qty <= it.stock);
        const subtotal = valid.reduce((sum, it) => sum + it.price * it.qty, 0);
        const remain = Math.max(0, FREE_SHIPPING - subtotal);
        const hasProblem = valid.length !== items.length;
        const shippingFee = shippingFeeOf(subtotal);
        const draft = readDraft();      // 改數量會重畫整塊，先記下表單已經填的內容

        box.innerHTML = `
            <div class="cart">
                <div class="cart-list">${items.map(itemRow).join('')}</div>
                <aside class="summary">
                    <h2>訂單摘要</h2>
                    <div class="sum-row"><span>商品小計</span><span>${money(subtotal)}</span></div>
                    <div class="sum-row"><span>運費</span><span>${shippingFee === 0 ? '免運' : money(shippingFee)}</span></div>
                    <p class="ship-note">${remain === 0 ? '已達免運門檻' : `再買 ${money(remain)} 即可享免運`}</p>
                    <div class="ship-bar"><i style="width:${Math.min(100, subtotal / FREE_SHIPPING * 100)}%"></i></div>
                    <div class="coupon-box">
                        <div class="sum-row"><span>折價券</span><a class="link-btn" href="/coupons.html">我的折價券</a></div>
                        <div id="couponList"><div class="coupon-empty">載入中…</div></div>
                    </div>
                    <div class="sum-row" id="discountRow" hidden><span>折價券折抵</span><span id="discountAmount"></span></div>
                    <div class="sum-row total"><span>合計</span><span id="totalAmount">${money(subtotal + shippingFee)}</span></div>
                    ${hasProblem ? '<p class="ship-note" style="color:#9a3b2d">部分商品已下架或庫存不足，不會一起結帳。</p>' : ''}
                    ${showCheckout ? checkoutForm(valid.length) : `<button class="btn" id="checkoutBtn" ${valid.length === 0 ? 'disabled' : ''}>前往結帳　→</button>`}
                </aside>
            </div>`;

        box.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', onAction));
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) checkoutBtn.addEventListener('click', openCheckout);
        const form = document.getElementById('checkoutForm');
        if (form) {
            fillDraft(draft);
            form.addEventListener('change', updateAddressLabel);
            form.addEventListener('submit', submitCheckout);
            updateAddressLabel();
        }
        loadCoupons(subtotal);
    }

    // ---------- 結帳 ----------

    // 沒有能結帳的商品時不收運費（只是畫面顯示用，真正的金額以後端算的為準）
    function shippingFeeOf(subtotal) {
        return subtotal === 0 || subtotal >= FREE_SHIPPING ? 0 : SHIPPING_FEE;
    }

    // 欄位名稱同 CheckoutRequest；代碼 home / cvs、credit / atm / cod 也同後端的驗證規則
    function checkoutForm(validCount) {
        return `
            <form class="checkout-form" id="checkoutForm" novalidate>
                <h3>收件資料</h3>
                <label>收件人<input type="text" name="receiverName" maxlength="50" required autocomplete="name"></label>
                <label>手機<input type="tel" name="receiverPhone" maxlength="20" required autocomplete="tel"></label>
                <label>Email（訂單通知用，可不填）<input type="email" name="receiverEmail" maxlength="255" autocomplete="email"></label>
                <fieldset>
                    <legend>配送方式</legend>
                    <label><input type="radio" name="shippingMethod" value="home" checked> 宅配</label>
                    <label><input type="radio" name="shippingMethod" value="cvs"> 超商取貨</label>
                </fieldset>
                <label><span id="addressLabel">收件地址</span><input type="text" name="shippingAddress" maxlength="255" required></label>
                <fieldset>
                    <legend>付款方式</legend>
                    <label><input type="radio" name="paymentMethod" value="credit" checked> 信用卡</label>
                    <label><input type="radio" name="paymentMethod" value="atm"> ATM 轉帳</label>
                    <label><input type="radio" name="paymentMethod" value="cod"> 貨到付款</label>
                </fieldset>
                <label>備註（可不填）<textarea name="note" rows="2" maxlength="255"></textarea></label>
                <button class="btn" type="submit" ${validCount === 0 || submitting ? 'disabled' : ''}>${submitting ? '送出中…' : '確認下單'}</button>
            </form>`;
    }

    // 第一次展開表單時，用會員資料先幫忙填好姓名、手機、Email、地址
    async function openCheckout() {
        showCheckout = true;
        render();
        try {
            const me = await api('/api/member/me');
            const form = document.getElementById('checkoutForm');
            if (!form) return;
            const fill = (name, value) => { if (value && !form.elements[name].value) form.elements[name].value = value; };
            fill('receiverName', me.name);
            fill('receiverPhone', me.phone);
            fill('receiverEmail', me.email);
            if (form.elements.shippingMethod.value === 'home') fill('shippingAddress', me.address);
        } catch {}     // 拿不到會員資料就讓使用者自己填
    }

    function updateAddressLabel() {
        const form = document.getElementById('checkoutForm');
        document.getElementById('addressLabel').textContent =
            form.elements.shippingMethod.value === 'cvs' ? '超商門市名稱' : '收件地址';
    }

    function readDraft() {
        const form = document.getElementById('checkoutForm');
        return form ? Object.fromEntries(new FormData(form)) : null;
    }

    function fillDraft(draft) {
        if (!draft) return;
        const form = document.getElementById('checkoutForm');
        Object.entries(draft).forEach(([name, value]) => {
            const el = form.elements[name];
            if (el) el.value = value;       // radio 群組設 value 會自動勾選對應的選項
        });
    }

    async function submitCheckout(e) {
        e.preventDefault();
        if (submitting) return;                 // 送出中又按 Enter 或連點，不要重複下單
        const form = e.currentTarget;
        if (!form.reportValidity()) return;     // 必填沒填、Email 格式不對，瀏覽器會直接提示

        // 只結帳能買的品項（已下架、超過庫存的留在購物車）
        const cartItemIdList = items.filter(it => it.onSale && it.qty <= it.stock).map(it => it.id);
        const data = Object.fromEntries(new FormData(form));
        const body = {
            receiverName: data.receiverName.trim(),
            receiverPhone: data.receiverPhone.trim(),
            receiverEmail: data.receiverEmail.trim() || null,
            shippingMethod: data.shippingMethod,
            shippingAddress: data.shippingAddress.trim(),
            paymentMethod: data.paymentMethod,
            note: data.note.trim() || null,
            memberCouponId: selectedCouponId,
            cartItemIdList
        };

        const btn = form.querySelector('button[type="submit"]');
        submitting = true;
        btn.disabled = true;
        btn.textContent = '送出中…';
        try {
            const order = await api('/api/checkout', { method: 'POST', body });
            showDone(order);
            refreshCounts();
        } catch (err) {
            toast(err.message, true);
            submitting = false;
            load();     // 跟後端重新同步（例如庫存剛被別人買走、券已經用掉）；表單內容會保留
        }
    }

    const SHIPPING_TEXT = { home: '宅配', cvs: '超商取貨' };
    const PAYMENT_TEXT = { credit: '信用卡', atm: 'ATM 轉帳', cod: '貨到付款' };

    function showDone(o) {
        document.getElementById('count').textContent = '';
        document.getElementById('content').innerHTML = `
            <div class="done">
                <div class="page-eyebrow">THANK YOU</div>
                <h2>訂單已成立</h2>
                <div class="no">${esc(o.orderNo)}</div>
                <div class="info">
                    ${fmtDate(o.createdAt)} 下單　·　實付 ${money(o.total)}<br>
                    ${esc(o.receiverName)}　${esc(o.receiverPhone)}<br>
                    ${SHIPPING_TEXT[o.shippingMethod] || esc(o.shippingMethod)}　·　${esc(o.shippingAddress)}<br>
                    ${PAYMENT_TEXT[o.paymentMethod] || esc(o.paymentMethod)}
                </div>
                <div class="actions">
                    <a class="btn" href="/orders.html">查看我的訂單</a>
                    <a class="btn btn-ghost" href="/products.html?category=all_women">繼續購物</a>
                </div>
            </div>`;
        window.scrollTo(0, 0);
    }

    // ---------- 折價券 ----------

    // 小計一變（改數量、移除）就重新問後端：哪些券達到低消、各能折多少
    async function loadCoupons(subtotal) {
        const req = ++couponRequest;
        try {
            const list = subtotal > 0 ? await api('/api/coupon/usable?subtotal=' + subtotal) : [];
            if (req !== couponRequest) return;      // 已經有更新的查詢，這次的結果不要了
            coupons = list;
        } catch (e) {
            if (req !== couponRequest) return;
            coupons = [];
            document.getElementById('couponList').innerHTML = `<div class="coupon-empty">${esc(e.message)}</div>`;
            return updateTotal(subtotal);
        }

        // 原本選的券用掉了、過期了，或小計變少沒達到低消 → 取消選取
        const selected = coupons.find(c => c.id === selectedCouponId);
        if (!selected || !selected.meetsMinSubtotal) selectedCouponId = null;

        renderCoupons(subtotal);
    }

    function renderCoupons(subtotal) {
        const el = document.getElementById('couponList');
        if (coupons.length === 0) {
            el.innerHTML = '<div class="coupon-empty">目前沒有可使用的折價券</div>';
            return updateTotal(subtotal);
        }

        el.innerHTML = couponOption({ id: '', title: '不使用折價券', meetsMinSubtotal: true }, subtotal)
            + coupons.map(c => couponOption(c, subtotal)).join('');
        el.querySelectorAll('input[name="coupon"]').forEach(radio => radio.addEventListener('change', () => {
            selectedCouponId = radio.value ? Number(radio.value) : null;
            updateTotal(subtotal);
        }));
        updateTotal(subtotal);
    }

    function couponOption(c, subtotal) {
        const isNone = c.id === '';
        const checked = isNone ? selectedCouponId === null : c.id === selectedCouponId;
        let right = '';
        if (!isNone) {
            // 未達低消：還是列出來但不能選，提示再買多少
            right = !c.meetsMinSubtotal ? `再買 ${money(c.minSubtotal - subtotal)} 可使用`
                : `−${money(c.discount)}`;
        }
        return `
            <label class="coupon-opt${c.meetsMinSubtotal ? '' : ' disabled'}">
                <input type="radio" name="coupon" value="${c.id}" ${checked ? 'checked' : ''} ${c.meetsMinSubtotal ? '' : 'disabled'}>
                <span>
                    ${esc(c.title)}
                    ${isNone ? '' : `<div class="cond">${couponRuleText(c)}　·　${fmtDate(c.expireAt)} 到期</div>`}
                </span>
                <span class="off">${right}</span>
            </label>`;
    }

    // 合計 = 小計 − 折抵 + 運費，算法同 CheckoutService（免運看的是折抵前的小計）
    function updateTotal(subtotal) {
        const coupon = coupons.find(c => c.id === selectedCouponId);
        const discount = coupon ? coupon.discount : 0;
        const shippingFee = shippingFeeOf(subtotal);
        document.getElementById('discountRow').hidden = discount === 0;
        document.getElementById('discountAmount').textContent = '−' + money(discount);
        document.getElementById('totalAmount').textContent = money(subtotal - discount + shippingFee);
    }

    function itemRow(it) {
        const href = `/product.html?slug=${encodeURIComponent(it.slug)}&color=${encodeURIComponent(it.color)}`;
        const img = it.imageUrl ? `<img src="${esc(imgSrc(it.imageUrl))}" alt="${esc(it.name)}">` : '';
        let warn = '';
        if (!it.onSale) warn = '此商品已下架，請移除';
        else if (it.stock === 0) warn = '已售完，請移除';
        else if (it.qty > it.stock) warn = `庫存只剩 ${it.stock} 件，請調整數量`;

        return `
            <div class="cart-item${it.onSale ? '' : ' off-sale'}">
                ${it.onSale ? `<a class="thumb" href="${href}">${img}</a>` : `<div class="thumb">${img}</div>`}
                <div>
                    ${it.onSale ? `<a class="name" href="${href}">${esc(it.name)}</a>` : `<span class="name">${esc(it.name)}</span>`}
                    <div class="meta">${esc(it.color)}　/　${esc(it.size)}　·　${money(it.price)}</div>
                    ${it.onSale ? `
                    <div class="qty">
                        <button data-action="minus" data-id="${it.id}" ${it.qty <= 1 ? 'disabled' : ''} aria-label="減少">−</button>
                        <span>${it.qty}</span>
                        <button data-action="plus" data-id="${it.id}" ${it.qty >= it.stock ? 'disabled' : ''} aria-label="增加">＋</button>
                    </div>` : ''}
                    ${warn ? `<div class="warn">${warn}</div>` : ''}
                </div>
                <div class="right">
                    <div class="line-total">${money(it.price * it.qty)}</div>
                    <button class="link-btn" data-action="remove" data-id="${it.id}">移除</button>
                </div>
            </div>`;
    }

    async function onAction(e) {
        const btn = e.currentTarget;
        const id = Number(btn.dataset.id);
        const item = items.find(it => it.id === id);
        btn.disabled = true;
        try {
            if (btn.dataset.action === 'remove') {
                await api('/api/cart/' + id, { method: 'DELETE' });
                items = items.filter(it => it.id !== id);
                toast('已從購物車移除');
            } else {
                // 庫存不足時，按減號直接降到庫存上限
                const next = btn.dataset.action === 'plus' ? item.qty + 1
                    : Math.min(item.qty - 1, Math.max(1, item.stock));
                await api('/api/cart', { method: 'PATCH', body: { cartItemId: id, qty: next } });
                item.qty = next;
            }
            render();
            refreshCounts();
        } catch (err) {
            toast(err.message, true);
            load();     // 跟後端重新同步（例如庫存剛被別人買走）
        }
    }

    load();
