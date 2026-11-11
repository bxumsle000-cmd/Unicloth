# Kinu

服飾電商網站，分成「前台商店」和「後台管理」兩部分。

## 專案介紹

### 前台商店（<http://localhost:8080/>）

- 會員用 Google 帳號登入（Firebase）
- 商品瀏覽、分類、搜尋、新品、風格推薦
- 收藏清單、購物車、優惠券、結帳
- 付款：貨到付款、綠界信用卡 / ATM
- 訂單查詢、客服單

### 後台管理（<http://localhost:8080/admin/login>）

登入時要選部門，每個部門看到的功能不同：

| 部門 | 負責的功能 |
|------|-----------|
| 商品部 | 商品、分類、上下架排程、庫存、商品分析 |
| 訂單物流 | 訂單處理、出貨 |
| 客服 | 客服單 |
| 行銷 | 優惠券、會員、銷售數據 |
| 系統管理 | 員工帳號管理，並可進入所有部門 |

### 使用技術

| 部分 | 技術 |
|------|------|
| 後端 | Java 21、Spring Boot、Spring Security + JWT、JPA、Flyway |
| 資料庫 | SQL Server 2022（Docker） |
| 前端 | React + Vite（已 build 好放在 `src/main/resources/static/`） |
| 銷售分析 | Python 服務（Docker 容器 `unicloth-analytics`） |
| 金流 | 綠界 ECPay 測試環境 |

## 後台員工測試帳號

密碼全部都是 **`Test1234`**。

| 帳號 | 部門 |
|------|------|
| `sys01` | 系統管理（可進所有部門） |
| `product01` | 商品部 |
| `order01` | 訂單物流 |
| `cs01` | 客服 |
| `mkt01` | 行銷 |

> 這些帳號寫在 `src/main/resources/db/migration/V1__init.sql`，資料庫第一次建立時會自動加入。

## 如何啟動

### 第一次：建立 Docker 容器

**先打開 Docker 應用程式**，再在專案資料夾執行：

```bash
docker compose up -d
```

會啟動三個容器：

- `unicloth-db`：SQL Server 資料庫
- `unicloth-tunnel`：綠界付款通知用的對外網址
- `unicloth-analytics`：行銷後台「銷售數據」用的分析服務（第一次要建映像檔，要等幾分鐘）

> 之後只要打開 Docker 應用程式，容器就會自動啟動，不用再跑這行。
> 想清空資料庫整組重來：先 `docker compose down -v` 再 `docker compose up -d`（**會刪掉所有資料**）。

### 每次：啟動 Spring Boot

確認 Docker 有開著（資料庫沒起來，Spring Boot 會啟動失敗），在專案資料夾執行：

```bash
# Windows PowerShell / cmd
.\mvnw.cmd spring-boot:run

# Git Bash / macOS / Linux
./mvnw spring-boot:run
```

啟動完成後開：

- 前台：<http://localhost:8080/>
- 後台：<http://localhost:8080/admin/login>

前端已經 build 好，**不用另外啟動前端**。要修改前端請看 [README-FRONTEND.md](README-FRONTEND.md)。

### 要測綠界付款時

另外開一個終端機，在專案資料夾執行（需要先安裝 Node.js），視窗不要關：

```bash
node ecpay-callback-proxy.cjs
```

完整說明請看 [README-ECPAY.md](README-ECPAY.md)。只用貨到付款的話不需要這一步。

## 資料庫連線（SSMS）

| 欄位 | 值 |
|------|----|
| 伺服器名稱 | `localhost,14321`（中間是逗號） |
| 驗證 | SQL Server 驗證 |
| 登入 | `sa` |
| 密碼 | `Eeit25@Unicloth` |

> Spring Boot 要至少成功啟動過一次，才會建出資料表。
