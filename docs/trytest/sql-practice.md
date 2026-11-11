# SQL 練習題（Unicloth 資料庫）

> 資料庫：SQL Server（`Unicloth`）
> 只出題目，答案自己寫在 `test.sql`。

---

## 第 1 題：後台「低庫存警示」清單

### 情境

倉管人員每天早上打開後台，要先看到「快賣完的商品」好決定要不要補貨。
所以要寫一個 repository 方法，撈出**庫存不足的商品款式**。

### 需求

- 只看**上架中**的商品（`products.status = 'ON_SALE'`）
- 款式庫存（`product_variants.stock`）**小於 5** 的才列出來
- 庫存最少的排最前面；庫存一樣時，依商品名稱排序

### 要顯示的欄位

| 欄位 | 說明 |
|---|---|
| 商品名稱 | `products.name` |
| 顏色 | `product_variants.color` |
| 尺寸 | `product_variants.size` |
| SKU | `product_variants.sku_code` |
| 剩餘庫存 | `product_variants.stock` |

### 會用到的表

- `products`（`id`, `name`, `status`）
- `product_variants`（`id`, `product_id`, `color`, `size`, `sku_code`, `stock`）

---

## 第 2 題：首頁「熱銷排行榜」前 10 名

### 情境

行銷想在首頁放一個「本店熱銷 TOP 10」區塊，依**實際賣出的件數**排名。
所以要寫一個 repository 方法，統計每個商品總共賣了幾件。

### 需求

- **已取消**的訂單不算（`orders.status = 'CANCELLED'` 要排除）
- 以「商品」為單位統計，不是以款式（同一件商品不同顏色、尺寸要加總在一起）
- 依賣出件數由多到少，只取前 10 名

### 要顯示的欄位

| 欄位 | 說明 |
|---|---|
| 商品 id | `products.id` |
| 商品名稱 | `products.name` |
| 總賣出件數 | `order_items.qty` 加總 |
| 總銷售金額 | `order_items.total_price` 加總 |

### 會用到的表

- `orders`（`id`, `status`）
- `order_items`（`id`, `order_id`, `variant_id`, `qty`, `total_price`）
- `product_variants`（`id`, `product_id`）
- `products`（`id`, `name`）
