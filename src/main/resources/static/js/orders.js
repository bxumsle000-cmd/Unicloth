    // status 是後端 OrderStatus 的 name()，中文對照同 OrderStatus 的 label
    const STATUS_TEXT = {
        PENDING: '訂單確認中',
        SHIPPED: '已出貨',
        DELIVERED: '已送達',
        PICKED_UP: '取貨完畢',
        CANCELLED: '已取消'
    };
    // 代碼對照同 CheckoutRequest 的驗證規則
    const SHIPPING_TEXT = { home: '宅配', cvs: '超商取貨' };
    const PAYMENT_TEXT = { credit: '信用卡', atm: 'ATM 轉帳', cod: '貨到付款' };
    const TABS = [{ key: 'all', label: '全部' }, ...Object.keys(STATUS_TEXT).map(key => ({ key, label: STATUS_TEXT[key] }))];
    let orders = [];
    let tab = 'all';

    function render() {
        document.getElementById('count').textContent = orders.length ? `共 ${orders.length} 筆訂單` : '';

        document.getElementById('tabs').innerHTML = orders.length === 0 ? '' : TABS.map(t => {
            const n = t.key === 'all' ? orders.length : orders.filter(o => o.status === t.key).length;
            return `<button class="chip${t.key === tab ? ' active' : ''}" data-tab="${t.key}">${t.label} ${n}</button>`;
        }).join('');
        document.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => {
            tab = btn.dataset.tab;
            render();
        }));

        const box = document.getElementById('content');
        if (orders.length === 0) {
            box.innerHTML = '<div class="state">目前還沒有訂單。<br><a href="/products.html?category=all_women">去逛逛</a></div>';
            return;
        }
        const list = tab === 'all' ? orders : orders.filter(o => o.status === tab);
        box.innerHTML = list.length === 0
            ? `<div class="state">目前沒有${STATUS_TEXT[tab]}的訂單</div>`
            : `<div class="order-list">${list.map(orderCard).join('')}</div>`;
    }

    function orderCard(o) {
        return `
            <div class="order">
                <div class="order-head">
                    <div>
                        <div class="no">${esc(o.orderNo)}</div>
                        <div class="date">${fmtDate(o.createdAt)} 下單</div>
                    </div>
                    <span class="status${o.status === 'CANCELLED' ? ' cancelled' : ''}">${STATUS_TEXT[o.status] || esc(o.status)}</span>
                </div>
                <div class="order-items">${o.orderItemResponseList.map(itemRow).join('')}</div>
                <div class="order-foot">
                    <div class="info">
                        ${esc(o.receiverName)}　${esc(o.receiverPhone)}<br>
                        ${SHIPPING_TEXT[o.shippingMethod] || esc(o.shippingMethod)}　·　${esc(o.shippingAddress)}<br>
                        ${PAYMENT_TEXT[o.paymentMethod] || esc(o.paymentMethod)}${o.note ? `　·　備註：${esc(o.note)}` : ''}
                    </div>
                    <div class="total"><span>實付金額</span>${money(o.total)}</div>
                </div>
            </div>`;
    }

    function itemRow(it) {
        const img = it.imageUrl ? `<img src="${esc(imgSrc(it.imageUrl))}" alt="${esc(it.productName)}" loading="lazy">` : '';
        return `
            <div class="order-item">
                <div class="thumb">${img}</div>
                <div>
                    <div class="name">${esc(it.productName)}</div>
                    <div class="meta">${esc(it.color)}　/　${esc(it.size)}　·　數量 ${it.qty}</div>
                </div>
                <div class="price">${money(it.totalPrice)}</div>
            </div>`;
    }

    (async () => {
        try {
            orders = await api('/api/orders');
            render();
        } catch (e) {
            document.getElementById('content').innerHTML = `<div class="state">${esc(e.message)}</div>`;
        }
    })();
