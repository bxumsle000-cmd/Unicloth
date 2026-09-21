## 啟動順序

**一定要先開 Docker的應用程式。**
Spring Boot 啟動時會連資料庫，資料庫沒起來就會直接啟動失敗。

注意路徑要正確，要在專案資料夾的路徑執行。

```bash
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

## 2.帳號 & 密碼（SSMS 連線）

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

