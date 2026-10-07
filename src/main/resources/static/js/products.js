    // 兩種模式：
    //   分類：/products.html?category=all_men-outer   → /api/categories/{code}/products（可篩選）
    //   搜尋：/products.html?keyword=外套              → /api/products?keyword=外套
    const PAGE_SIZE = 24;
    const categoryCode = param('category');
    const keyword = param('keyword');

    // 目前的篩選狀態；從網址讀進來，重新整理頁面也不會不見
    const query = new URLSearchParams(location.search);
    const state = {
        page: Number(query.get('page') || 0),
        sort: query.get('sort') || 'id,desc',
        colors: query.getAll('colors'),
        sizes: query.getAll('sizes'),
        minPrice: query.get('minPrice') || '',
        maxPrice: query.get('maxPrice') || ''
    };

    const grid = document.getElementById('grid');
    bindCardHearts(grid);

    /** 把目前狀態寫回網址（不重新載入頁面） */
    function syncUrl() {
        const q = new URLSearchParams();
        if (categoryCode) q.set('category', categoryCode);
        if (keyword) q.set('keyword', keyword);
        if (state.page) q.set('page', state.page);
        if (state.sort !== 'id,desc') q.set('sort', state.sort);
        state.colors.forEach(c => q.append('colors', c));
        state.sizes.forEach(s => q.append('sizes', s));
        if (state.minPrice) q.set('minPrice', state.minPrice);
        if (state.maxPrice) q.set('maxPrice', state.maxPrice);
        history.replaceState(null, '', '?' + q.toString());
    }

    /** 抓商品並畫出卡片、分頁 */
    async function loadProducts() {
        syncUrl();
        grid.innerHTML = '<div class="state" style="grid-column:1/-1">載入中…</div>';
        document.getElementById('pager').innerHTML = '';

        const q = new URLSearchParams({ page: state.page, size: PAGE_SIZE, sort: state.sort });
        let url;
        if (categoryCode) {
            state.colors.forEach(c => q.append('colors', c));
            state.sizes.forEach(s => q.append('sizes', s));
            if (state.minPrice) q.set('minPrice', state.minPrice);
            if (state.maxPrice) q.set('maxPrice', state.maxPrice);
            url = `/api/categories/${encodeURIComponent(categoryCode)}/products?${q}`;
        } else {
            q.set('keyword', keyword || '');
            url = `/api/products?${q}`;
        }

        try {
            // 回傳格式：{ content: [...商品], page: { number, size, totalElements, totalPages } }
            const result = await api(url);
            document.getElementById('total').textContent = `共 ${result.page.totalElements} 件商品`;
            if (result.content.length === 0) {
                grid.innerHTML = `<div class="state" style="grid-column:1/-1">沒有符合條件的商品。<br>
                    ${hasFilters() ? '<a href="#" onclick="clearFilters(); return false;">清除篩選</a>' : '<a href="/">回首頁逛逛</a>'}</div>`;
                return;
            }
            grid.innerHTML = result.content.map(productCard).join('');
            renderPager(result.page);
        } catch (e) {
            grid.innerHTML = `<div class="state" style="grid-column:1/-1">${esc(e.message)}</div>`;
        }
    }

    function renderPager({ number, totalPages }) {
        if (totalPages <= 1) return;
        // 最多顯示目前頁前後各 2 頁
        const from = Math.max(0, number - 2);
        const to = Math.min(totalPages - 1, number + 2);
        let html = `<button ${number === 0 ? 'disabled' : ''} data-page="${number - 1}">‹</button>`;
        for (let i = from; i <= to; i++) {
            html += `<button class="${i === number ? 'active' : ''}" data-page="${i}">${String(i + 1).padStart(2, '0')}</button>`;
        }
        html += `<button ${number >= totalPages - 1 ? 'disabled' : ''} data-page="${number + 1}">›</button>`;
        const pager = document.getElementById('pager');
        pager.innerHTML = html;
        pager.querySelectorAll('button:not([disabled])').forEach(b => b.addEventListener('click', () => {
            state.page = Number(b.dataset.page);
            loadProducts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }));
    }


    // ---------- 篩選（分類模式） ----------

    function hasFilters() {
        return state.colors.length || state.sizes.length || state.minPrice || state.maxPrice;
    }

    /** 顏色／尺寸按鈕：點一下選、再點一下取消（可以多選） */
    function renderOptionChips(containerId, values, selected) {
        const box = document.getElementById(containerId);
        box.innerHTML = values.length
            ? values.map(v => `<button class="chip${selected.includes(v) ? ' active' : ''}" data-value="${esc(v)}">${esc(v)}</button>`).join('')
            : '<span class="page-sub" style="padding-top:9px">無</span>';
        box.querySelectorAll('.chip').forEach(chip => chip.addEventListener('click', () => {
            const v = chip.dataset.value;
            const i = selected.indexOf(v);
            i >= 0 ? selected.splice(i, 1) : selected.push(v);
            chip.classList.toggle('active', i < 0);
            onFiltersChanged();
        }));
    }

    /** 篩選面板下方顯示「已選條件」，每個都可以單獨拿掉 */
    function renderActiveFilters() {
        const items = [
            ...state.colors.map(v => ({ label: v, remove: () => state.colors.splice(state.colors.indexOf(v), 1) })),
            ...state.sizes.map(v => ({ label: v, remove: () => state.sizes.splice(state.sizes.indexOf(v), 1) })),
        ];
        if (state.minPrice || state.maxPrice) {
            items.push({
                label: `${state.minPrice ? money(state.minPrice) : ''} – ${state.maxPrice ? money(state.maxPrice) : ''}`,
                remove: () => { state.minPrice = ''; state.maxPrice = ''; document.getElementById('minPrice').value = ''; document.getElementById('maxPrice').value = ''; }
            });
        }
        const box = document.getElementById('activeFilters');
        box.innerHTML = items.map((it, i) => `<button class="chip" data-i="${i}">${esc(it.label)} <span>×</span></button>`).join('');
        box.querySelectorAll('.chip').forEach(chip => chip.addEventListener('click', () => {
            items[chip.dataset.i].remove();
            refreshFilterChips();
            onFiltersChanged();
        }));
        const count = items.length;
        document.getElementById('filterCount').textContent = count ? `(${count})` : '';
    }

    let filterOptions = { colors: [], sizes: [] };

    // 後端回傳的尺寸是照字母排（3XL, 4XL, L, M…），改成由小到大；不在清單裡的（例如童裝 110、120）放後面照數字排
    const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];
    function sortSizes(sizes) {
        const rank = s => SIZE_ORDER.indexOf(s) >= 0 ? SIZE_ORDER.indexOf(s) : 100 + (parseFloat(s) || 0);
        return [...sizes].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
    }

    function refreshFilterChips() {
        renderOptionChips('colorOptions', filterOptions.colors, state.colors);
        renderOptionChips('sizeOptions', filterOptions.sizes, state.sizes);
    }

    function onFiltersChanged() {
        state.page = 0;
        renderActiveFilters();
        loadProducts();
    }

    function clearFilters() {
        state.colors.length = 0;
        state.sizes.length = 0;
        state.minPrice = state.maxPrice = '';
        document.getElementById('minPrice').value = '';
        document.getElementById('maxPrice').value = '';
        refreshFilterChips();
        onFiltersChanged();
    }

    async function initCategory() {
        document.getElementById('eyebrow').textContent = 'COLLECTION';
        document.getElementById('filterToggle').hidden = false;

        // 麵包屑、標題、下一層分類、篩選選項，四支 API 同時抓
        try {
            const code = encodeURIComponent(categoryCode);
            const [crumbs, detail, options] = await Promise.all([
                api(`/api/categories/${code}/breadcrumb`),
                api(`/api/categories/${code}`),
                api(`/api/categories/${code}/filters`)
            ]);

            document.title = detail.name + ' — KINU';
            document.getElementById('title').textContent = detail.name;
            document.getElementById('breadcrumb').innerHTML =
                '<a href="/">首頁</a>' +
                crumbs.map((c, i) => i === crumbs.length - 1
                    ? `<span class="sep">/</span><span>${esc(c.name)}</span>`
                    : `<span class="sep">/</span><a href="/products.html?category=${encodeURIComponent(c.code)}">${esc(c.name)}</a>`).join('');
            document.getElementById('subcats').innerHTML = detail.children.map(c =>
                `<a class="chip" href="/products.html?category=${encodeURIComponent(c.code)}">${esc(c.name)}</a>`).join('');

            filterOptions = { colors: options.colors, sizes: sortSizes(options.sizes) };
            refreshFilterChips();
            document.getElementById('minPrice').value = state.minPrice;
            document.getElementById('maxPrice').value = state.maxPrice;
            renderActiveFilters();
            if (hasFilters()) toggleFilters(true);
        } catch (e) {
            document.getElementById('title').textContent = '找不到分類';
            grid.innerHTML = `<div class="state" style="grid-column:1/-1">${esc(e.message)}<br><a href="/">回首頁</a></div>`;
            return;
        }
        loadProducts();
    }

    function toggleFilters(force) {
        const open = document.getElementById('filters').classList.toggle('open', force);
        document.getElementById('filterArrow').textContent = open ? '－' : '＋';
    }

    document.getElementById('filterToggle').addEventListener('click', () => toggleFilters());
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
    document.getElementById('applyPrice').addEventListener('click', () => {
        const min = document.getElementById('minPrice').value;
        const max = document.getElementById('maxPrice').value;
        if (min && max && Number(min) > Number(max)) {
            toast('最低價格不能高於最高價格', true);
            return;
        }
        state.minPrice = min;
        state.maxPrice = max;
        onFiltersChanged();
    });

    const sortSelect = document.getElementById('sort');
    sortSelect.value = state.sort;
    sortSelect.addEventListener('change', () => {
        state.sort = sortSelect.value;
        state.page = 0;
        loadProducts();
    });


    // ---------- 啟動 ----------

    (async () => {
        await loadWishlistSlugs();        // 先知道哪些已收藏，愛心才亮得起來
        if (categoryCode) {
            initCategory();
        } else if (keyword) {
            document.title = `搜尋「${keyword}」 — KINU`;
            document.getElementById('eyebrow').textContent = 'SEARCH';
            document.getElementById('title').textContent = `「${keyword}」的搜尋結果`;
            document.getElementById('breadcrumb').innerHTML = '<a href="/">首頁</a><span class="sep">/</span><span>搜尋</span>';
            loadProducts();
        } else {
            location.replace('/products.html?category=all_women');
        }
    })();
