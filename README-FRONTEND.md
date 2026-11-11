# 修改前端

> 只有**改了 `frontend/` 裡的程式**才需要看這份；只是要開網站的話，照 [README.md](README.md) 啟動即可。

前端是 React + Vite，原始碼在 `frontend/`。
build 好的檔案放在 `src/main/resources/static/`，由 Spring Boot 一起提供（<http://localhost:8080/>）。

## 第一次：安裝 Node.js

用 Windows 內建的 `winget` 安裝 LTS 版：

```bash
winget install OpenJS.NodeJS.LTS
```

裝完後**關掉終端機再重開**，確認有裝好：

```bash
node -v
npm -v
```

## 第一次：安裝前端套件

```bash
cd frontend
npm install
```

> 之後只有 `package.json` 有變動（例如別人新增了套件）時，才需要再跑一次 `npm install`。

## 開發時：用 `npm run dev` 即時看修改結果

Spring Boot 要先開著，再另外開一個終端機：

```bash
cd frontend
npm run dev
```

然後開 <http://localhost:5173/>，改完存檔畫面就會自動更新。
`/api`、`/img`、`/video` 的請求會轉給 <http://localhost:8080>。

- 5173 和 8080 的登入狀態是分開的，兩邊要各自登入。
- 綠界付款後按「返回商店」會回到 <http://localhost:8080/orders>，不是 5173。
- 改完之後還是要照下面的步驟 build，8080 才會是新版。

## 改完：build 並複製到 Spring Boot

在 `frontend` 資料夾依序執行三行：

```bash
# Windows PowerShell
npm run build
Remove-Item -Recurse -Force ..\src\main\resources\static\assets
Copy-Item -Recurse -Force dist\* ..\src\main\resources\static\

# Git Bash / macOS / Linux
npm run build
rm -rf ../src/main/resources/static/assets
cp -r dist/. ../src/main/resources/static/
```

三行分別是：

1. `npm run build`：把前端打包到 `frontend/dist`，最後一行出現 `✓ built in ...` 就是成功。
2. 刪掉 `static/assets` 裡的舊檔：打包出來的檔名每次都不同（例如 `index-D8TUvaZQ.js`），不刪的話舊檔會一直累積。
3. 把 `dist` 裡的 `index.html` 和 `assets` 複製到 `static/`（`static/img`、`static/video` 不會被動到）。

做完後**重新啟動 Spring Boot**，再開 <http://localhost:8080/> 才會看到新的畫面。

## 注意事項

- **新增頁面路徑時**（在 `frontend/src/App.jsx` 加了新的 `<Route path="...">`），要把同一個路徑加進 `src/main/java/com/EEIT25/unicloth/controller/SpaForwardController.java`，不然在那一頁按重新整理會出錯。
- `frontend/.env` 的 Firebase 設定是 build 的時候寫進檔案的，改了 `.env` 要重新 build。
