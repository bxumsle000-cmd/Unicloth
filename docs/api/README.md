# API 文件

每個 Controller 一份文件，依前台（`controller/store`）、後台（`controller/admin`）分資料夾。

## 前台（`store/`）

| 文件 | Controller | 路徑前綴 | 登入 |
|---|---|---|---|
| [auth.md](store/auth.md) | `AuthController` | `/api/auth` | 不需要 |
| [cart.md](store/cart.md) | `CartController` | `/api/cart` | 會員 |
| [category.md](store/category.md) | `CategoryController` | `/api/categories` | 不需要 |
| [checkout.md](store/checkout.md) | `CheckoutController` | `/api/checkout` | 會員 |
| [coupon.md](store/coupon.md) | `CouponController` | `/api/coupon` | 會員 |
| [ecpay.md](store/ecpay.md) | `EcpayController` | `/api/payments/ecpay` | 建立付款要會員；通知不用 |
| [member.md](store/member.md) | `MemberController` | `/api/member` | 會員 |
| [member-product-view.md](store/member-product-view.md) | `MemberProductViewController` | `/api/member/product-views` | 會員 |
| [order.md](store/order.md) | `OrderController` | `/api/orders` | 會員 |
| [product.md](store/product.md) | `ProductController` | `/api/products` | 不需要 |
| [recommendation.md](store/recommendation.md) | `RecommendationController` | `/api/recommendations` | 不需要 |
| [style.md](store/style.md) | `StyleController` | `/api/styles` | 不需要 |
| [support-ticket.md](store/support-ticket.md) | `SupportTicketController` | `/api/support-tickets` | 會員 |
| [wishlist.md](store/wishlist.md) | `WishlistController` | `/api/wishlist` | 會員 |

## 後台（`admin/`）

| 文件 | Controller | 路徑前綴 | 誰能用 |
|---|---|---|---|
| [admin-auth.md](admin/admin-auth.md) | `AdminAuthController` | `/api/admin/auth` | 登入不用 token；改密碼要員工 |
| [admin-coupon.md](admin/admin-coupon.md) | `AdminCouponController` | `/api/admin/mkt/coupons` | `MKT`、`ADMIN` |
| [admin-inventory.md](admin/admin-inventory.md) | `AdminInventoryController` | `/api/admin/product/inventory` | `PRODUCT`、`ADMIN` |
| [admin-mkt-member.md](admin/admin-mkt-member.md) | `AdminMktMemberController` | `/api/admin/mkt/members` | `MKT`、`ADMIN` |
| [admin-mkt-sales.md](admin/admin-mkt-sales.md) | `AdminMktSalesController` | `/api/admin/mkt/sales` | `MKT`、`ADMIN` |
| [admin-order.md](admin/admin-order.md) | `AdminOrderController` | `/api/admin/order/orders` | `ORDER`、`ADMIN` |
| [admin-product.md](admin/admin-product.md) | `AdminProductController` | `/api/admin/product/products` | `PRODUCT`、`ADMIN` |
| [admin-product-analytics.md](admin/admin-product-analytics.md) | `AdminProductAnalyticsController` | `/api/admin/product/analytics` | `PRODUCT`、`ADMIN` |
| [admin-product-category.md](admin/admin-product-category.md) | `AdminProductCategoryController` | `/api/admin/product/categories` | `PRODUCT`、`ADMIN` |
| [admin-product-schedule.md](admin/admin-product-schedule.md) | `AdminProductScheduleController` | `/api/admin/product/product-schedules` | `PRODUCT`、`ADMIN` |
| [admin-support-ticket.md](admin/admin-support-ticket.md) | `AdminSupportTicketController` | `/api/admin/cs/tickets` | `CS`、`ADMIN` |
| [staff.md](admin/staff.md) | `StaffController` | `/api/admin/admin/staff` | `ADMIN` |

---

## 所有 API 共通的規則

### 錯誤回應的格式

除了綠界付款通知（回純文字）以外，錯誤都是這個格式：

```json
{
  "code": 404,
  "message": "找不到商品：men-487511"
}
```

### 登入與權限

| 情況 | 狀態碼 | `message` |
|---|---|---|
| 要登入的 API 沒帶 token、token 無效或過期 | 401 | `尚未登入或登入已失效` |
| 會員 API：已登入但還沒補填會員資料 | 403 | `請先填寫會員資料` |
| 員工 token 打會員 API、會員 token 打後台 API、其他部門打不屬於自己部門的 API | 403 | `沒有權限使用這個功能` |

不用登入的 API 帶了無效的 token 不會報錯，一樣當成未登入處理。

### 驗證訊息的語言

`@NotBlank`、`@Size`、`@Email` 這類沒有自訂文字的驗證訊息，語言跟著請求的 `Accept-Language` 走。文件的例子都是 `zh-TW` 的結果（瀏覽器預設會帶），例如 `不得空白`；請求沒帶這個 header 時，目前的環境回英文，例如 `must not be blank`。

多個欄位都錯時，會用 `; ` 接成一句，**順序不固定**。

### 這些情況都回 500

`GlobalExceptionHandler` 只有專門處理「欄位驗證失敗」和「JSON 讀不懂」，其他 Spring 丟出的例外都會掉到最後的兜底 handler，回 `500`、`系統發生錯誤，請稍後再試`：

| 情況 | 例子 |
|---|---|
| 路徑上的數字參數不是數字 | `DELETE /api/cart/abc` |
| 單一網址參數的型別不對 | `GET /api/coupon/usable?subtotal=abc`、`GET /api/admin/order/orders?status=x` |
| 必填的網址參數沒帶 | `GET /api/coupon/usable` |
| `sort` 用了不存在的欄位 | `GET /api/products?keyword=a&sort=nope,asc` |
| 路徑不存在、HTTP method 不對 | `GET /api/nope`、`GET /api/checkout` |
| `Content-Type` 不對 | 用 JSON 打 `POST /api/payments/ecpay/notify` |

例外：`GET /api/categories/{code}/products`、`GET /api/admin/admin/staff` 的篩選條件是綁到物件上的，型別不對時回 `400`，`message` 是 Spring 的英文轉換訊息（見各自的文件）。

### JSON 裡的數字、布林欄位

型別是 `int`、`long`、`boolean` 的欄位，**沒傳或傳 `null` 都不會變成 0 / `false`**，而是回 400 `請求內容格式錯誤，請確認欄位值是否正確`。這種欄位在各文件都標成必填。

### 分頁的格式

回傳分頁的 API 都是 `content` + `page`：

```json
{
  "content": [],
  "page": {
    "size": 20,
    "number": 0,
    "totalElements": 57,
    "totalPages": 3
  }
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `content` | array | 這一頁的資料；沒有資料時是 `[]` |
| `page.size` | number | 一頁幾筆 |
| `page.number` | number | 目前第幾頁（從 0 開始） |
| `page.totalElements` | number | 符合條件的總筆數 |
| `page.totalPages` | number | 總頁數 |

這個格式來自 `application.yml` 的 `spring.data.web.pageable.serialization-mode: via_dto`。
