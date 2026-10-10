# ProductCard.jsx 的 Tailwind 說明

檔案位置：`frontend/src/component/ProductCard.jsx`

數值都對照 main 分支 `kinu.css` 的 `.card`、`.tag`、`.price`、`.heart` 等樣式。

---

## 兩個通用規則

**規則一：數字單位是 4px**

間距類的 class（`mt-`、`px-`、`top-`、`gap-`）後面接的數字乘以 4 就是 px，例如：

- `mt-3` → 3 × 4 = 12px
- `top-2.5` → 2.5 × 4 = 10px
- `py-1` → 1 × 4 = 4px

**規則二：中括號 `[ ]` 是直接寫值**

Tailwind 沒有現成的值時，就把值寫在中括號裡，例如：

- `mb-[5px]` → `margin-bottom: 5px`
- `bg-[#F0EBE3]` → 背景色 `#F0EBE3`

---

## 最外層 `<div className="relative">`（第 9 行）

| class | 意思 |
|---|---|
| `relative` | `position: relative`。讓裡面的愛心按鈕（`absolute`）以這張卡片為基準定位。 |

## 卡片本體 `<div className="group block">`（第 10 行）

| class | 意思 |
|---|---|
| `group` | 標記這是一個「群組」。裡面的元素可以用 `group-hover:` 偵測滑鼠是否停在整張卡片上。 |
| `block` | `display: block`。`<div>` 本來就是 block，這個 class 其實沒有作用（從 main 的 `<a class="card">` 搬來留下的），可以刪。 |

## 圖片框（第 12 行）

| class | 意思 |
|---|---|
| `relative` | 讓 NEW／HOT 標籤以圖片框為基準定位 |
| `aspect-[3/4]` | 寬高比固定 3:4，寬度跟著欄寬走，高度自動算 |
| `overflow-hidden` | 超出框的部分藏起來，圖片放大時不會蓋到外面 |
| `bg-[#F0EBE3]` | 米色底，圖片還沒載入時看得到 |

## 圖片 `<img>`（第 15 行）

| class | 意思 |
|---|---|
| `size-full` | 寬、高都 100%，等於 `w-full h-full` |
| `object-cover` | 圖片等比例縮放填滿框，多出來的部分裁掉，不會變形 |
| `mix-blend-multiply` | 圖片跟米色底色「相乘」混合，商品圖的白底會變成米色，跟背景融在一起 |
| `transition-transform` | `transform` 改變時用動畫過渡 |
| `duration-500` | 動畫時間 500 毫秒 |
| `group-hover:scale-[1.03]` | 滑鼠停在整張卡片（第 10 行的 `group`）上時，圖片放大到 1.03 倍 |

## NEW／HOT 標籤

外層容器（第 19 行）：

| class | 意思 |
|---|---|
| `absolute` | 脫離排版，貼在圖片框上 |
| `top-2.5 left-2.5` | 距離上、左各 10px |
| `flex` | 兩個標籤橫向排 |
| `gap-[5px]` | 標籤之間間隔 5px |

NEW 和 HOT 兩個標籤（第 20、21 行）：

| class | 意思 |
|---|---|
| `bg-white`／`bg-black` | NEW 白底，HOT 黑底 |
| `text-white` | 只有 HOT 有，黑底配白字 |
| `px-[7px] py-1` | 左右內距 7px，上下 4px |
| `text-[8px]` | 字 8px |
| `tracking-[.15em]` | 字距 0.15 個字寬 |

## 商品名稱（第 26 行）

| class | 意思 |
|---|---|
| `mt-3` | 上方留 12px，跟圖片隔開 |
| `mb-[5px]` | 下方留 5px，跟價格隔開 |
| `text-xs` | 字 12px |
| `leading-[1.6]` | 行高 1.6 倍，名稱太長換行時兩行不會太擠 |
| `tracking-[.04em]` | 字距 0.04em |

## 價格（第 29、31 行）

| class | 意思 |
|---|---|
| `text-xs tracking-[.05em]` | 12px，字距 0.05em |
| `text-[#9a3b2d]` | 只在 `onSaleNow` 為 true 時加上，售價變紅 |

第 29 行的 className 用反引號 `` ` `` 包起來，`${ }` 裡面放判斷式。這跟 Python 的 f-string 一樣：

```python
f"text-xs {'text-red' if on_sale else ''}"
```

刪除線原價 `<del>`（第 31 行）：

| class | 意思 |
|---|---|
| `ml-[7px]` | 跟售價隔 7px |
| `text-[11px]` | 比售價小一點 |
| `text-[#76716c]` | 灰色 |

刪除線本身是 `<del>` 標籤自帶的，不是 Tailwind 加的。

## 收藏愛心按鈕（第 37 行）

| class | 意思 |
|---|---|
| `absolute top-1.5 right-1.5` | 貼在卡片右上角，距離上、右各 6px |
| `z-10` | `z-index: 10`，疊在圖片上面 |
| `grid place-items-center` | 讓裡面的愛心圖示水平、垂直都置中 |
| `size-[34px]` | 寬高 34px |
| `rounded-full` | 圓角拉滿，變成圓形 |
| `bg-[#ffffffcc]` | 白色加透明度。`cc` 換成十進位是 204，204 ÷ 255 ≈ 0.8，也就是 80% 不透明 |

## 愛心圖示 `<svg>`（第 39 行）

| class | 意思 |
|---|---|
| `size-[19px]` | 寬高 19px |
| `fill-none` | 內部不填色，所以是空心愛心 |
| `stroke-current` | 線條顏色跟著文字顏色走（`currentColor`），目前是黑色 |
| `stroke-[1.4]` | 線條粗細 1.4 |
