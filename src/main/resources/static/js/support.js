    // 問題類型同 CreateSupportTicketRequest 的驗證規則，改的話兩邊要一起改
    const TOPICS = ['訂單與物流', '退換貨', '商品諮詢', '付款與發票', '折價券與活動', '會員帳號問題', '其他'];
    // status 是後端 TicketStatus 的 name()，中文對照同 TicketStatus 的 label
    const STATUS_TEXT = {
        IN_PROGRESS: '處理中',
        RESOLVED: '已解決'
    };
    const MESSAGE_MAX = 2000;
    let tickets = [];
    let submitting = false;         // 送出中，避免連按重複送單

    const form = document.getElementById('supportForm');
    form.elements.topic.insertAdjacentHTML('beforeend',
        TOPICS.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join(''));

    // 字數提示；開始打字就清掉「只填空白」的提示
    form.elements.message.addEventListener('input', () => {
        document.getElementById('messageCount').textContent = `${form.elements.message.value.length} / ${MESSAGE_MAX}`;
        form.elements.message.setCustomValidity('');
    });

    form.addEventListener('submit', async e => {
        e.preventDefault();
        if (submitting) return;
        // 只填空白也算沒填
        form.elements.message.setCustomValidity(form.elements.message.value.trim() ? '' : '請填寫問題內容');
        if (!form.reportValidity()) return;     // 必填沒填、Email 格式不對，瀏覽器會直接提示

        const data = Object.fromEntries(new FormData(form));
        const body = {
            email: data.email.trim(),
            topic: data.topic,
            message: data.message.trim()
        };

        const btn = form.querySelector('button[type="submit"]');
        submitting = true;
        btn.disabled = true;
        btn.textContent = '送出中…';
        try {
            const ticket = await api('/api/support-tickets', { method: 'POST', body });
            toast(`已送出，客服單號 ${ticket.ticketNo}`);
            // Email 留著，下次不用再填
            form.elements.topic.value = '';
            form.elements.message.value = '';
            document.getElementById('messageCount').textContent = `0 / ${MESSAGE_MAX}`;
            tickets.unshift(ticket);
            renderTickets();
        } catch (err) {
            toast(err.message, true);
        } finally {
            submitting = false;
            btn.disabled = false;
            btn.textContent = '送出';
        }
    });

    function renderTickets() {
        const box = document.getElementById('tickets');
        box.innerHTML = tickets.length === 0
            ? '<div class="state">還沒有送出過客服單</div>'
            : `<div class="ticket-list">${tickets.map(ticketCard).join('')}</div>`;
    }

    function ticketCard(t) {
        return `
            <div class="ticket">
                <div class="ticket-head">
                    <div>
                        <div class="no">${esc(t.ticketNo)}</div>
                        <div class="date">${fmtDate(t.createdAt)} 送出</div>
                    </div>
                    <span class="status${t.status === 'RESOLVED' ? ' resolved' : ''}">${STATUS_TEXT[t.status] || esc(t.status)}</span>
                </div>
                <div class="ticket-body">
                    <div class="topic">${esc(t.topic)}　·　${esc(t.email)}</div>
                    <div class="message">${esc(t.message)}</div>
                </div>
            </div>`;
    }

    (async () => {
        try {
            tickets = await api('/api/support-tickets');
            renderTickets();
        } catch (e) {
            document.getElementById('tickets').innerHTML = `<div class="state">${esc(e.message)}</div>`;
        }
    })();

    // 用會員資料先幫忙填好 Email；拿不到就讓使用者自己填
    (async () => {
        try {
            const me = await api('/api/member/me');
            if (me.email && !form.elements.email.value) form.elements.email.value = me.email;
        } catch {}
    })();
