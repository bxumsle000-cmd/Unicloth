# UNICLOTH 綠界金流測試教學

## 一、功能介紹

這次綠界金流功能放在 GitHub 的 `CHEN` 分支。

目前已測試成功的流程：

1. 使用者在 UNICLOTH 網站選購商品。
2. 進入結帳頁面，選擇信用卡付款。
3. Spring Boot 建立訂單（狀態 `UNPAID` 未付款）與付款紀錄。
4. 網頁跳轉綠界官方測試付款頁面。
5. 使用綠界測試付款功能完成交易。
6. 綠界透過 HTTPS 通知後端。
7. 後端驗證交易通知並更新 SQL Server。
8. `payments.status` 更新為 `PAID`，訂單記錄付款時間，訂單狀態變成 `PENDING`（訂單確認中）。

沒付款的訂單會自動取消，並還原庫存與折價券（見「十、訂單狀態與自動取消」）。

目前是**測試環境，不是正式金流**，不會使用真實信用卡扣款。

---

## 二、需要安裝的軟體

- Git
- JDK 21
- Node.js、npm
- Docker Desktop
- VS Code 或 IntelliJ IDEA
- SQL Server Management Studio（SSMS，可選，用來查資料庫）

**不用另外安裝 cloudflared**，它已經放在 `docker-compose.yml` 裡，跟資料庫一起用 Docker 啟動。

先確認 Docker Desktop 已經啟動。

---

## 三、下載 CHEN 分支

### 情況 A：第一次下載專題

開啟 CMD，輸入：

```bat
git clone https://github.com/bxumsle000-cmd/Unicloth.git
cd Unicloth
git fetch origin
git switch --track origin/CHEN
```

如果 `CHEN` 分支已經存在於本機，改用：

```bat
git switch CHEN
git pull origin CHEN
```

### 情況 B：電腦已經有專題

先進入原本的專題資料夾：

```bat
cd /d 你的專題資料夾路徑
```

確認自己的修改已經保存或提交，再輸入：

```bat
git fetch origin
git switch --track origin/CHEN
```

如果已經建立本機 `CHEN`：

```bat
git switch CHEN
git pull origin CHEN
```

**注意：不要直接把這些修改 Push 到 `main`，也不要在有未保存修改時強制切換分支。**

---

## 四、啟動資料庫與付款通知網址（Docker）

在專案根目錄執行：

```bat
docker compose up -d
```

這一行會啟動：

- `db`：SQL Server 資料庫
- `tunnel`：Cloudflare Tunnel，產生一個綠界連得到的 HTTPS 網址

確認 Docker Desktop 中兩個容器都已啟動。

本專題使用的資料庫連線設定為：

- Server：`localhost,14321`
- Database：`Unicloth`
- 驗證方式：SQL Server Authentication
- 帳號與密碼：依專題組內提供的開發環境設定

密碼不要放進公開 README 或 GitHub。

Spring Boot 啟動時會使用 Flyway 檢查資料庫版本。

### 為什麼需要 tunnel？

綠界的伺服器在網路上，連不到你電腦的 `localhost`。
tunnel 會產生一個 `https://xxxx.trycloudflare.com` 網址，綠界把付款結果送到這個網址，再轉回你的電腦。

### 網址每次都會變，要自己設定嗎？

**不用。** 每次 tunnel 重新啟動網址都會變，但 Spring Boot 每次建立付款時，都會自動去問 tunnel 目前的網址（`EcpayReturnUrlResolver`）。

想自己看目前的網址：

```bat
docker compose logs tunnel
```

找框框裡的 `https://xxxx.trycloudflare.com` 那一行。

---

## 五、啟動付款通知 Proxy

另外開一個新的 CMD。

進入專案根目錄，執行：

```bat
node ecpay-callback-proxy.cjs
```

這支程式會在本機 `127.0.0.1:8787` 接收付款通知，再轉送到 Spring Boot 的 `8080`。
它只允許 `/api/payments/ecpay/notify` 這個路徑，其他 API 從外面都連不到。

成功會顯示「綠界付款通知專用入口已啟動」。

**這個 CMD 視窗不要關閉。** 沒開的話，付款可以完成，但資料庫收不到付款結果（見「十二、常見問題」第 3 點）。

整條付款通知的路徑：

```text
綠界 → Cloudflare 網址 → tunnel 容器（Docker）→ 8787（Node Proxy）→ 8080（Spring Boot）
```

---

## 六、啟動後端

再開一個新的 CMD 或 PowerShell，進入專案根目錄，執行：

```bat
mvnw.cmd spring-boot:run
```

（PowerShell 要寫 `.\mvnw.cmd spring-boot:run`，或直接在 IntelliJ 按 Run。）

成功會顯示類似：

```text
Tomcat started on port 8080 (http)
Started UniclothApplication
```

**重要：**

- **不需要設定 `ECPAY_RETURN_URL`**，後端會自動抓 tunnel 的網址。
- 如果你以前在同一個視窗設定過 `ECPAY_RETURN_URL`，它會蓋掉自動抓的網址，而且舊網址早就失效了。請開一個新視窗，或先清掉：
  - CMD：`set ECPAY_RETURN_URL=`
  - PowerShell：`Remove-Item Env:ECPAY_RETURN_URL`
- 如果出現 Port 8080 already in use，代表已經有另一個 Spring Boot 在執行，不要重複啟動。

想確認後端用的是哪個網址：建立付款時，後端 log 會印出

```text
ECPay ReturnURL (from tunnel): https://xxxx.trycloudflare.com/api/payments/ecpay/notify
```

如果看到 `falls back to localhost`，代表 tunnel 沒開，先執行 `docker compose up -d`。

---

## 七、啟動 React 前端

再開一個新的 CMD，進入 `frontend` 資料夾：

```bat
cd frontend
```

第一次下載專題先安裝套件：

```bat
npm install
```

啟動前端：

```bat
npm run dev
```

成功會顯示：

```text
Local: http://localhost:5173/
```

瀏覽器開啟：

http://localhost:5173/

付款後按綠界的「返回商店」會回到 `http://localhost:5173/orders`（`ClientBackURL`）。

如果 5173 被占用，先確認是不是其他視窗已經在執行 Vite。不要直接關閉不認識的程序。

---

## 八、測試付款

1. 開啟 UNICLOTH 網站。
2. 登入測試會員。
3. 將一件商品加入購物車。
4. 前往結帳頁面。
5. 選擇「信用卡」。
6. 填寫結帳所需資訊。
7. 點擊「確認下單並前往綠界付款」。
8. 網頁應跳轉到綠界官方測試網址：

```text
https://payment-stage.ecpay.com.tw/
```

9. 確認顯示的交易金額與訂單金額一致。
10. 點擊綠界頁面的橘色「測試付款請點此」，會開一個**新分頁**。
11. 在新分頁按「交易成功」。**原本的綠界付款頁不要關掉。**

**請勿輸入真正的信用卡資料。**

### 「測試付款請點此」付的是什麼？

它其實是**模擬 iPASS MONEY 掃碼付款**，不是刷卡，所以綠界送來的付款方式是 `DigitalPayment_iPASS MONEY`。

綠界的信用卡付款頁本來就會一起提供 Apple Pay、iPASS MONEY、全支付、綠界Pay，
所以後端的信用卡訂單也接受 `DigitalPayment_` 開頭的付款方式（`EcpayCallbackService.isExpectedPaymentType`）。

---

## 九、檢查 SQL Server 付款結果

開啟 SSMS，連接專題資料庫，執行：

```sql
USE Unicloth;

SELECT TOP (10)
    o.id,
    o.order_no,
    o.status AS order_status,
    o.paid_at AS order_paid_at,
    p.status AS payment_status,
    p.ecpay_trade_no,
    p.paid_at AS payment_paid_at
FROM dbo.orders o
JOIN dbo.payments p ON p.order_id = o.id
ORDER BY p.id DESC;
```

付款成功應該看到：

- `order_status = PENDING`（訂單確認中）
- `order_paid_at` 有付款時間
- `payment_status = PAID`
- `ecpay_trade_no` 有綠界交易編號
- `payment_paid_at` 有付款時間

後端 log 會出現：

```text
ECPay notification received: tradeNo=..., RtnCode=1, PaymentType=...
ECPay payment verified: orderNo=..., tradeNo=...
```

---

## 十、訂單狀態與自動取消

### 訂單狀態（`orders.status`）

```text
信用卡 / ATM：UNPAID（未付款）→ 付款成功 → PENDING（訂單確認中）→ SHIPPED → ...
                         └ 付款失敗或逾時 → CANCELLED
貨到付款：     直接 PENDING
```

### 付款狀態（`payments.status`）

`payments` 記的是「每一次付款」，跟訂單狀態是兩回事：

- `PENDING`：等待付款
- `PAID`：付款成功
- `CANCELLED`：這筆付款不會再繼續（付款失敗、逾時、訂單取消）

### 什麼時候會自動取消？

1. **綠界通知付款失敗**：馬上取消。
2. **顧客直接關掉綠界頁面、沒付款**：綠界不會發任何通知，由排程（`OrderTimeoutScheduler`）每 10 分鐘檢查一次，超過時間還是 `UNPAID` 就取消。
   - 信用卡：30 分鐘
   - ATM：4 天（要比綠界的繳費期限長）
   - 時間可以在 `application.properties` 的 `order.payment-timeout.*` 調整。測試時可以暫時改短。

取消時會：

- 訂單改成 `CANCELLED`
- 庫存加回去
- 折價券還給會員（可以再用）
- 還在等待的付款紀錄改成 `CANCELLED`

已結帳的商品**不會**放回購物車。

---

## 十一、測試帳號與測試資料

- 測試付款請一律使用綠界測試環境，不要輸入真實卡號。
- 排程會自動取消超過時間沒付款的訂單，所以資料庫裡出現很多 `CANCELLED` 的測試訂單是正常的。

---

## 十二、常見問題

### 1. Port 8080 already in use

代表後端已經有程式占用 8080。

查詢：

```bat
netstat -ano | findstr :8080
```

先確認占用的 PID 是什麼程式，再停止原本的 Spring Boot 或沿用現有服務，不要直接亂關其他程式。

### 2. Port 5173 already in use

代表前端 Port 已被占用。

先開啟 http://localhost:5173/ ，如果已經能進入 UNICLOTH，就不用再啟動第二個 Vite。

### 3. 綠界顯示成功，但資料庫仍是 UNPAID、沒有 paid_at

依序檢查：

1. **8787 的 Node Proxy 有沒有開**（`node ecpay-callback-proxy.cjs`）。最常見的原因。
2. **tunnel 有沒有開**：`docker compose ps` 看 `unicloth-tunnel` 是不是 Up。
3. **後端 log 的 ReturnURL**：是不是 `https://xxxx.trycloudflare.com/...`，而不是 `localhost`，也不是舊的網址（有設定 `ECPAY_RETURN_URL` 的話要清掉）。
4. **後端 log 有沒有 `ECPay notification received`**：
   - 沒有：通知沒送到，回去檢查 1～3。
   - 有，但接著出現 `ECPay callback rejected: ...`：看後面的原因。

綠界沒收到 `1|OK` 會**過一陣子自動重送**（實測大約 10～20 分鐘）。把問題排除後，等重送就會自動更新，不用重新付款。

但如果超過 30 分鐘都沒處理好，排程會先把訂單取消；之後綠界重送時，後端會回「訂單已取消，需要人工確認」，這筆就要人工處理。

**不要直接手動把資料庫狀態改成 `PAID`**，應先找出付款通知未處理的原因。

### 4. 付款後不能返回網站

確認前端是否運作於 http://localhost:5173/ 。

`ClientBackURL` 預設是 `http://localhost:5173/orders`，要改可以設定環境變數 `ECPAY_CLIENT_BACK_URL`。

### 5. 執行 node 時出現 Cannot find module

檢查指令後面有沒有多複製到符號，例如全形冒號「：」。正確指令是：

```bat
node ecpay-callback-proxy.cjs
```

---

## 十三、目前功能限制

已完成：

- 信用卡（含電子支付）測試付款成功的完整流程
- 付款失敗時取消訂單
- 未付款訂單逾時自動取消
- 取消時還原庫存與折價券

以下仍需進一步完成或驗證：

- ATM 付款完整流程（未實際測試）
- 真正輸入測試卡號刷卡（`Credit_CreditCard`）的流程（未實際測試）
- 取消訂單前先向綠界查詢交易狀態，避免「已付款但通知沒進來」的訂單被取消
- 正式環境的部署、安全設定和金流憑證

所以目前適合**專題開發與課堂展示**，還不能直接當作正式營運的金流系統。

---

## 十四、啟動順序快速整理

每次測試時依序啟動：

1. Docker Desktop。
2. `docker compose up -d`：啟動 SQL Server 和 tunnel。
3. `node ecpay-callback-proxy.cjs`：啟動 8787，視窗不要關。
4. Spring Boot：`mvnw.cmd spring-boot:run`（不用設定 `ECPAY_RETURN_URL`）。
5. React：在 `frontend` 執行 `npm run dev`，開 http://localhost:5173/ 。
6. 瀏覽器：登入網站進行測試付款。
7. SSMS 或後端 log：確認 `payments.status = PAID`、`orders.paid_at` 有時間。

**所有服務必須保持執行，才能完成整套付款通知流程。**
