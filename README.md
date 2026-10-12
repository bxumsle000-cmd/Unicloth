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
