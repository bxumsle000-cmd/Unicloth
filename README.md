## 啟動順序

**一定要先開 Docker的應用程式。**
Spring Boot 啟動時會連資料庫，資料庫沒起來就會直接啟動失敗。

注意路徑要正確，要在專案資料夾的路徑執行。

> ⚠️ **以下兩行 docker 指令只有第一次才需要執行。**
> 之後只要打開 Docker 應用程式，資料庫容器就會自動啟動，直接跑 Spring Boot 即可。

```bash
docker compose down -v
docker compose up -d
```

> `docker compose up -d` 會啟動兩個容器：
> - `unicloth-db`：SQL Server 資料庫
> - `unicloth-tunnel`：綠界付款通知用的對外 HTTPS 網址（不用另外安裝 cloudflared，詳見 [README-ECPAY.md](README-ECPAY.md)）
>
> ⚠️ `docker compose down -v` 會**清空整個資料庫**，只有第一次或想整組重來時才用。

```bash
# Windows PowerShell / cmd
.\mvnw.cmd spring-boot:run

# Git Bash / macOS / Linux
./mvnw spring-boot:run
```

執行完可以點擊測試網址
```bash
http://localhost:8080/
```

## 2. 開啟 React 前端

> 前提：**Docker 和 Spring Boot 都要先跑起來**（照上面的啟動順序）。
> React 前端的 `/api`、`/img`、`/video` 請求會轉給 `http://localhost:8080` 的 Spring Boot，後端沒開的話頁面會抓不到資料。
> 電腦需要先安裝 [Node.js](https://nodejs.org/)（`npm` 指令是跟著 Node.js 一起裝的）。

> ⚠️ **除了最後的 `npm run dev`，以下步驟都只有第一次才需要執行。**
> 之後每次開前端，直接跳到「每次啟動前端」即可。

### 第一次：安裝 Node.js

用 Windows 內建的 `winget` 安裝 LTS 版：

```bash
winget install OpenJS.NodeJS.LTS
```

裝完後**關掉終端機再重開**，確認有裝好：

```bash
node -v
npm -v
```

### 第一次：安裝前端套件

```bash
cd frontend
npm install
```

> 之後只有 `package.json` 有變動（例如別人新增了套件）時，才需要再跑一次 `npm install`。

### 每次啟動前端

另外開一個終端機，進到 `frontend` 資料夾後啟動：

```bash
cd frontend
npm run dev
```

執行完可以點擊測試網址
```bash
http://localhost:5173/
```

## 3. 帳號 & 密碼（SSMS 連線）

> 前提：**Docker 容器要在跑**。
> 如果要看到資料表，**Spring Boot 也要至少成功啟動過一次**，只跑 Docker 的話會看到一個空的 `Unicloth` 資料庫。

開啟 SSMS，在「連線至伺服器」視窗填入：

| 欄位 | 值 |
|------|----|
| 伺服器名稱 | `localhost,14321` |
| 驗證 | SQL Server 驗證 |
| 登入 | `sa` |
| 密碼 | `Eeit25@Unicloth` |

注意事項：

- 伺服器名稱中間是 **逗號** `,` 不是冒號 `:`（SSMS 的寫法）。
- 連線後展開「資料庫」→ `Unicloth` → 「資料表」，就能看到 `categories`、`products`、`members`、`orders` 等表。
- 這組帳密同時寫在 `application.properties`。

## 4. 綠界付款測試

> 前提：**Docker、Spring Boot、React 前端都要先跑起來**（照上面的步驟）。
> 只是逛網站、加購物車、貨到付款的話，不需要這一段。

要測信用卡 / ATM 付款，**另外開一個終端機**，在專案資料夾執行：

```bash
node ecpay-callback-proxy.cjs
```

看到「綠界付款通知專用入口已啟動」就成功了，**這個視窗不要關**。
沒開的話，綠界那邊可以付款，但資料庫收不到付款結果，訂單會一直是「未付款」，30 分鐘後被自動取消。

注意事項：

- **不用設定 `ECPAY_RETURN_URL`**，後端會自動抓 `unicloth-tunnel` 目前的網址。
- 綠界頁面上的橘色「測試付款請點此」會開新分頁，在新分頁按「交易成功」，**原本的綠界頁面不要關**。
- 付款成功後，`payments.status` 會變成 `PAID`、`orders.paid_at` 會有付款時間、訂單狀態從「未付款」變成「訂單確認中」。

完整步驟、訂單狀態說明、常見問題請看 [README-ECPAY.md](README-ECPAY.md)。
