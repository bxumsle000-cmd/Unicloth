package com.EEIT25.unicloth.seed;

import com.EEIT25.unicloth.enums.order.OrderStatus;
import com.EEIT25.unicloth.enums.order.PaymentMethod;
import com.EEIT25.unicloth.enums.order.ShippingMethod;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;

/**
 * 啟動時塞一批展示用的假資料，讓後台每個部門的頁面都有東西看：
 * <ul>
 *   <li>30 位會員（不同消費習慣），和他們從今天往前 15 個月的訂單、付款紀錄</li>
 *   <li>折價券：多幾種券、預約發送紀錄、生日禮，會員領到和用掉的券</li>
 *   <li>會員現在的追蹤清單、購物車</li>
 *   <li>客服單：已解決、已回覆、還沒回覆</li>
 *   <li>商品部的入庫紀錄</li>
 * </ul>
 *
 * 只有 application.properties 設 app.seed.demo-data=true 時這個 class 才會被建立。
 * 假會員的 email 都是 demoXX@demo.unicloth.com；資料庫裡已經有這種會員就整個跳過，所以只會塞一次。
 *
 * - 日期以「第一次塞資料的那天」往前算 15 個月；想用今天重新產生，先跑 data/demo_data_delete.sql，再重開 Spring Boot。
 * - 亂數用固定種子，每個人塞出來的會員和購買習慣都一樣（只有日期跟著塞資料那天走）。
 * - 假訂單、入庫紀錄都不改庫存（當作是以前的事）；也不產生未付款（UNPAID）的訂單，免得被 OrderTimeoutScheduler 取消時把庫存加回去。
 * - 假會員沒有 firebase_uid，不能登入前台，只是用來看後台。
 * - 有一筆「等待中」的預約發券（4 天後），時間到了 CouponSendScheduler 會真的發出去。
 */
@Slf4j
@Component
@Order(2)   // 要等 DataSeeder（@Order(1)）把商品匯完才能下單
@ConditionalOnProperty(name = "app.seed.demo-data", havingValue = "true")
@RequiredArgsConstructor
public class DemoDataSeeder implements CommandLineRunner {

    private static final String EMAIL_DOMAIN = "@demo.unicloth.com";
    private static final int MONTHS = 15;
    // 跟 CheckoutService 一樣
    private static final int FREE_SHIPPING_THRESHOLD = 2500;
    private static final int SHIPPING_FEE = 50;

    // 每個月下單的頻率倍數：雙 11、年底、過年、年中慶比較多，2 月和夏天比較少（index 0 = 1 月）
    private static final double[] SEASON_FACTOR = {1.2, 0.8, 0.9, 0.9, 1.0, 1.2, 0.9, 0.9, 1.0, 1.1, 1.6, 1.3};

    // 下單時間比較常在午休和晚上；陣列裡出現越多次的小時越容易被抽到
    private static final int[] ORDER_HOURS = {9, 10, 11, 12, 12, 13, 13, 14, 15, 16, 17, 18, 19, 20, 20, 21, 21, 21, 22, 22, 23};

    private static final List<String> NOTE_LIST = List.of("請於平日白天送達", "請放管理室", "送禮用，請不要附發票", "到了請先打電話");
    private static final List<String> CVS_STORE_LIST = List.of(
            "7-ELEVEN 忠孝門市", "7-ELEVEN 府中門市", "7-ELEVEN 文心門市", "7-ELEVEN 中正門市",
            "全家 板橋文化店", "全家 竹北光明店", "全家 台南成大店", "全家 高雄巨蛋店");
    private static final List<String> ROAD_LIST = List.of("中山路", "中正路", "民生路", "復興路", "建國路", "光明路", "文化路", "和平路");

    // 入庫單的備註；data/demo_data_delete.sql 用這些備註找出示範的入庫單，改這裡要一起改
    private static final List<String> RECEIVE_NOTE_LIST = List.of("新品到貨", "熱銷商品補貨", "廠商週期補貨", "季節商品備貨");

    /** 示範用的折價券，code 已經存在就不重複建；只有折金額（AMOUNT）和打折（PERCENT）兩種 */
    private record CouponSeed(String code, String title, String type, int value, int minSubtotal, int validDays,
                              String autoTrigger, boolean active) {
    }

    private static final List<CouponSeed> COUPON_SEED_LIST = List.of(
            new CouponSeed("BDAY200", "生日禮金", "AMOUNT", 200, 1000, 30, "BIRTHDAY", true),
            new CouponSeed("DOUBLE11", "雙11購物節", "PERCENT", 15, 2000, 14, null, true),
            new CouponSeed("SUMMER150", "夏季購物金", "AMOUNT", 150, 1200, 21, null, true),
            new CouponSeed("VIP300", "VIP 專屬禮", "AMOUNT", 300, 3000, 30, null, true),
            // 停用中的券：拿來做一筆「未發送」的預約
            new CouponSeed("SPRING12", "春季限定", "PERCENT", 12, 1500, 14, null, false)
    );

    // 會員想用券、手上卻沒有能用的券時，當場發一張這兩種（V1 就有的券）
    private static final List<String> FALLBACK_COUPON_CODE_LIST = List.of("WELCOME100", "SAVE10");

    /** 客服單的問題類型（跟 CreateSupportTicketRequest 一樣）和權重；needOrder = 內容會提到訂單編號 */
    private record TicketTopic(String name, int weight, boolean needOrder, List<String[]> templateList) {
    }

    // templateList 每一筆是 {會員的問題, 客服的回覆}；{order} 換成訂單編號、{product} 換成商品名稱
    private static final List<TicketTopic> TICKET_TOPIC_LIST = List.of(
            new TicketTopic("訂單與物流", 30, true, List.of(
                    new String[]{"訂單 {order} 已經下單好幾天了，請問什麼時候會出貨？",
                            "您好，訂單 {order} 已安排出貨，物流追蹤碼已更新在訂單頁面，預計 1～2 天內送達，謝謝您的耐心等候。"},
                    new String[]{"我的訂單 {order} 顯示已出貨，但物流網站查不到資料，可以幫我確認嗎？",
                            "您好，物流商的系統會有半天左右的延遲，我們已向物流商確認包裹正在配送中，造成不便敬請見諒。"},
                    new String[]{"請問訂單 {order} 可以改成超商取貨嗎？",
                            "您好，訂單出貨前可以協助修改，已幫您改為超商取貨，門市資訊請再到訂單頁面確認。"})),
            new TicketTopic("退換貨", 20, true, List.of(
                    new String[]{"{product} 尺寸買太小了，想換大一號，請問要怎麼處理？（訂單 {order}）",
                            "您好，商品收到 7 天內、吊牌完整即可換貨，請將商品寄回並附上訂單編號，我們收到後會盡快寄出新尺寸。"},
                    new String[]{"收到的 {product} 顏色跟網站上看起來差很多，可以退貨嗎？（訂單 {order}）",
                            "您好，螢幕顯示可能會有色差，造成困擾很抱歉。已為您建立退貨申請，物流人員會在 2～3 天內到府收件。"})),
            new TicketTopic("商品諮詢", 15, false, List.of(
                    new String[]{"{product} 會再補貨嗎？我要的尺寸一直缺貨。",
                            "您好，這款商品預計下個月補貨，可以先將商品加入追蹤，補貨後就能第一時間看到。"},
                    new String[]{"請問 {product} 會不會起毛球？洗滌要注意什麼？",
                            "您好，建議翻面以冷水手洗或放洗衣袋輕柔洗，避免烘乾，可以減少起毛球的情況。"})),
            new TicketTopic("付款與發票", 10, true, List.of(
                    new String[]{"訂單 {order} 付款之後還是顯示未付款，請幫我確認。",
                            "您好，付款結果需要等金流回傳，最晚約 1 小時會更新，目前已確認入帳，訂單已進入處理流程。"},
                    new String[]{"請問訂單 {order} 可以補開統一編號嗎？",
                            "您好，已協助補登統一編號，電子發票會寄到您的信箱。"})),
            new TicketTopic("折價券與活動", 10, false, List.of(
                    new String[]{"結帳時折價券一直無法使用，顯示未達最低消費，可是我的金額有超過。",
                            "您好，最低消費是以商品小計計算，不含運費。若小計已達門檻仍無法使用，請提供畫面截圖讓我們協助確認。"},
                    new String[]{"請問雙11的折價券可以和其他券一起用嗎？",
                            "您好，每筆訂單限用一張折價券，結帳時可以選擇折扣最多的那一張。"})),
            new TicketTopic("會員帳號問題", 8, false, List.of(
                    new String[]{"我想更改會員資料裡的手機號碼，要在哪裡修改？",
                            "您好，登入後到「會員資料」頁面即可修改手機與地址。"},
                    new String[]{"用 Google 登入後看不到以前的訂單，是不是帳號跑掉了？",
                            "您好，已幫您確認，以前的訂單綁在同一個 email 的帳號下，重新登入後即可看到。"})),
            new TicketTopic("其他", 7, false, List.of(
                    new String[]{"請問有實體門市可以試穿嗎？",
                            "您好，目前只有網路商店，商品頁有尺寸表可以參考，收到後不合身也可以申請換貨。"},
                    new String[]{"希望可以多一些大尺碼的款式。",
                            "您好，謝謝您的建議，我們已轉給商品部門參考。"}))
    );

    /** 會員的消費類型：平均幾天買一次、每張訂單幾件、偏好的價位（1 = 偏貴、0 = 不挑、-1 = 偏便宜）、想用折價券的機率 */
    @RequiredArgsConstructor
    private enum Segment {
        VIP("高消費常客", 9, 2, 5, 1, 0.25),
        REGULAR("穩定回購", 22, 1, 3, 0, 0.3),
        BARGAIN("愛用折價券", 35, 1, 3, -1, 0.85),
        OCCASIONAL("偶爾購買", 70, 1, 2, 0, 0.2),
        CHURNED("流失會員", 25, 1, 3, 0, 0.3),
        NEW("新會員", 20, 1, 3, 0, 0.5);

        private final String label;
        private final int avgDays;
        private final int minItems;
        private final int maxItems;
        private final int priceBias;
        private final double couponRate;
    }

    /** topCode：最常買哪個性別的商品（all_women / all_men / all_kids）；payment、shipping：最常用的付款、配送方式 */
    private record DemoMember(String name, String gender, LocalDate birthday, String city, String topCode,
                              Segment segment, PaymentMethod payment, ShippingMethod shipping) {
    }

    private static final List<DemoMember> MEMBER_LIST = List.of(
            new DemoMember("林雅婷", "female", LocalDate.of(1988, 3, 14), "台北市", "all_women", Segment.VIP, PaymentMethod.CREDIT, ShippingMethod.HOME),
            new DemoMember("陳柏翰", "male", LocalDate.of(1985, 11, 2), "新竹市", "all_men", Segment.VIP, PaymentMethod.CREDIT, ShippingMethod.HOME),
            new DemoMember("黃淑芬", "female", LocalDate.of(1979, 6, 21), "台中市", "all_kids", Segment.VIP, PaymentMethod.CREDIT, ShippingMethod.HOME),
            new DemoMember("張家豪", "male", LocalDate.of(1992, 1, 30), "新北市", "all_men", Segment.REGULAR, PaymentMethod.CREDIT, ShippingMethod.CVS),
            new DemoMember("李佳穎", "female", LocalDate.of(1995, 8, 9), "台北市", "all_women", Segment.REGULAR, PaymentMethod.CREDIT, ShippingMethod.HOME),
            new DemoMember("王怡君", "female", LocalDate.of(1990, 12, 17), "桃園市", "all_women", Segment.REGULAR, PaymentMethod.ATM, ShippingMethod.HOME),
            new DemoMember("吳宗翰", "male", LocalDate.of(1987, 4, 5), "高雄市", "all_men", Segment.REGULAR, PaymentMethod.CREDIT, ShippingMethod.HOME),
            new DemoMember("劉思妤", "female", LocalDate.of(1998, 10, 23), "台南市", "all_women", Segment.REGULAR, PaymentMethod.CREDIT, ShippingMethod.CVS),
            new DemoMember("蔡明哲", "male", LocalDate.of(1983, 2, 11), "台中市", "all_kids", Segment.REGULAR, PaymentMethod.CREDIT, ShippingMethod.HOME),
            new DemoMember("楊雅筑", "female", LocalDate.of(1993, 7, 28), "新北市", "all_women", Segment.REGULAR, PaymentMethod.COD, ShippingMethod.CVS),
            new DemoMember("許志明", "male", LocalDate.of(1976, 9, 15), "台北市", "all_men", Segment.REGULAR, PaymentMethod.ATM, ShippingMethod.HOME),
            new DemoMember("鄭宜蓁", "female", LocalDate.of(2000, 5, 2), "新北市", "all_women", Segment.BARGAIN, PaymentMethod.COD, ShippingMethod.CVS),
            new DemoMember("謝承恩", "male", LocalDate.of(2002, 3, 19), "桃園市", "all_men", Segment.BARGAIN, PaymentMethod.COD, ShippingMethod.CVS),
            new DemoMember("郭美玲", "female", LocalDate.of(1984, 11, 27), "彰化縣", "all_kids", Segment.BARGAIN, PaymentMethod.COD, ShippingMethod.CVS),
            new DemoMember("洪詩涵", "female", LocalDate.of(2001, 1, 8), "台中市", "all_women", Segment.BARGAIN, PaymentMethod.CREDIT, ShippingMethod.CVS),
            new DemoMember("曾俊傑", "male", LocalDate.of(1997, 6, 30), "高雄市", "all_men", Segment.BARGAIN, PaymentMethod.ATM, ShippingMethod.CVS),
            new DemoMember("邱靜怡", "female", LocalDate.of(1972, 8, 12), "嘉義市", "all_women", Segment.OCCASIONAL, PaymentMethod.ATM, ShippingMethod.HOME),
            new DemoMember("廖家銘", "male", LocalDate.of(1968, 12, 3), "台南市", "all_men", Segment.OCCASIONAL, PaymentMethod.COD, ShippingMethod.HOME),
            new DemoMember("賴姿穎", "female", LocalDate.of(1996, 4, 16), "新竹縣", "all_women", Segment.OCCASIONAL, PaymentMethod.CREDIT, ShippingMethod.CVS),
            new DemoMember("周建宏", "male", LocalDate.of(1981, 10, 7), "基隆市", "all_men", Segment.OCCASIONAL, PaymentMethod.CREDIT, ShippingMethod.HOME),
            new DemoMember("徐珮瑜", "female", LocalDate.of(1989, 2, 25), "宜蘭縣", "all_kids", Segment.OCCASIONAL, PaymentMethod.ATM, ShippingMethod.HOME),
            new DemoMember("蘇冠宇", "male", LocalDate.of(2003, 7, 14), "台北市", "all_men", Segment.OCCASIONAL, PaymentMethod.CREDIT, ShippingMethod.CVS),
            new DemoMember("葉欣怡", "female", LocalDate.of(1991, 9, 1), "新北市", "all_women", Segment.CHURNED, PaymentMethod.CREDIT, ShippingMethod.HOME),
            new DemoMember("呂育誠", "male", LocalDate.of(1986, 5, 20), "台中市", "all_men", Segment.CHURNED, PaymentMethod.ATM, ShippingMethod.HOME),
            new DemoMember("莊雅雯", "female", LocalDate.of(1994, 3, 3), "高雄市", "all_women", Segment.CHURNED, PaymentMethod.COD, ShippingMethod.CVS),
            new DemoMember("江俊宏", "male", LocalDate.of(1978, 11, 11), "桃園市", "all_kids", Segment.CHURNED, PaymentMethod.CREDIT, ShippingMethod.HOME),
            new DemoMember("何宜庭", "female", LocalDate.of(2004, 2, 14), "台北市", "all_women", Segment.NEW, PaymentMethod.CREDIT, ShippingMethod.CVS),
            new DemoMember("羅子軒", "male", LocalDate.of(1999, 12, 24), "新北市", "all_men", Segment.NEW, PaymentMethod.CREDIT, ShippingMethod.HOME),
            new DemoMember("高郁婷", "female", LocalDate.of(1997, 9, 9), "台中市", "all_women", Segment.NEW, PaymentMethod.COD, ShippingMethod.CVS),
            new DemoMember("潘信宏", "male", LocalDate.of(1990, 6, 6), "台南市", "all_men", Segment.NEW, PaymentMethod.ATM, ShippingMethod.HOME)
    );

    private record VariantOption(long id, String color, String size, String skuCode, String url) {
    }

    private record ProductOption(long id, String name, int price, List<VariantOption> variantList) {
    }

    private record OrderLine(ProductOption product, VariantOption variant, int qty) {
    }

    private record CouponInfo(long id, String code, String type, int value, int minSubtotal, int validDays) {
    }

    /** 客服單提到訂單時要用的資料 */
    private record OrderRef(String orderNo, LocalDateTime createdAt, String productName) {
    }

    /** 會員手上的一張券；used 會在下單時改掉，所以不用 record */
    private static class HeldCoupon {
        private final long id;
        private final CouponInfo coupon;
        private final LocalDateTime receivedAt;
        private final LocalDateTime expireAt;
        private boolean used;

        private HeldCoupon(long id, CouponInfo coupon, LocalDateTime receivedAt) {
            this.id = id;
            this.coupon = coupon;
            this.receivedAt = receivedAt;
            this.expireAt = receivedAt.plusDays(coupon.validDays());
        }
    }

    /** 產生資料的過程中要記住的會員資料 */
    private static class MemberState {
        private final DemoMember demo;
        private long id;
        private String email;
        private String phone;
        private String address;
        private LocalDateTime registeredAt;
        private LocalDateTime activeUntil;
        private final List<HeldCoupon> heldCouponList = new ArrayList<>();
        private final List<OrderRef> orderList = new ArrayList<>();

        private MemberState(DemoMember demo) {
            this.demo = demo;
        }
    }

    private final JdbcTemplate jdbcTemplate;
    // 固定種子：每次塞出來的資料都一樣
    private final Random random = new Random(20261028);

    private LocalDateTime now;
    private LocalDateTime start;
    // 性別（all_women）→ 大類（all_women-outer）→ 這個大類的商品，依價格由低到高排
    private Map<String, Map<String, List<ProductOption>>> catalog;
    private Map<String, CouponInfo> couponMap;
    private List<MemberState> memberList;
    private Set<String> orderNoSet;
    private Set<String> ticketNoSet;

    @Override
    @Transactional   // 整批一起成功或一起失敗，不會塞到一半
    public void run(String... args) {
        Integer demoCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM members WHERE email LIKE ?", Integer.class, "%" + EMAIL_DOMAIN);
        if (demoCount != null && demoCount > 0) {
            log.info("[seed] 已經有示範假資料（{} 位假會員），跳過", demoCount);
            return;
        }

        now = LocalDateTime.now().withNano(0);
        start = now.minusMonths(MONTHS);
        catalog = loadCatalog();
        if (catalog.isEmpty()) {
            log.warn("[seed] 資料庫沒有上架中的商品，無法產生示範假資料（app.seed.products 要設 true）");
            return;
        }
        Long productStaffId = findStaffId("PRODUCT");
        Long mktStaffId = findStaffId("MKT");
        if (productStaffId == null || mktStaffId == null) {
            log.warn("[seed] 找不到商品部或行銷部的員工（V1 migration 會建），無法產生示範假資料");
            return;
        }
        couponMap = seedCoupons();
        orderNoSet = new HashSet<>(jdbcTemplate.queryForList("SELECT order_no FROM orders", String.class));
        ticketNoSet = new HashSet<>(jdbcTemplate.queryForList("SELECT ticket_no FROM support_tickets", String.class));

        // 1. 會員
        memberList = new ArrayList<>();
        for (int i = 0; i < MEMBER_LIST.size(); i++) {
            memberList.add(seedMember(i + 1, MEMBER_LIST.get(i)));
        }

        // 2. 先發券（預約發送、生日禮、零星手動發），下單時才知道會員手上有哪些券可以用
        int scheduleCount = seedCouponSchedules(mktStaffId);
        for (MemberState member : memberList) {
            seedBirthdayCoupons(member);
            seedManualCoupons(member);
        }

        // 3. 訂單
        int orderCount = 0;
        for (MemberState member : memberList) {
            orderCount += seedOrders(member);
        }

        // 4. 現在的追蹤清單、購物車
        int wishlistCount = 0;
        int cartCount = 0;
        for (MemberState member : memberList) {
            wishlistCount += seedWishlist(member);
            cartCount += seedCart(member);
        }

        // 5. 客服單、入庫紀錄
        int ticketCount = seedSupportTickets();
        int receiveCount = seedInventoryReceives(productStaffId);

        log.info("[seed] 示範假資料完成（{} ～ {}）：會員 {} 位、訂單 {} 張、預約發券 {} 筆、追蹤 {} 筆、購物車 {} 筆、客服單 {} 張、入庫單 {} 張",
                start.toLocalDate(), now.toLocalDate(), memberList.size(), orderCount, scheduleCount,
                wishlistCount, cartCount, ticketCount, receiveCount);
    }

    // ==================== 準備資料 ====================

    /** 讀出上架中的商品和 SKU，依「性別 → 大類」分好 */
    private Map<String, Map<String, List<ProductOption>>> loadCatalog() {
        // 分類是一棵樹（男裝 → 外套類 → …），先讀進來，之後從商品的分類往上找
        Map<Long, Long> parentIdMap = new HashMap<>();
        Map<Long, String> codeMap = new HashMap<>();
        jdbcTemplate.query("SELECT id, parent_id, code FROM categories", (RowCallbackHandler) rs -> {
            parentIdMap.put(rs.getLong("id"), rs.getObject("parent_id", Long.class));
            codeMap.put(rs.getLong("id"), rs.getString("code"));
        });

        // 同一件商品的 SKU 收在一起；ORDER BY 固定順序，亂數抽出來的結果才會每次一樣
        Map<Long, ProductOption> productMap = new LinkedHashMap<>();
        Map<Long, Long> productCategoryMap = new HashMap<>();
        jdbcTemplate.query("""
                SELECT v.id, v.color, v.size, v.sku_code, v.url, p.id AS product_id, p.name, p.price, p.category_id
                FROM product_variants v
                JOIN products p ON p.id = v.product_id
                WHERE p.status = 'ON_SALE'
                ORDER BY p.id, v.id
                """, (RowCallbackHandler) rs -> {
            long productId = rs.getLong("product_id");
            String name = rs.getString("name");
            int price = rs.getInt("price");
            ProductOption product = productMap.computeIfAbsent(productId,
                    id -> new ProductOption(id, name, price, new ArrayList<>()));
            product.variantList().add(new VariantOption(rs.getLong("id"), rs.getString("color"),
                    rs.getString("size"), rs.getString("sku_code"), rs.getString("url")));
            productCategoryMap.put(productId, rs.getLong("category_id"));
        });

        Map<String, Map<String, List<ProductOption>>> result = new HashMap<>();
        for (Map.Entry<Long, ProductOption> entry : productMap.entrySet()) {
            // 從商品的分類一路往上走到最上層：最後一個是性別，倒數第二個是大類
            List<String> pathList = new ArrayList<>();
            Long categoryId = productCategoryMap.get(entry.getKey());
            while (categoryId != null) {
                pathList.add(codeMap.get(categoryId));
                categoryId = parentIdMap.get(categoryId);
            }
            String topCode = pathList.get(pathList.size() - 1);
            String bigCode = pathList.size() >= 2 ? pathList.get(pathList.size() - 2) : topCode;
            result.computeIfAbsent(topCode, code -> new HashMap<>())
                    .computeIfAbsent(bigCode, code -> new ArrayList<>())
                    .add(entry.getValue());
        }
        for (Map<String, List<ProductOption>> bigMap : result.values()) {
            for (List<ProductOption> productList : bigMap.values()) {
                productList.sort((a, b) -> Integer.compare(a.price(), b.price()));
            }
        }
        return result;
    }

    /** 找某個部門 id 最小的員工（V1 migration 建的測試員），沒有回傳 null */
    private Long findStaffId(String department) {
        List<Long> idList = jdbcTemplate.queryForList(
                "SELECT TOP 1 id FROM staff WHERE department = ? ORDER BY id", Long.class, department);
        return idList.isEmpty() ? null : idList.get(0);
    }

    /** 建示範用的折價券（已經有同樣 code 的就跳過），回傳 code → 券的資料（包含原本就有的券） */
    private Map<String, CouponInfo> seedCoupons() {
        for (CouponSeed seed : COUPON_SEED_LIST) {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM coupons WHERE code = ?", Integer.class, seed.code());
            if (count != null && count > 0) {
                continue;
            }
            jdbcTemplate.update("""
                    INSERT INTO coupons (code, title, type, value, min_subtotal, valid_days, auto_trigger, is_active, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, seed.code(), seed.title(), seed.type(), seed.value(), seed.minSubtotal(), seed.validDays(),
                    seed.autoTrigger(), seed.active(), start.minusDays(7));
        }
        Map<String, CouponInfo> result = new HashMap<>();
        jdbcTemplate.query("SELECT id, code, type, value, min_subtotal, valid_days FROM coupons", (RowCallbackHandler) rs ->
                result.put(rs.getString("code"), new CouponInfo(rs.getLong("id"), rs.getString("code"),
                        rs.getString("type"), rs.getInt("value"), rs.getInt("min_subtotal"), rs.getInt("valid_days"))));
        return result;
    }

    // ==================== 會員、發券 ====================

    /** 建一位會員（帳號 + 個人資料），決定他什麼時候註冊、買到什麼時候 */
    private MemberState seedMember(int no, DemoMember demo) {
        MemberState member = new MemberState(demo);
        member.activeUntil = now;
        switch (demo.segment()) {
            // 新會員：最近 20～75 天才註冊
            case NEW -> member.registeredAt = now.minusDays(20 + random.nextInt(56));
            // 流失會員：一開始就在，6～9 個月前之後就沒再買
            case CHURNED -> {
                member.registeredAt = start.plusDays(random.nextInt(30));
                member.activeUntil = now.minusDays(180 + random.nextInt(91));
            }
            default -> member.registeredAt = start.plusDays(random.nextInt(60));
        }
        member.registeredAt = member.registeredAt
                .withHour(9 + random.nextInt(14)).withMinute(random.nextInt(60)).withSecond(random.nextInt(60));
        if (member.registeredAt.isAfter(now)) {
            member.registeredAt = now.minusHours(1);
        }

        member.email = String.format("demo%02d%s", no, EMAIL_DOMAIN);
        member.phone = "09" + String.format("%08d", random.nextInt(100_000_000));
        member.address = demo.city() + ROAD_LIST.get(random.nextInt(ROAD_LIST.size()))
                + (1 + random.nextInt(300)) + "號" + (2 + random.nextInt(12)) + "樓";
        member.id = jdbcTemplate.queryForObject(
                "INSERT INTO members (email, status, created_at) OUTPUT INSERTED.id VALUES (?, 'ACTIVE', ?)",
                Long.class, member.email, member.registeredAt);
        jdbcTemplate.update(
                "INSERT INTO member_profiles (member_id, name, phone, gender, birthday, address) VALUES (?, ?, ?, ?, ?, ?)",
                member.id, demo.name(), member.phone, demo.gender(), demo.birthday(), member.address);
        return member;
    }

    /** 發一張券給會員（寫進 member_coupons），也記在會員手上，之後下單可以用 */
    private HeldCoupon issueCoupon(MemberState member, CouponInfo coupon, LocalDateTime receivedAt, String source) {
        Long id = jdbcTemplate.queryForObject("""
                INSERT INTO member_coupons (member_id, coupon_id, expire_at, used_at, order_id, received_at, source)
                OUTPUT INSERTED.id
                VALUES (?, ?, ?, NULL, NULL, ?, ?)
                """, Long.class, member.id, coupon.id(), receivedAt.plusDays(coupon.validDays()), receivedAt, source);
        HeldCoupon held = new HeldCoupon(id, coupon, receivedAt);
        member.heldCouponList.add(held);
        return held;
    }

    /** 預約發券紀錄：雙 11、夏季發給全部會員，每季發 VIP 券，另外各一筆未發送、已取消、等待中，回傳筆數 */
    private int seedCouponSchedules(Long mktStaffId) {
        List<MemberState> vipList = memberList.stream().filter(m -> m.demo.segment() == Segment.VIP).toList();
        List<MemberState> shuffledList = new ArrayList<>(memberList);
        Collections.shuffle(shuffledList, random);

        int count = 0;
        count += addSchedule(mktStaffId, "DOUBLE11", lastDateTime(11, 1), null, "SENT");
        count += addSchedule(mktStaffId, "SUMMER150", lastDateTime(6, 1), null, "SENT");
        // 春季券後來被停用，預約時間到了沒發出去
        count += addSchedule(mktStaffId, "SPRING12", lastDateTime(3, 1), null, "FAILED");
        count += addSchedule(mktStaffId, "SUMMER150", lastDateTime(8, 15), shuffledList.subList(0, 6), "CANCELLED");
        // VIP 券：從第 2 個月開始每 3 個月發一次
        for (LocalDateTime time = start.plusMonths(2).withDayOfMonth(1).withHour(10).withMinute(0).withSecond(0);
             time.isBefore(now); time = time.plusMonths(3)) {
            count += addSchedule(mktStaffId, "VIP300", time, vipList, "SENT");
        }
        // 4 天後的預約，CouponSendScheduler 到時候會真的發
        count += addSchedule(mktStaffId, "VIP300", now.toLocalDate().plusDays(4).atTime(10, 0), vipList, "PENDING");
        return count;
    }

    /** 今天以前最近一次的某月某日 10:00（例如最近一次的雙 11 是 11/1） */
    private LocalDateTime lastDateTime(int month, int day) {
        LocalDateTime time = LocalDate.of(now.getYear(), month, day).atTime(10, 0);
        return time.isAfter(now) ? time.minusYears(1) : time;
    }

    /** 建一筆預約發券；targetList 是 null = 全部會員。已發送的會把券發給當時已經註冊的會員，回傳 1 */
    private int addSchedule(Long mktStaffId, String couponCode, LocalDateTime scheduledAt,
                            List<MemberState> targetList, String status) {
        CouponInfo coupon = couponMap.get(couponCode);
        boolean targetAll = targetList == null;
        LocalDateTime createdAt = scheduledAt.minusDays(3 + random.nextInt(10));
        if (createdAt.isAfter(now)) {
            createdAt = now.minusDays(1);
        }
        // 預約建立時已經註冊的會員才選得到；全部會員的預約則是看發送當下有誰
        LocalDateTime pickTime = targetAll ? scheduledAt : createdAt;
        List<MemberState> recipientList = (targetAll ? memberList : targetList).stream()
                .filter(m -> m.registeredAt.isBefore(pickTime))
                .toList();

        boolean sent = status.equals("SENT");
        LocalDateTime sentAt = sent ? scheduledAt.plusSeconds(5 + random.nextInt(50)) : null;
        Long scheduleId = jdbcTemplate.queryForObject("""
                INSERT INTO coupon_schedules (coupon_id, target_all, scheduled_at, status, sent_at, sent_count, created_by, created_at)
                OUTPUT INSERTED.id
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, Long.class, coupon.id(), targetAll, scheduledAt, status, sentAt,
                sent ? recipientList.size() : null, mktStaffId, createdAt);

        if (!targetAll) {
            List<Object[]> argsList = new ArrayList<>();
            for (MemberState member : recipientList) {
                argsList.add(new Object[]{scheduleId, member.id});
            }
            jdbcTemplate.batchUpdate("INSERT INTO coupon_schedule_members (schedule_id, member_id) VALUES (?, ?)", argsList);
        }
        if (sent) {
            for (MemberState member : recipientList) {
                issueCoupon(member, coupon, sentAt, "MANUAL");
            }
        }
        return 1;
    }

    /** 生日禮：跟 AdminCouponService.sendBirthdayCoupons() 一樣，生日那個月的 1 號 00:00 發；註冊時已經過了 1 號就在下一次排程（00:00 / 12:00）發 */
    private void seedBirthdayCoupons(MemberState member) {
        CouponInfo coupon = couponMap.get("BDAY200");
        int birthMonth = member.demo.birthday().getMonthValue();
        for (LocalDate month = member.registeredAt.toLocalDate().withDayOfMonth(1);
             !month.isAfter(now.toLocalDate()); month = month.plusMonths(1)) {
            if (month.getMonthValue() != birthMonth) {
                continue;
            }
            LocalDateTime receivedAt = month.atStartOfDay();
            if (member.registeredAt.isAfter(receivedAt)) {
                LocalDateTime registered = member.registeredAt;
                receivedAt = registered.getHour() < 12
                        ? registered.toLocalDate().atTime(12, 0)
                        : registered.toLocalDate().plusDays(1).atStartOfDay();
            }
            if (!receivedAt.isAfter(now)) {
                issueCoupon(member, coupon, receivedAt, "BIRTHDAY");
            }
        }
    }

    /** 零星手動發的券（WELCOME100、SAVE10）：每個月有機率發一張，愛用折價券的人機率高一點 */
    private void seedManualCoupons(MemberState member) {
        double rate = member.demo.segment() == Segment.BARGAIN ? 0.4 : 0.2;
        for (LocalDateTime month = member.registeredAt; month.isBefore(now); month = month.plusMonths(1)) {
            if (random.nextDouble() >= rate) {
                continue;
            }
            CouponInfo coupon = couponMap.get(FALLBACK_COUPON_CODE_LIST.get(random.nextInt(FALLBACK_COUPON_CODE_LIST.size())));
            LocalDateTime receivedAt = month.plusMinutes(random.nextInt(60 * 24 * 28));
            if (receivedAt.isAfter(now)) {
                receivedAt = now.minusMinutes(1 + random.nextInt(60));
            }
            issueCoupon(member, coupon, receivedAt, "MANUAL");
        }
    }

    // ==================== 訂單 ====================

    /** 建一位會員的所有訂單：第一張在註冊後一週內，之後依消費類型隔幾天買一次，回傳訂單數 */
    private int seedOrders(MemberState member) {
        int orderCount = 0;
        LocalDateTime orderAt = member.registeredAt.plusMinutes(60 + random.nextInt(60 * 24 * 7));
        while (!orderAt.isAfter(member.activeUntil)) {
            seedOrder(member, orderAt);
            orderCount++;
            orderAt = nextOrderTime(orderAt, member.demo.segment());
        }
        return orderCount;
    }

    /** 下一次下單的時間：平均間隔是 avgDays，旺季會縮短；平日有時會拖到週末才買 */
    private LocalDateTime nextOrderTime(LocalDateTime from, Segment segment) {
        double season = SEASON_FACTOR[from.getMonthValue() - 1];
        // 指數分布：大部分間隔接近平均，偶爾很短或很長，比固定天數自然
        double days = -Math.log(1 - random.nextDouble()) * segment.avgDays / season;
        LocalDate date = from.toLocalDate().plusDays(Math.max(1, Math.round(days)));
        boolean isWeekday = date.getDayOfWeek() != DayOfWeek.SATURDAY && date.getDayOfWeek() != DayOfWeek.SUNDAY;
        if (isWeekday && random.nextDouble() < 0.3) {
            date = date.with(TemporalAdjusters.next(random.nextBoolean() ? DayOfWeek.SATURDAY : DayOfWeek.SUNDAY));
        }
        return date.atTime(ORDER_HOURS[random.nextInt(ORDER_HOURS.length)], random.nextInt(60), random.nextInt(60));
    }

    /** 建一張訂單：明細、折價券、付款紀錄，狀態依下單到現在過了多久決定 */
    private void seedOrder(MemberState member, LocalDateTime orderAt) {
        DemoMember demo = member.demo;
        Segment segment = demo.segment();
        int month = orderAt.getMonthValue();

        // 1. 買哪些商品
        List<OrderLine> lineList = new ArrayList<>();
        int itemCount = segment.minItems + random.nextInt(segment.maxItems - segment.minItems + 1);
        for (int i = 0; i < itemCount; i++) {
            addLine(lineList, demo, month);
        }
        int subtotal = subtotalOf(lineList);

        // 2. 折價券：愛用折價券的人不夠門檻會多買幾件湊單
        boolean wantsCoupon = random.nextDouble() < segment.couponRate;
        if (wantsCoupon && segment == Segment.BARGAIN) {
            int lowestMin = FALLBACK_COUPON_CODE_LIST.stream().mapToInt(code -> couponMap.get(code).minSubtotal()).min().orElse(0);
            while (subtotal < lowestMin && lineList.size() < 6) {
                addLine(lineList, demo, month);
                subtotal = subtotalOf(lineList);
            }
        }
        // 手上有能用的券：想用券的人一定用，其他人一半會順手用掉；手上沒有、又想用券，就當作剛好領到一張
        HeldCoupon held = bestHeldCoupon(member, subtotal, orderAt);
        if (held == null || (!wantsCoupon && random.nextDouble() < 0.5)) {
            held = null;
            if (wantsCoupon) {
                CouponInfo fallback = bestFallbackCoupon(subtotal);
                if (fallback != null) {
                    LocalDateTime receivedAt = orderAt.minusDays(1 + random.nextInt(fallback.validDays() - 1));
                    if (receivedAt.isBefore(member.registeredAt)) {
                        receivedAt = member.registeredAt.plusMinutes(5);
                    }
                    held = issueCoupon(member, fallback, receivedAt, "MANUAL");
                }
            }
        }
        int discount = held == null ? 0 : discountOf(held.coupon, subtotal);
        int shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
        int total = subtotal - discount + shippingFee;

        // 3. 付款、配送方式：大多用自己習慣的，偶爾換
        PaymentMethod payment = random.nextDouble() < 0.75
                ? demo.payment()
                : PaymentMethod.values()[random.nextInt(PaymentMethod.values().length)];
        ShippingMethod shipping = random.nextDouble() < 0.8
                ? demo.shipping()
                : ShippingMethod.values()[random.nextInt(ShippingMethod.values().length)];

        // 4. 狀態和各個時間
        OrderStatus status;
        LocalDateTime paidAt = null;
        LocalDateTime shippedAt = null;
        LocalDateTime deliveredAt = null;
        LocalDateTime completedAt = null;
        boolean unpaidCancelled = payment != PaymentMethod.COD && random.nextDouble() < 0.06;
        if (unpaidCancelled) {
            // 信用卡、ATM 沒付款，被 OrderTimeoutScheduler 取消
            status = OrderStatus.CANCELLED;
        } else {
            if (payment == PaymentMethod.CREDIT) {
                paidAt = orderAt.plusSeconds(10 + random.nextInt(120));
            } else if (payment == PaymentMethod.ATM) {
                paidAt = orderAt.plusMinutes(30 + random.nextInt(60 * 72));
            }
            // 最近的訂單付款時間不能超過現在（不產生未付款的訂單，見 class 說明）
            if (paidAt != null && paidAt.isAfter(now)) {
                paidAt = orderAt.plusSeconds((long) (random.nextDouble() * Duration.between(orderAt, now).getSeconds()));
            }
            // 訂單成立：信用卡、ATM 是付款時間，貨到付款是下單時間
            LocalDateTime confirmedAt = paidAt != null ? paidAt : orderAt;

            if (random.nextDouble() < 0.02) {
                // 後台在出貨前取消
                status = OrderStatus.CANCELLED;
            } else {
                shippedAt = later(confirmedAt, shipHours());
                deliveredAt = later(shippedAt, 18 + random.nextInt(55));
                completedAt = later(deliveredAt, 4 + random.nextInt(24 * 7));
                if (shippedAt.isAfter(now)) {
                    status = OrderStatus.PENDING;
                    shippedAt = null;
                    deliveredAt = null;
                    completedAt = null;
                } else if (deliveredAt.isAfter(now)) {
                    status = OrderStatus.SHIPPED;
                    deliveredAt = null;
                    completedAt = null;
                } else if (shipping == ShippingMethod.HOME || completedAt.isAfter(now)) {
                    // 宅配送達就結束；超商到店後還要等顧客取貨
                    status = OrderStatus.DELIVERED;
                    completedAt = null;
                } else {
                    status = OrderStatus.PICKED_UP;
                }
            }
        }
        boolean cancelled = status == OrderStatus.CANCELLED;

        // 5. 訂單主檔
        String shippingAddress = shipping == ShippingMethod.HOME
                ? member.address
                : CVS_STORE_LIST.get(random.nextInt(CVS_STORE_LIST.size()));
        String carrier = null;
        String trackingNumber = null;
        if (shippedAt != null) {
            if (shipping == ShippingMethod.HOME) {
                carrier = random.nextBoolean() ? "黑貓宅急便" : "新竹物流";
            } else {
                carrier = shippingAddress.startsWith("7-ELEVEN") ? "7-ELEVEN 交貨便" : "全家店到店";
            }
            trackingNumber = String.format("%06d%06d", random.nextInt(1_000_000), random.nextInt(1_000_000));
        }
        String note = random.nextDouble() < 0.08 ? NOTE_LIST.get(random.nextInt(NOTE_LIST.size())) : null;
        String orderNo = newOrderNo(orderAt);
        Long orderId = jdbcTemplate.queryForObject("""
                INSERT INTO orders (order_no, member_id, status, receiver_name, receiver_phone, receiver_email,
                                    shipping_method, shipping_address, payment_method, note,
                                    subtotal, discount, shipping_fee, total, member_coupon_id,
                                    paid_at, shipped_at, delivered_at, completed_at, created_at,
                                    shipping_carrier, tracking_number)
                OUTPUT INSERTED.id
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, Long.class,
                orderNo, member.id, status.name(), demo.name(), member.phone, member.email,
                shipping.name(), shippingAddress, payment.name(), note,
                subtotal, discount, shippingFee, total, held == null ? null : held.id,
                paidAt, shippedAt, deliveredAt, completedAt, orderAt,
                carrier, trackingNumber);
        member.orderList.add(new OrderRef(orderNo, orderAt, lineList.get(0).product().name()));

        // 6. 折價券標記已使用；取消的訂單會把券還回去（不標記），但訂單上還是記著用過哪張，跟 OrderService.cancelOrder() 一樣
        if (held != null && !cancelled) {
            held.used = true;
            jdbcTemplate.update("UPDATE member_coupons SET used_at = ?, order_id = ? WHERE id = ?", orderAt, orderId, held.id);
        }

        // 7. 訂單明細：商品名稱、顏色、尺寸、單價都是快照
        List<Object[]> itemArgsList = new ArrayList<>();
        for (OrderLine line : lineList) {
            itemArgsList.add(new Object[]{orderId, line.variant().id(), line.product().name(), line.variant().color(),
                    line.variant().size(), line.variant().url(), line.product().price(), line.qty(),
                    line.product().price() * line.qty()});
        }
        jdbcTemplate.batchUpdate("""
                INSERT INTO order_items (order_id, variant_id, product_name, color, size, image_url, unit_price, qty, total_price)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, itemArgsList);

        // 8. 付款紀錄：只有信用卡、ATM 會經過綠界
        if (payment != PaymentMethod.COD) {
            String ecpayTradeNo = paidAt == null
                    ? null
                    : paidAt.format(DateTimeFormatter.ofPattern("yyMMddHHmmss")) + String.format("%04d", random.nextInt(10000));
            jdbcTemplate.update("""
                    INSERT INTO payments (order_id, merchant_trade_no, ecpay_trade_no, amount, payment_method, status, created_at, paid_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, orderId, newMerchantTradeNo(), ecpayTradeNo, total, payment.name(),
                    paidAt == null ? "CANCELLED" : "PAID", orderAt, paidAt);
        }
    }

    /** 會員手上這個時間點能用、而且折最多的券；都不能用回傳 null */
    private HeldCoupon bestHeldCoupon(MemberState member, int subtotal, LocalDateTime orderAt) {
        HeldCoupon best = null;
        for (HeldCoupon held : member.heldCouponList) {
            boolean usable = !held.used && held.receivedAt.isBefore(orderAt) && held.expireAt.isAfter(orderAt)
                    && subtotal >= held.coupon.minSubtotal();
            if (usable && (best == null || discountOf(held.coupon, subtotal) > discountOf(best.coupon, subtotal))) {
                best = held;
            }
        }
        return best;
    }

    /** WELCOME100、SAVE10 裡夠門檻、折最多的那張；都不夠回傳 null */
    private CouponInfo bestFallbackCoupon(int subtotal) {
        CouponInfo best = null;
        for (String code : FALLBACK_COUPON_CODE_LIST) {
            CouponInfo coupon = couponMap.get(code);
            if (subtotal >= coupon.minSubtotal() && (best == null || discountOf(coupon, subtotal) > discountOf(best, subtotal))) {
                best = coupon;
            }
        }
        return best;
    }

    /** 折抵規則同 CheckoutService：折固定金額最多折到 0 元；折 % 小數無條件捨去 */
    private int discountOf(CouponInfo coupon, int subtotal) {
        return coupon.type().equals("AMOUNT")
                ? Math.min(coupon.value(), subtotal)
                : subtotal * coupon.value() / 100;
    }

    /** 加一件商品到明細；同一個 SKU 不重複 */
    private void addLine(List<OrderLine> lineList, DemoMember demo, int month) {
        ProductOption product = pickProduct(demo.topCode(), demo.segment().priceBias, month);
        VariantOption variant = product.variantList().get(random.nextInt(product.variantList().size()));
        for (OrderLine line : lineList) {
            if (line.variant().id() == variant.id()) {
                return;
            }
        }
        double qtyPick = random.nextDouble();
        int qty = qtyPick < 0.85 ? 1 : qtyPick < 0.97 ? 2 : 3;
        lineList.add(new OrderLine(product, variant, qty));
    }

    /** 挑一件商品：大多是常買的性別（偶爾幫家人買別的），依季節挑大類，再依價位偏好挑商品 */
    private ProductOption pickProduct(String topCode, int priceBias, int month) {
        if (random.nextDouble() < 0.2 || !catalog.containsKey(topCode)) {
            List<String> topCodeList = new ArrayList<>(catalog.keySet());
            topCodeList.sort(null);
            topCode = topCodeList.get(random.nextInt(topCodeList.size()));
        }
        Map<String, List<ProductOption>> bigMap = catalog.get(topCode);

        // 依季節權重抽大類：冬天外套、針織多，夏天 T 恤、襯衫多
        List<String> bigCodeList = new ArrayList<>(bigMap.keySet());
        bigCodeList.sort(null);
        double totalWeight = 0;
        for (String bigCode : bigCodeList) {
            totalWeight += seasonWeight(bigCode, month);
        }
        double pick = random.nextDouble() * totalWeight;
        String chosenBigCode = bigCodeList.get(bigCodeList.size() - 1);
        for (String bigCode : bigCodeList) {
            pick -= seasonWeight(bigCode, month);
            if (pick < 0) {
                chosenBigCode = bigCode;
                break;
            }
        }

        // 商品已經依價格排好：偏貴的人抽靠後面的、偏便宜的人抽靠前面的
        List<ProductOption> productList = bigMap.get(chosenBigCode);
        double position = random.nextDouble();
        if (priceBias > 0) {
            position = Math.sqrt(position);
        } else if (priceBias < 0) {
            position = position * position;
        }
        return productList.get(Math.min((int) (position * productList.size()), productList.size() - 1));
    }

    /** 大類在這個月份的權重 */
    private double seasonWeight(String bigCode, int month) {
        boolean isWinter = month == 11 || month == 12 || month <= 2;
        boolean isSummer = month >= 6 && month <= 8;
        if (bigCode.endsWith("-outer")) {
            return isWinter ? 3 : isSummer ? 0.3 : 1.5;
        }
        if (bigCode.endsWith("-knit")) {
            return isWinter ? 2.5 : isSummer ? 0.3 : 1.2;
        }
        if (bigCode.endsWith("-tops") || bigCode.endsWith("-shirts")) {
            return isSummer ? 3 : isWinter ? 1 : 1.5;
        }
        if (bigCode.endsWith("-dresses-and-skirts")) {
            return isSummer ? 2 : isWinter ? 0.6 : 1;
        }
        return 1;
    }

    /** 出貨要幾小時：大多 1 天內，少數拖到 3～5 天 */
    private int shipHours() {
        double pick = random.nextDouble();
        if (pick < 0.6) {
            return 4 + random.nextInt(27);
        }
        if (pick < 0.9) {
            return 30 + random.nextInt(31);
        }
        return 60 + random.nextInt(61);
    }

    private int subtotalOf(List<OrderLine> lineList) {
        int subtotal = 0;
        for (OrderLine line : lineList) {
            subtotal += line.product().price() * line.qty();
        }
        return subtotal;
    }

    private LocalDateTime later(LocalDateTime base, int hours) {
        return base.plusHours(hours).plusMinutes(random.nextInt(60));
    }

    /** 訂單編號格式同 CheckoutService：UC + 下單日期 + 4 位數，撞號就重抽 */
    private String newOrderNo(LocalDateTime orderAt) {
        String date = orderAt.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String orderNo;
        do {
            orderNo = "UC" + date + "-" + String.format("%04d", random.nextInt(10000));
        } while (!orderNoSet.add(orderNo));
        return orderNo;
    }

    /** 綠界交易編號格式同 EcpayService：UC + 18 碼英數 */
    private String newMerchantTradeNo() {
        return "UC" + String.format("%09X%09X", random.nextInt(1 << 30), random.nextInt(1 << 30));
    }

    // ==================== 追蹤清單、購物車 ====================

    /** 追蹤清單：常客追蹤得多、偶爾買的人追蹤得少；流失會員的追蹤時間停在他們還有在逛的時候，回傳筆數 */
    private int seedWishlist(MemberState member) {
        int count = switch (member.demo.segment()) {
            case VIP, BARGAIN -> 6 + random.nextInt(8);
            case REGULAR, NEW -> 3 + random.nextInt(6);
            case OCCASIONAL, CHURNED -> 1 + random.nextInt(4);
        };
        Set<Long> productIdSet = new HashSet<>();
        List<Object[]> argsList = new ArrayList<>();
        long activeSeconds = Duration.between(member.registeredAt, member.activeUntil).getSeconds();
        for (int i = 0; i < count; i++) {
            LocalDateTime createdAt = member.registeredAt.plusSeconds((long) (random.nextDouble() * activeSeconds));
            ProductOption product = pickProduct(member.demo.topCode(), member.demo.segment().priceBias, createdAt.getMonthValue());
            if (productIdSet.add(product.id())) {
                argsList.add(new Object[]{member.id, product.id(), createdAt});
            }
        }
        jdbcTemplate.batchUpdate("INSERT INTO wishlist_items (member_id, product_id, created_at) VALUES (?, ?, ?)", argsList);
        return argsList.size();
    }

    /** 購物車：一半左右的會員最近有放東西還沒結帳；兩位流失會員留著很久以前沒結帳的購物車，回傳筆數 */
    private int seedCart(MemberState member) {
        boolean isChurned = member.demo.segment() == Segment.CHURNED;
        boolean hasCart = isChurned ? random.nextDouble() < 0.5 : random.nextDouble() < 0.55;
        if (!hasCart) {
            return 0;
        }
        LocalDateTime latest = member.activeUntil;
        LocalDateTime earliest = latest.minusDays(30).isBefore(member.registeredAt) ? member.registeredAt : latest.minusDays(30);
        long rangeSeconds = Duration.between(earliest, latest).getSeconds();

        int count = 1 + random.nextInt(4);
        Set<Long> variantIdSet = new HashSet<>();
        List<Object[]> argsList = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            LocalDateTime createdAt = earliest.plusSeconds((long) (random.nextDouble() * rangeSeconds));
            ProductOption product = pickProduct(member.demo.topCode(), member.demo.segment().priceBias, createdAt.getMonthValue());
            VariantOption variant = product.variantList().get(random.nextInt(product.variantList().size()));
            if (variantIdSet.add(variant.id())) {
                argsList.add(new Object[]{member.id, variant.id(), random.nextDouble() < 0.85 ? 1 : 2, createdAt});
            }
        }
        jdbcTemplate.batchUpdate("INSERT INTO cart_items (member_id, variant_id, qty, created_at) VALUES (?, ?, ?, ?)", argsList);
        return argsList.size();
    }

    // ==================== 客服單 ====================

    /** 客服單：整段期間約 40 張，加上最近 5 天的 6 張（大多還沒處理），回傳張數 */
    private int seedSupportTickets() {
        List<MemberState> recentMemberList = memberList.stream()
                .filter(m -> m.demo.segment() != Segment.CHURNED)
                .toList();
        int count = 0;
        for (int i = 0; i < 40; i++) {
            // 15% 是沒登入的訪客
            MemberState member = random.nextDouble() < 0.15 ? null : memberList.get(random.nextInt(memberList.size()));
            count += seedTicket(member, false, i);
        }
        for (int i = 0; i < 6; i++) {
            count += seedTicket(recentMemberList.get(random.nextInt(recentMemberList.size())), true, 40 + i);
        }
        return count;
    }

    /** 建一張客服單；recent = 最近 5 天內。no 用來產生訪客的 email，回傳 1 */
    private int seedTicket(MemberState member, boolean recent, int no) {
        // 1. 問題類型（依權重抽）；要提到訂單、但找不到適合的訂單，就改成商品諮詢
        int totalWeight = TICKET_TOPIC_LIST.stream().mapToInt(TicketTopic::weight).sum();
        int pick = random.nextInt(totalWeight);
        TicketTopic topic = TICKET_TOPIC_LIST.get(TICKET_TOPIC_LIST.size() - 1);
        for (TicketTopic candidate : TICKET_TOPIC_LIST) {
            pick -= candidate.weight();
            if (pick < 0) {
                topic = candidate;
                break;
            }
        }
        OrderRef order = null;
        if (topic.needOrder() && member != null) {
            List<OrderRef> candidateList = member.orderList.stream()
                    .filter(o -> !recent || o.createdAt().isAfter(now.minusDays(10)))
                    .toList();
            if (!candidateList.isEmpty()) {
                order = candidateList.get(random.nextInt(candidateList.size()));
            }
        }
        if (topic.needOrder() && order == null) {
            topic = TICKET_TOPIC_LIST.stream().filter(t -> t.name().equals("商品諮詢")).findFirst().orElseThrow();
        }

        // 2. 提出時間：跟訂單有關的在下單後 6 小時～5 天；其他的在會員還有在逛的期間（訪客就是整段期間）
        LocalDateTime createdAt;
        if (order != null) {
            createdAt = order.createdAt().plusHours(6 + random.nextInt(115));
        } else if (recent) {
            createdAt = now.minusMinutes(30 + random.nextInt(60 * 24 * 5));
        } else {
            LocalDateTime from = member == null ? start : member.registeredAt;
            LocalDateTime to = member == null ? now : member.activeUntil;
            createdAt = from.plusSeconds((long) (random.nextDouble() * Duration.between(from, to).getSeconds()));
        }
        if (createdAt.isAfter(now.minusMinutes(10))) {
            createdAt = now.minusMinutes(10 + random.nextInt(60));
        }

        // 3. 內容
        String[] template = topic.templateList().get(random.nextInt(topic.templateList().size()));
        String productName = order != null
                ? order.productName()
                : pickProduct(member == null ? "all_women" : member.demo.topCode(), 0, createdAt.getMonthValue()).name();
        String orderNo = order == null ? "" : order.orderNo();
        String message = template[0].replace("{order}", orderNo).replace("{product}", productName);
        String replyText = template[1].replace("{order}", orderNo).replace("{product}", productName);

        // 4. 處理進度：越久以前的越可能已解決；不到 1 天的都還沒回覆，最近 5 天的大多還沒回覆
        long ageHours = Duration.between(createdAt, now).toHours();
        String status = "IN_PROGRESS";
        String reply = null;
        LocalDateTime repliedAt = null;
        LocalDateTime resolvedAt = null;
        // progress 越大處理得越完整：0.25 以上已回覆、0.55 以上已解決；最近的只抽 0～0.4，所以最多已回覆、還沒解決
        double progress = recent ? random.nextDouble() * 0.4 : random.nextDouble();
        boolean replied = ageHours >= 24 && (ageHours > 24 * 14 || progress >= 0.25);
        if (replied) {
            repliedAt = createdAt.plusHours(1 + random.nextInt(30)).plusMinutes(random.nextInt(60));
            if (repliedAt.isAfter(now)) {
                repliedAt = null;
            } else {
                reply = replyText;
                resolvedAt = repliedAt.plusMinutes(random.nextInt(60 * 20));
                if ((ageHours > 24 * 14 || progress >= 0.55) && !resolvedAt.isAfter(now)) {
                    status = "RESOLVED";
                } else {
                    resolvedAt = null;
                }
            }
        }

        String email = member == null ? String.format("guest%02d%s", no, EMAIL_DOMAIN) : member.email;
        jdbcTemplate.update("""
                INSERT INTO support_tickets (ticket_no, member_id, email, topic, message, status, created_at, reply, replied_at, resolved_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, newTicketNo(), member == null ? null : member.id, email, topic.name(), message, status,
                createdAt, reply, repliedAt, resolvedAt);
        return 1;
    }

    /** 客服單編號格式同 SupportTicketService：CS + 8 位數，撞號就重抽 */
    private String newTicketNo() {
        String ticketNo;
        do {
            ticketNo = "CS" + String.format("%08d", random.nextInt(100_000_000));
        } while (!ticketNoSet.add(ticketNo));
        return ticketNo;
    }

    // ==================== 入庫紀錄 ====================

    /**
     * 商品部的入庫單：平日每 4～9 天一張，每張 1～3 件商品、每件幾個 SKU。
     * 只做入庫（RECEIVE），庫存只能用入庫增加；入庫前的庫存是隨機的低庫存，跟現在的庫存沒有對帳。回傳張數
     */
    private int seedInventoryReceives(Long productStaffId) {
        List<String> topCodeList = new ArrayList<>(catalog.keySet());
        topCodeList.sort(null);
        int count = 0;
        LocalDate day = start.toLocalDate().plusDays(random.nextInt(5));
        while (true) {
            if (day.getDayOfWeek() == DayOfWeek.SATURDAY || day.getDayOfWeek() == DayOfWeek.SUNDAY) {
                day = day.with(TemporalAdjusters.next(DayOfWeek.MONDAY));
            }
            LocalDateTime createdAt = day.atTime(10 + random.nextInt(8), random.nextInt(60), random.nextInt(60));
            if (createdAt.isAfter(now)) {
                break;
            }
            Long transactionId = jdbcTemplate.queryForObject("""
                    INSERT INTO inventory_transactions (type, note, staff_id, created_at)
                    OUTPUT INSERTED.id
                    VALUES ('RECEIVE', ?, ?, ?)
                    """, Long.class, RECEIVE_NOTE_LIST.get(random.nextInt(RECEIVE_NOTE_LIST.size())), productStaffId, createdAt);

            List<Object[]> argsList = new ArrayList<>();
            Set<Long> variantIdSet = new HashSet<>();
            int productCount = 1 + random.nextInt(3);
            for (int i = 0; i < productCount; i++) {
                String topCode = topCodeList.get(random.nextInt(topCodeList.size()));
                ProductOption product = pickProduct(topCode, 0, createdAt.getMonthValue());
                List<VariantOption> variantList = new ArrayList<>(product.variantList());
                Collections.shuffle(variantList, random);
                int skuCount = Math.min(variantList.size(), 2 + random.nextInt(5));
                for (VariantOption variant : variantList.subList(0, skuCount)) {
                    if (!variantIdSet.add(variant.id())) {
                        continue;
                    }
                    // 一箱 6 件，一次進 2～10 箱
                    int qty = (2 + random.nextInt(9)) * 6;
                    int stockBefore = random.nextInt(16);
                    argsList.add(new Object[]{transactionId, variant.id(), variant.skuCode(), product.name(),
                            variant.color(), variant.size(), qty, stockBefore, stockBefore + qty});
                }
            }
            jdbcTemplate.batchUpdate("""
                    INSERT INTO inventory_transaction_items (transaction_id, variant_id, sku_code, product_name, color, size,
                                                             quantity_change, stock_before, stock_after)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, argsList);
            count++;
            day = day.plusDays(4 + random.nextInt(6));
        }
        return count;
    }
}
