    const grid = document.getElementById('grid');

    function renderCount() {
        const n = wishlistSlugs.size;
        document.getElementById('count').textContent = n ? `共 ${n} 件商品` : '';
        if (n === 0) {
            grid.innerHTML = '<div class="state" style="grid-column:1/-1">還沒有收藏任何商品。<br>在商品上按愛心，就會出現在這裡。<br><a href="/products.html?category=all_women">去逛逛</a></div>';
        }
    }

    // 在收藏頁按愛心 = 取消收藏，卡片直接拿掉
    bindCardHearts(grid, (slug, added) => {
        if (added) return;
        const btn = grid.querySelector(`.heart[data-slug="${CSS.escape(slug)}"]`);
        if (btn) btn.closest('.card-wrap').remove();
        renderCount();
    });

    (async () => {
        try {
            // 最新收藏的在前面；已下架的也會回傳（onSale = false），卡片會變灰、不能點進商品頁
            const list = await api('/api/wishlist');
            list.forEach(item => wishlistSlugs.add(item.slug));
            grid.innerHTML = list.map(productCard).join('');
            renderCount();
        } catch (e) {
            grid.innerHTML = `<div class="state" style="grid-column:1/-1">${esc(e.message)}</div>`;
        }
    })();
