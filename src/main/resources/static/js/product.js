    // /product.html?slug=men-487511 → /api/products/men-487511
    const slug = param('slug');
    let product = null;       // 後端回傳的商品詳情
    let colorIndex = 0;       // 目前選的顏色（colorOptions 的第幾個）
    let selectedSize = null;  // 目前選的尺寸（SizeOption：variantId, size, stock）
    let qty = 1;

    async function init() {
        const box = document.getElementById('content');
        if (!slug) {
            box.innerHTML = '<div class="state">沒有指定商品。<br><a href="/">回首頁</a></div>';
            return;
        }
        try {
            const [detail, liked] = await Promise.all([
                api('/api/products/' + encodeURIComponent(slug)),
                api('/api/wishlist/' + encodeURIComponent(slug)).catch(() => false)
            ]);
            product = detail;
            if (liked) wishlistSlugs.add(slug);
        } catch (e) {
            box.innerHTML = `<div class="state">${esc(e.message)}<br><a href="/">回首頁</a></div>`;
            return;
        }

        document.title = product.name + ' — KINU';
        document.getElementById('crumbName').textContent = product.name;
        if (product.colorOptions.length === 0) {
            box.innerHTML = `<div class="state">${esc(product.name)} 目前沒有可販售的款式。<br><a href="/">回首頁</a></div>`;
            return;
        }

        // 網址有 ?color=黑色 就預選那個顏色，否則選第一個有庫存的顏色
        const wanted = param('color');
        const byName = product.colorOptions.findIndex(c => c.color === wanted);
        const inStock = product.colorOptions.findIndex(c => c.sizeOptions.some(s => s.stock > 0));
        colorIndex = byName >= 0 ? byName : Math.max(0, inStock);

        const onSale = product.origPrice && product.origPrice > product.price;
        box.innerHTML = `
            <div class="detail">
                <div class="gallery"><img id="mainImg" alt="${esc(product.name)}"></div>
                <div class="info">
                    <div class="page-eyebrow">KINU ${esc(product.slug.split('-')[0].toUpperCase())}</div>
                    <h1>${esc(product.name)}</h1>
                    <div class="price${onSale ? ' sale' : ''}">${money(product.price)}${onSale ? `<del>${money(product.origPrice)}</del>` : ''}</div>

                    <div class="section">
                        <div class="section-label">顏色 <b id="colorName"></b></div>
                        <div class="swatches" id="swatches"></div>
                    </div>
                    <div class="section">
                        <div class="section-label">尺寸 <b id="sizeName"></b></div>
                        <div class="sizes" id="sizes"></div>
                        <div class="stock-note" id="stockNote"></div>
                        <div class="section-label" style="margin:22px 0 10px">數量</div>
                        <div class="qty">
                            <button id="qtyMinus" aria-label="減少">−</button>
                            <span id="qtyValue">1</span>
                            <button id="qtyPlus" aria-label="增加">＋</button>
                        </div>
                        <div class="buy">
                            <button class="btn" id="addToCart">加入購物車　→</button>
                            <button class="heart${wishlistSlugs.has(slug) ? ' on' : ''}" id="heartBtn" aria-label="收藏">${HEART_SVG}</button>
                        </div>
                    </div>
                    ${product.description ? `
                    <div class="section">
                        <button class="desc-toggle" id="descToggle"><span>商品說明</span><span id="descArrow">＋</span></button>
                        <div class="desc-body" id="descBody"><div class="desc">${esc(product.description)}</div></div>
                    </div>` : ''}
                </div>
            </div>`;

        document.getElementById('qtyMinus').addEventListener('click', () => setQty(qty - 1));
        document.getElementById('qtyPlus').addEventListener('click', () => setQty(qty + 1));
        document.getElementById('addToCart').addEventListener('click', addToCart);
        document.getElementById('heartBtn').addEventListener('click', e => toggleWishlist(slug, e.currentTarget));
        const descToggle = document.getElementById('descToggle');
        if (descToggle) descToggle.addEventListener('click', () => {
            const open = document.getElementById('descBody').classList.toggle('open');
            document.getElementById('descArrow').textContent = open ? '－' : '＋';
        });

        renderColor();
    }

    /** 換顏色：大圖、色塊、尺寸按鈕都要跟著換 */
    function renderColor() {
        const color = product.colorOptions[colorIndex];
        document.getElementById('mainImg').src = imgSrc(color.imageUrl);
        document.getElementById('colorName').textContent = color.color;

        const swatches = document.getElementById('swatches');
        swatches.innerHTML = product.colorOptions.map((c, i) => `
            <button class="swatch${i === colorIndex ? ' active' : ''}" data-i="${i}" title="${esc(c.color)}" aria-label="${esc(c.color)}">
                <img src="${esc(imgSrc(c.imageUrl))}" alt="">
            </button>`).join('');
        swatches.querySelectorAll('.swatch').forEach(b => b.addEventListener('click', () => {
            colorIndex = Number(b.dataset.i);
            renderColor();
        }));

        // 換顏色後，盡量保留原本選的尺寸（新顏色有這個尺寸而且有貨）
        const keep = selectedSize && color.sizeOptions.find(s => s.size === selectedSize.size && s.stock > 0);
        selectedSize = keep || null;

        const sizes = document.getElementById('sizes');
        sizes.innerHTML = color.sizeOptions.map((s, i) => `
            <button class="chip${selectedSize && s.variantId === selectedSize.variantId ? ' active' : ''}" data-i="${i}" ${s.stock > 0 ? '' : 'disabled title="缺貨"'}>${esc(s.size)}</button>`).join('');
        sizes.querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => {
            selectedSize = color.sizeOptions[Number(b.dataset.i)];
            sizes.querySelectorAll('.chip').forEach(x => x.classList.toggle('active', x === b));
            setQty(qty);
        }));

        setQty(qty);
    }

    /** 數量：最少 1，最多是這個尺寸的庫存 */
    function setQty(n) {
        const max = selectedSize ? selectedSize.stock : 99;
        qty = Math.min(Math.max(1, n), Math.max(1, max));
        document.getElementById('qtyValue').textContent = qty;
        document.getElementById('qtyMinus').disabled = qty <= 1;
        document.getElementById('qtyPlus').disabled = qty >= max;
        document.getElementById('sizeName').textContent = selectedSize ? selectedSize.size : '';

        const soldOut = product.colorOptions[colorIndex].sizeOptions.every(s => s.stock <= 0);
        document.getElementById('stockNote').textContent =
            soldOut ? '這個顏色目前全部缺貨'
            : selectedSize && selectedSize.stock <= 5 ? `僅剩 ${selectedSize.stock} 件`
            : '';
        document.getElementById('addToCart').disabled = soldOut;
    }

    async function addToCart() {
        if (!selectedSize) {
            toast('請先選擇尺寸', true);
            return;
        }
        const btn = document.getElementById('addToCart');
        btn.disabled = true;
        try {
            await api('/api/cart', { method: 'POST', body: { variantId: selectedSize.variantId, qty } });
            toast(`已加入購物車：${product.colorOptions[colorIndex].color} / ${selectedSize.size} × ${qty}`);
            refreshCounts();
        } catch (e) {
            toast(e.message, true);      // 例如「不能超過庫存數量」（購物車原本就有，加起來超過）
        } finally {
            btn.disabled = false;
        }
    }

    init();
