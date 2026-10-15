# UNICLOTH 綠界金流測試教學

## 一、功能介紹

這次綠界金流功能放在 GitHub 的 `CHEN` 分支。

目前已測試成功的流程：

1. 使用者在 UNICLOTH 網站選購商品。
2. 進入結帳頁面，選擇信用卡付款。
3. Spring Boot 建立訂單與付款紀錄。
4. 網頁跳轉綠界官方測試付款頁面。
5. 使用綠界測試付款功能完成交易。
6. 綠界透過 HTTPS 通知後端。
7. 後端驗證交易通知並更新 SQL Server。
8. `payments.status` 更新為 `PAID`，訂單記錄付款時間。

目前是**測試環境，不是正式金流**，不會使用真實信用卡扣款。

---

## 二、需要安裝的軟體

- Git
- JDK 21
- Node.js、npm
- Docker Desktop
- VS Code 或 IntelliJ IDEA
- Cloudflare Tunnel（cloudflared）
- SQL Server Management Studio（SSMS，可選，用來查資料庫）

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

## 四、啟動資料庫

在專案根目錄執行：

```bat
docker compose up -d
```

確認 Docker Desktop 中 SQL Server 容器已啟動。

本專題使用的資料庫連線設定為：

- Server：`localhost,14321`
- Database：`Unicloth`
- 驗證方式：SQL Server Authentication
- 帳號與密碼：依專題組內提供的開發環境設定

密碼不要放進公開 README 或 GitHub。

Spring Boot 啟動時會使用 Flyway 檢查資料庫版本。

---

## 五、啟動付款通知 Proxy

另外開一個新的 CMD。

進入專案根目錄，執行：

```bat
node ecpay-callback-proxy.cjs
```

這支程式會在本機 `127.0.0.1:8787` 接收付款通知，再轉送到 Spring Boot 的 `8080`。

**這個 CMD 視窗不要關閉。**

---

## 六、建立 Cloudflare HTTPS 網址

再開一個新的 CMD，執行：

```bat
cloudflared tunnel --url http://127.0.0.1:8787
```

執行成功後，畫面會產生一組 HTTPS 網址，例如：

```text
https://example-random.trycloudflare.com
```

每個組員都應使用**自己電腦產生的網址**。

如果重開 Cloudflare Tunnel，網址可能改變，必須重新設定 Spring Boot。

**這個 CMD 視窗也不要關閉。**

---

## 七、設定綠界付款通知網址並啟動後端

再開一個新的 CMD，進入專案根目錄。

先設定綠界回呼網址：

```bat
set "ECPAY_RETURN_URL=https://你的Cloudflare網址.trycloudflare.com/api/payments/ecpay/notify"
```

例如 Cloudflare 給你的網址是：

```text
https://abc-example.trycloudflare.com
```

那麼要設定：

```bat
set "ECPAY_RETURN_URL=https://abc-example.trycloudflare.com/api/payments/ecpay/notify"
```

接著在**同一個 CMD 視窗**執行：

```bat
mvnw.cmd spring-boot:run
```

成功會顯示類似：

```text
Tomcat started on port 8080 (http)
Started UniclothApplication
```

**重要：**

- `ECPAY_RETURN_URL` 一定要在啟動 Spring Boot 之前設定。
- 環境變數只對當前 CMD 有效。
- 如果 Cloudflare 網址換了，要停止 Spring Boot、設定新網址，再重新啟動。
- 如果出現 Port 8080 already in use，代表可能已經有另一個 Spring Boot 在執行，不要重複啟動。

---

## 八、啟動 React 前端

再開一個新的 CMD，進入 `frontend` 資料夾：

```bat
cd frontend
```

第一次下載專題先安裝套件：

```bat
npm install
```

啟動前端，固定使用 Port 5174：

```bat
npm run dev -- --port 5174 --strictPort
```

成功會顯示：

```text
Local: http://localhost:5174/
```

瀏覽器開啟：

http://localhost:5174/

如果 5174 被占用，先確認是不是其他視窗已經在執行 Vite。不要直接關閉不認識的程序。

---

## 九、測試信用卡付款

1. 開啟 UNICLOTH 網站。
2. 登入測試會員。
3. 將一件商品加入購物車。
4. 前往結帳頁面。
5. 選擇「信用卡」。
6. 填寫結帳所需資訊。
7. 點擊「確認下單」。
8. 網頁應跳轉到綠界官方測試網址：

```text
https://payment-stage.ecpay.com.tw/
```

9. 確認顯示的交易金額與訂單金額一致。
10. 點擊綠界頁面的橘色「測試付款請點此」。
11. 使用綠界測試頁面提供的測試資料，選擇「交易成功」。

**請勿輸入真正的信用卡資料。**

如果交易成功，綠界會顯示付款成功畫面。

---

## 十、檢查 SQL Server 付款結果

開啟 SSMS，連接專題資料庫。

執行：

```sql
USE Unicloth;

SELECT TOP (10) *
FROM dbo.payments
ORDER BY id DESC;
```

找到剛剛的付款紀錄。

正常應該看到：

```text
status = PAID
```

接著檢查訂單與付款紀錄：

```sql
USE Unicloth;

SELECT TOP (10)
    o.id,
    o.order_no,
    o.status AS order_status,
    o.paid_at AS order_paid_at,
    p.status AS payment_status,
    p.paid_at AS payment_paid_at
FROM dbo.orders o
JOIN dbo.payments p ON p.order_id = o.id
ORDER BY p.id DESC;
```

成功的情況應該是：

- `payment_status = PAID`
- `order_paid_at` 有付款時間
- `payment_paid_at` 有付款時間

即使 `order_status = PENDING`，也不一定是錯誤。因為它可能代表「訂單確認中」，與是否完成付款是不同的概念。

---

## 十一、常見問題

### 1. Port 8080 already in use

代表後端已經有程式占用 8080。

查詢：

```bat
netstat -ano | findstr :8080
```

先確認占用的 PID 是什麼程式，再停止原本的 Spring Boot 或沿用現有服務，不要直接亂關其他程式。

### 2. Port 5174 already in use

代表前端 Port 已被占用。

先開啟：

http://localhost:5174/

如果已經能進入 UNICLOTH，就不用再啟動第二個 Vite。

### 3. 綠界顯示成功，但資料庫仍是 PENDING

檢查：

- Spring Boot 是否正常運作。
- Node.js Proxy 是否正常運作。
- Cloudflare Tunnel 是否正常運作。
- `ECPAY_RETURN_URL` 是否為目前的 Cloudflare HTTPS 網址。
- Spring Boot 是否在設定環境變數之後才啟動。

不要直接手動把資料庫狀態改成 `PAID`，應先找出付款通知未處理的原因。

### 4. 付款後不能返回網站

確認前端是否運作於：

```text
http://localhost:5174/
```

目前專題的 `ClientBackURL` 預設使用 Port 5174。

### 5. 為什麼每個人都要啟動 Cloudflare？

綠界伺服器無法直接呼叫其他組員電腦上的 `localhost`。

Cloudflare Tunnel 會產生可從外部存取的 HTTPS 網址，讓綠界能把付款結果通知到目前測試的電腦。

---

## 十二、目前功能限制

這次已驗證的是**信用卡測試付款成功的完整流程**。

以下仍需進一步完成或驗證：

- ATM 付款完整流程。
- 付款失敗與取消處理。
- 未付款訂單逾時處理。
- 庫存與優惠券恢復。
- 正式環境的部署、安全設定和金流憑證。

所以目前適合**專題開發與課堂展示**，還不能直接當作正式營運的金流系統。

---

## 十三、啟動順序快速整理

每次測試時依序啟動：

1. Docker Desktop：啟動 SQL Server。
2. Node.js Proxy：`node ecpay-callback-proxy.cjs`
3. Cloudflare Tunnel：產生 HTTPS 網址。
4. Spring Boot：設定 `ECPAY_RETURN_URL` 後啟動。
5. React：啟動 `localhost:5174`。
6. 瀏覽器：登入網站進行測試付款。
7. SSMS：確認 `payments.status = PAID`。

**所有服務必須保持執行，才能完成整套付款通知流程。**
