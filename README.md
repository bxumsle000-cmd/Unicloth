## 啟動順序

**一定要先開 Docker，再啟動 Spring Boot。**
Spring Boot 啟動時會連資料庫，資料庫沒起來就會直接啟動失敗。

---

## 1. Docker

**注意路徑要正確** ，要在專案資料夾的路徑執行。
在別的資料夾跑會出現 `no configuration file provided: not found`。

### 第一次跑 / 換一台新電腦

```bash
docker compose up -d
```

### 整組砍掉重來

**只有在資料庫需要整個砍掉時才用**（例如 migration 改壞了、資料塞亂了想從零開始）。
會，**所有資料清空**，平常不要跑這個。

```bash
docker compose down -v
docker compose up -d
```

## 2. Spring Boot 啟動方式

### 方式 A：IDEA直接啟動（vscode、intellij、eclipse 都可以）

1. 用 IDEA 開啟專案根目錄
2. 找到 `src/main/java/com/EEIT25/unicloth/UniclothApplication.java`。 
3. 在 IDEA本身應該有執行的按鍵，直接點就可以。

### 方式 B：命令列
如果IDEA找不到執行的地方，也直接可以輸入指令。

**注意路徑要正確** ，要在專案資料夾的路徑執行。
在別的資料夾跑會出現錯誤。
```bash
# Windows PowerShell / cmd
.\mvnw.cmd spring-boot:run

# Git Bash / macOS / Linux
./mvnw spring-boot:run
```

***成功之後可以開啟測試網址***
```
http://localhost:8080/
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