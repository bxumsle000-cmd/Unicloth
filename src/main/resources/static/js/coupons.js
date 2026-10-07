    // status 是後端算好的：usable（可使用）/ used（已使用）/ expired（已過期）
    const TABS = [
        { key: 'usable', label: '可使用' },
        { key: 'used', label: '已使用' },
        { key: 'expired', label: '已過期' }
    ];
    const STATUS_TEXT = { usable: '可使用', used: '已使用', expired: '已過期' };
    let coupons = [];
    let tab = 'usable';             // 進頁面先看可使用的

    function render() {
        const usableCount = coupons.filter(c => c.status === 'usable').length;
        document.getElementById('count').textContent = coupons.length ? `${usableCount} 張可使用　·　共 ${coupons.length} 張` : '';

        document.getElementById('tabs').innerHTML = coupons.length === 0 ? '' : TABS.map(t => {
            const n = coupons.filter(c => c.status === t.key).length;
            return `<button class="chip${t.key === tab ? ' active' : ''}" data-tab="${t.key}">${t.label} ${n}</button>`;
        }).join('');
        document.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => {
            tab = btn.dataset.tab;
            render();
        }));

        const box = document.getElementById('content');
        if (coupons.length === 0) {
            box.innerHTML = '<div class="state">目前還沒有折價券。<br><a href="/products.html?category=all_women">去逛逛</a></div>';
            return;
        }
        const list = coupons.filter(c => c.status === tab);
        box.innerHTML = list.length === 0
            ? `<div class="state">目前沒有${STATUS_TEXT[tab]}的折價券</div>`
            : `<div class="coupon-grid">${list.map(couponCard).join('')}</div>`;
    }

    function couponCard(c) {
        const benefit = c.type === 'amount' ? money(c.value)
            : `${(100 - c.value) / 10} 折`;
        return `
            <div class="coupon${c.status === 'usable' ? '' : ' inactive'}">
                <div class="benefit">${benefit}</div>
                <div class="info">
                    <div class="title">${esc(c.title)}</div>
                    <div class="rule">${couponRuleText(c)}</div>
                    <div class="date">${fmtDate(c.expireAt)} 到期</div>
                    <div class="foot">
                        <span class="code">${esc(c.code)}</span>
                        <span class="status">${STATUS_TEXT[c.status] || ''}</span>
                    </div>
                </div>
            </div>`;
    }

    (async () => {
        try {
            coupons = await api('/api/coupon');
            render();
        } catch (e) {
            document.getElementById('content').innerHTML = `<div class="state">${esc(e.message)}</div>`;
        }
    })();
