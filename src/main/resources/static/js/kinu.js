/* =====================================================================
 * KINU 共用 JS：每一頁都會載入（放在 <body> 最後面）
 * - 把頁首、頁尾塞進 #site-header、#site-footer（每頁共用同一份，改這裡就好）
 * - 分類下拉選單、搜尋框、收藏／購物車數字
 * - 呼叫後端 API 的小工具：api()、money()、esc()…
 * - 語言切換、天氣（沿用組員 index.html 的寫法）
 * ===================================================================== */

// ---------- 小工具 ----------

/**
 * 呼叫後端 API，回傳解析好的 JSON。
 * 失敗時丟出 Error，message 是後端 ErrorResponse 的 message（例如「不能超過庫存數量」）。
 * 用法：const cart = await api('/api/cart');
 *       await api('/api/cart', { method: 'POST', body: { variantId: 1, qty: 1 } });
 */
async function api(path, options = {}) {
    const opt = { method: options.method || 'GET', headers: {} };
    if (options.body !== undefined) {
        opt.headers['Content-Type'] = 'application/json';
        opt.body = JSON.stringify(options.body);
    }
    const res = await fetch(path, opt);
    if (!res.ok) {
        let message = '連線發生問題（' + res.status + '），請稍後再試';
        try {
            const err = await res.json();
            if (err.message) message = err.message;
        } catch {}
        throw new Error(message);
    }
    const text = await res.text();          // 204 No Content 沒有內容
    return text ? JSON.parse(text) : null;
}

/** 990 → NT$990；12500 → NT$12,500 */
function money(n) {
    return 'NT$' + Number(n).toLocaleString('en-US');
}

/** 把資料放進 HTML 前先跳脫，避免商品名稱裡的 < > 弄壞版面 */
function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** 後端存的是相對路徑 img/products/...，前面補 / 讓每一頁都找得到 */
function imgSrc(url) {
    return url ? '/' + url.replace(/^\//, '') : '';
}

/** 網址參數：/products.html?category=all_men → param('category') 得到 'all_men' */
function param(name) {
    return new URLSearchParams(location.search).get(name);
}

/** 畫面下方跳出提示，幾秒後自動消失 */
function toast(message, isError = false) {
    let el = document.getElementById('toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'toast';
        el.className = 'toast';
        document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.toggle('error', isError);
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 2600);
}

const HEART_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';


// ---------- 收藏（追蹤清單） ----------

/** 已收藏的商品 slug；進頁面時載一次，按愛心時同步更新 */
const wishlistSlugs = new Set();

async function loadWishlistSlugs() {
    try {
        const list = await api('/api/wishlist');
        wishlistSlugs.clear();
        list.forEach(item => wishlistSlugs.add(item.slug));
    } catch {}
    return wishlistSlugs;
}

/** 愛心按鈕：已收藏就取消，沒收藏就加入；btn 是被按的按鈕，會切換 .on 樣式 */
async function toggleWishlist(slug, btn) {
    const adding = !wishlistSlugs.has(slug);
    try {
        await api('/api/wishlist/' + encodeURIComponent(slug), { method: adding ? 'POST' : 'DELETE' });
        adding ? wishlistSlugs.add(slug) : wishlistSlugs.delete(slug);
        if (btn) btn.classList.toggle('on', adding);
        toast(adding ? '已加入收藏' : '已從收藏移除');
        refreshCounts();
    } catch (e) {
        toast(e.message, true);
    }
    return adding;
}


// ---------- 商品卡片（商品列表、收藏頁共用） ----------

/**
 * p 需要：slug, name, price, imageUrl；可選：origPrice, newArrival, hot, onSale
 * onSale === false（已下架）時不連到商品頁
 */
function productCard(p) {
    const offSale = p.onSale === false;
    const onSaleNow = p.origPrice && p.origPrice > p.price;
    const tags = [
        p.newArrival ? '<span class="tag">NEW</span>' : '',
        p.hot ? '<span class="tag dark">HOT</span>' : '',
        offSale ? '<span class="tag dark">已下架</span>' : ''
    ].join('');
    const liked = wishlistSlugs.has(p.slug);
    const href = offSale ? '' : ` href="/product.html?slug=${encodeURIComponent(p.slug)}"`;
    return `
        <div class="card-wrap">
            <a class="card${offSale ? ' off-sale' : ''}"${href}>
                <div class="card-img">
                    ${p.imageUrl ? `<img src="${esc(imgSrc(p.imageUrl))}" alt="${esc(p.name)}" loading="lazy">` : ''}
                    <div class="card-tags">${tags}</div>
                </div>
                <div class="card-name">${esc(p.name)}</div>
                <div class="price${onSaleNow ? ' sale' : ''}">${money(p.price)}${onSaleNow ? `<del>${money(p.origPrice)}</del>` : ''}</div>
            </a>
            <button class="heart${liked ? ' on' : ''}" aria-label="收藏" data-slug="${esc(p.slug)}">${HEART_SVG}</button>
        </div>`;
}

/** 讓容器裡所有卡片上的愛心都能按（用事件委派，只要綁一次） */
function bindCardHearts(container, onChange) {
    container.addEventListener('click', async e => {
        const btn = e.target.closest('.heart[data-slug]');
        if (!btn) return;
        e.preventDefault();
        const added = await toggleWishlist(btn.dataset.slug, btn);
        if (onChange) onChange(btn.dataset.slug, added);
    });
}


// ---------- 頁首、頁尾 ----------

// 導覽列的三個分類，對應資料庫第 1 層分類的 code
const TOP_CATEGORIES = [
    { code: 'all_women', i18n: 'women', label: '女裝' },
    { code: 'all_men', i18n: 'men', label: '男裝' },
    { code: 'all_kids', i18n: 'kids', label: '兒童' }
];

function renderHeader() {
    const el = document.getElementById('site-header');
    if (!el) return;
    el.className = 'site-header';
    el.innerHTML = `
        <div class="announcement" data-i18n="announcement">全館滿 NT$2,500，享免運服務　·　新會員首購 95 折</div>
        <header class="topbar">
            <nav class="navlinks">
                ${TOP_CATEGORIES.map(c => `<button class="nav-trigger" data-code="${c.code}" data-i18n="${c.i18n}">${c.label}</button>`).join('')}
            </nav>
            <button class="icon-btn mobile-menu" aria-label="Menu" id="mobileMenuBtn">
                <svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
            </button>
            <a class="brand" href="/" aria-label="KINU 首頁"><img src="/img/logo.png" alt="KINU"></a>
            <div class="actions">
                <label class="header-search"><input id="headerSearch" type="search" placeholder="搜尋商品"></label>
                <div class="weather text-action" id="weather">台北 27°</div>
                <a class="text-action" href="/wishlist.html"><span data-i18n="favorites">收藏</span> <span class="text-count" id="wishlistCount">0</span></a>
                <a class="text-action" href="/cart.html"><span data-i18n="cart">購物車</span> <span class="text-count" id="cartCount">0</span></a>
                <button class="text-action" data-i18n="member" onclick="toast('會員功能即將推出')">會員</button>
                <div class="language-control">
                    <button class="language-toggle" aria-label="選擇語言" onclick="toggleLanguageMenu()">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>
                    </button>
                    <div class="language-menu" id="languageMenu">
                        <button onclick="setLanguage('zh-Hant')">中文</button>
                        <button onclick="setLanguage('en')">English</button>
                        <button onclick="setLanguage('ja')">日本語</button>
                        <button onclick="setLanguage('ko')">한국어</button>
                        <button onclick="setLanguage('ar')">العربية</button>
                        <button onclick="setLanguage('es')">Español</button>
                    </div>
                </div>
            </div>
        </header>
        <div class="mega" id="mega">
            <div class="mega-tabs" id="megaTabs"></div>
            <div class="mega-head">
                <div class="mega-title" id="megaTitle"></div>
                <a class="mega-all" id="megaAll" href="#">瀏覽全部　↗</a>
            </div>
            <div class="mega-grid" id="megaGrid"></div>
        </div>`;

    // 搜尋：按 Enter 跳到商品列表頁
    const search = document.getElementById('headerSearch');
    search.value = param('keyword') || '';
    search.addEventListener('keydown', e => {
        if (e.key === 'Enter' && search.value.trim()) {
            location.href = '/products.html?keyword=' + encodeURIComponent(search.value.trim());
        }
    });

    // 點女裝／男裝／兒童 → 展開分類選單；再點一次收起
    el.querySelectorAll('.nav-trigger').forEach(btn => {
        btn.addEventListener('click', () => toggleMega(btn.dataset.code));
    });
    document.getElementById('mobileMenuBtn').addEventListener('click', () => toggleMega(TOP_CATEGORIES[0].code));

    // 點選單外面就收起來
    document.addEventListener('click', e => {
        if (!el.contains(e.target)) {
            closeMega();
            document.getElementById('languageMenu').classList.remove('open');
        }
    });
}

function renderFooter() {
    const el = document.getElementById('site-footer');
    if (!el) return;
    el.outerHTML = `
        <footer class="footer">
            <div class="footer-top">
                <div>
                    <div class="footer-brand"><img src="/img/logo.png" alt="KINU"></div>
                    <div class="footer-note">EVERYDAY, BEAUTIFULLY.</div>
                </div>
                <div class="footer-links">
                    <a href="#">配送與退貨</a>
                    <a href="#">常見問題</a>
                    <a href="#">聯絡我們</a>
                    <a href="#">Instagram ↗</a>
                </div>
            </div>
            <div class="copyright"><span>© 2026 KINU STUDIO. ALL RIGHTS RESERVED.</span><span>MADE WITH CARE, IN TAIPEI.</span></div>
        </footer>`;
}


// ---------- 分類下拉選單 ----------

let menuPromise = null;     // /api/categories 只抓一次
let megaOpenCode = null;

function loadMenu() {
    if (!menuPromise) menuPromise = api('/api/categories').catch(() => []);
    return menuPromise;
}

async function toggleMega(code) {
    if (megaOpenCode === code) return closeMega();
    megaOpenCode = code;

    const menu = await loadMenu();
    const top = menu.find(c => c.code === code);
    const mega = document.getElementById('mega');

    document.querySelectorAll('.nav-trigger').forEach(b => b.classList.toggle('active', b.dataset.code === code));
    // 手機版沒有導覽列，改在選單上方放分頁切換
    document.getElementById('megaTabs').innerHTML = TOP_CATEGORIES.map(c =>
        `<button class="${c.code === code ? 'active' : ''}" onclick="event.stopPropagation(); megaOpenCode=null; toggleMega('${c.code}')">${esc((menu.find(m => m.code === c.code) || c).name || c.label)}</button>`
    ).join('');

    if (!top) {
        document.getElementById('megaTitle').textContent = '';
        document.getElementById('megaGrid').innerHTML = '<div class="state" style="grid-column:1/-1;padding:20px 0">目前無法載入分類</div>';
    } else {
        document.getElementById('megaTitle').textContent = top.name;
        document.getElementById('megaAll').href = '/products.html?category=' + encodeURIComponent(top.code);
        document.getElementById('megaGrid').innerHTML = top.children.map(c => `
            <a class="mega-item" href="/products.html?category=${encodeURIComponent(c.code)}">
                <div class="thumb">${c.iconUrl ? `<img src="${esc(imgSrc(c.iconUrl))}" alt="">` : ''}</div>
                <span>${esc(c.name)}</span>
            </a>`).join('');
    }
    mega.classList.add('open');
}

function closeMega() {
    megaOpenCode = null;
    const mega = document.getElementById('mega');
    if (mega) mega.classList.remove('open');
    document.querySelectorAll('.nav-trigger').forEach(b => b.classList.remove('active'));
}


// ---------- 收藏、購物車數字 ----------

async function refreshCounts() {
    try {
        const [cart, wishlist] = await Promise.all([api('/api/cart'), api('/api/wishlist')]);
        document.getElementById('cartCount').textContent = cart.reduce((sum, item) => sum + item.qty, 0);
        document.getElementById('wishlistCount').textContent = wishlist.length;
    } catch {}
}


// ---------- 天氣（沿用組員的寫法） ----------

// 向 Open-Meteo 取得台北目前氣溫（座標固定為台北），失敗時維持預設的 27°
async function loadWeather() {
    const el = document.getElementById('weather');
    if (!el) return;
    try {
        const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=25.033&longitude=121.5654&current=temperature_2m,weather_code&timezone=Asia%2FTaipei');
        const j = await r.json();
        el.textContent = `台北 ${Math.round(j.current.temperature_2m)}°`;
    } catch {}
}


// ---------- 多國語言（沿用組員的字典；只翻介面文字，商品資料維持中文） ----------

const zh = { announcement: '全館滿 NT$2,500，享免運服務　·　新會員首購 95 折', women: '女裝', men: '男裝', collection: '系列選品', about: 'KINU 的日常', heroeyebrow: 'THE ART OF EVERYDAY', heroTitle: '日常，恰好的美。', heroText: '留一點餘白，給生活更多可能。以柔軟質地，陪你走過每一個日常。', shopnow: '探索本季新品', categoryTitle: '從日常開始', viewall: '瀏覽全部　↗', life: '生活選品', newTitle: '為換季準備的衣櫥', storyTitle: '穿得舒服，日子就慢了下來。', storyText: 'KINU，取自日文「絹」的柔和意象。我們相信，好的衣服不必喧嘩，只要貼近日常、經得起時間，讓每一個平凡日子，都多一點自在。', newsTitle: '寫一封信，聊聊日常。', newsText: '訂閱 KINU 電子報，搶先收到新品消息與會員專屬禮遇。' };
const ja = { announcement: '¥15,000以上のお買い上げで送料無料　·　新規会員 初回5%OFF', women: 'ウィメンズ', men: 'メンズ', collection: 'コレクション', about: 'KINUの日常', heroeyebrow: 'THE ART OF EVERYDAY', heroTitle: '日々に、ちょうどいい美しさ。', heroText: '余白のある暮らしに、やわらかな質感を。毎日のそばに寄り添う服。', shopnow: '新作を見る', categoryTitle: '日常からはじめよう', viewall: 'すべて見る　↗', life: 'ライフスタイル', newTitle: '季節をつなぐワードローブ', storyTitle: '心地よい服で、日々に余白を。', storyText: 'KINUは日本語の「絹」から生まれた名前です。毎日に寄り添い、時を重ねても心地よい服をお届けします。', newsTitle: 'KINUから、日々のお便り。', newsText: 'ニュースレターに登録して、新作と会員限定のお知らせを受け取りましょう。' };

// 多國語言：依 data-i18n 的 key 替換文字
function setLanguageBase(locale) {
    const dictionaries = {
        'zh-Hant': zh,
        en: { announcement: 'Free shipping over NT$2,500 · 5% off your first order', women: 'WOMEN', men: 'MEN', kids: 'KIDS', search: 'Search', favorites: 'Wishlist', cart: 'Cart', member: 'Account', heroTitle: 'Everyday, beautifully.', heroText: 'Room to breathe. Soft textures to accompany you, every day.', shopnow: 'Explore the new collection', categoryTitle: 'Made for everyday', viewall: 'VIEW ALL　↗', life: 'LIFESTYLE', newTitle: 'A wardrobe for the new season', storyTitle: 'Feel good in what you wear.', newsTitle: 'A little note from KINU.', newsText: 'Sign up for new arrivals and members-only offers.' },
        ja,
        ko: { announcement: '₩100,000 이상 무료 배송 · 신규 회원 첫 구매 혜택', women: '여성', men: '남성', kids: '키즈', search: '검색', favorites: '위시리스트', cart: '장바구니', member: '회원', heroTitle: '일상에, 꼭 맞는 아름다움.', heroText: '여유로운 일상에 부드러운 감촉을 더합니다.', shopnow: '신상품 보기', categoryTitle: '일상에서 시작해요', viewall: '모두 보기　↗', life: '라이프스타일', newTitle: '새 계절을 위한 옷장', storyTitle: '편안한 옷과 여유로운 하루.', newsTitle: 'KINU의 일상 편지.', newsText: '신상품과 회원 전용 소식을 받아보세요.' },
        ar: { announcement: 'شحن مجاني للطلبات المؤهلة · خصم 5٪ للأعضاء الجدد', women: 'نسائي', men: 'رجالي', kids: 'أطفال', search: 'بحث', favorites: 'المفضلة', cart: 'السلة', member: 'حسابي', heroTitle: 'جمال يرافق يومك.', heroText: 'مساحة للحياة، وملمس ناعم يرافق كل يوم.', shopnow: 'اكتشف المجموعة الجديدة', categoryTitle: 'ابدأ من يومك', viewall: 'عرض الكل　↗', life: 'أسلوب الحياة', newTitle: 'خزانة للموسم الجديد', storyTitle: 'ملابس مريحة لأيام أهدأ.', newsTitle: 'رسالة يومية من KINU.', newsText: 'اشترك لتصلك المنتجات الجديدة وعروض الأعضاء.' },
        es: { announcement: 'Envío gratis desde NT$2.500 · 5% de descuento en tu primera compra', women: 'MUJER', men: 'HOMBRE', kids: 'NIÑOS', search: 'Buscar', favorites: 'Favoritos', cart: 'Bolsa', member: 'Cuenta', heroTitle: 'Belleza para cada día.', heroText: 'Un poco de calma y texturas suaves para acompañarte cada día.', shopnow: 'Descubre la nueva colección', categoryTitle: 'Empieza por lo cotidiano', viewall: 'VER TODO　↗', life: 'ESTILO DE VIDA', newTitle: 'Un armario para la nueva temporada', storyTitle: 'Vístete cómodo. Vive más despacio.', newsTitle: 'Una nota de KINU.', newsText: 'Novedades y ventajas exclusivas para miembros.' }
    };
    const dict = dictionaries[locale] || zh;
    document.documentElement.lang = locale;
    document.querySelectorAll('[data-i18n]').forEach(e => {
        const val = dict[e.dataset.i18n];
        if (val) e.textContent = val;
    });
}

// 語言選單
function toggleLanguageMenu() {
    document.getElementById('languageMenu').classList.toggle('open');
}

function setLanguage(locale) {
    const labels = {
        'zh-Hant': ['女裝', '男裝', '兒童', '搜尋', '收藏', '購物車', '會員'],
        en: ['WOMEN', 'MEN', 'KIDS', 'Search', 'Wishlist', 'Cart', 'Account'],
        ja: ['ウィメンズ', 'メンズ', 'キッズ', '検索', 'お気に入り', 'カート', '会員'],
        ko: ['여성', '남성', '키즈', '검색', '위시리스트', '장바구니', '회원'],
        ar: ['نسائي', 'رجالي', 'أطفال', 'بحث', 'المفضلة', 'السلة', 'حسابي'],
        es: ['MUJER', 'HOMBRE', 'NIÑOS', 'Buscar', 'Favoritos', 'Bolsa', 'Cuenta']
    }[locale] || ['女裝', '男裝', '兒童', '搜尋', '收藏', '購物車', '會員'];
    setLanguageBase(locale);
    document.getElementById('languageMenu').classList.remove('open');
    const keys = ['women', 'men', 'kids', 'search', 'favorites', 'cart', 'member'];
    keys.forEach((key, i) => document.querySelectorAll(`[data-i18n="${key}"]`).forEach(el => el.textContent = labels[i]));
    document.getElementById('headerSearch').placeholder = ({ en: 'Search items', ja: '商品を検索', ko: '상품 검색', ar: 'ابحث عن منتج', es: 'Buscar productos' })[locale] || '搜尋商品';
    // 記住選擇，換頁後維持同一個語言（瀏覽器不允許時就算了）
    try { localStorage.setItem('kinu-lang', locale); } catch {}
}


// ---------- 啟動 ----------

renderHeader();
renderFooter();
loadWeather();
refreshCounts();
try {
    const saved = localStorage.getItem('kinu-lang');
    if (saved && saved !== 'zh-Hant') setLanguage(saved);
} catch {}
