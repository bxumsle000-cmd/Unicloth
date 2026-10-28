# 銷售分析服務（main.py）的容器，由 docker-compose.yml 的 analytics 服務建立、啟動
# 改了這個資料夾的程式要重建才會生效：docker compose up -d --build analytics

# 固定用 Debian 12（bookworm），下面微軟的套件來源是給 Debian 12 的
FROM python:3.13-slim-bookworm

# TZ：容器預設是 UTC，不設的話 date.today() 在台灣早上 8 點前會是前一天，「昨天」就算錯
# PYTHONUNBUFFERED：print / log 直接輸出，docker compose logs 才看得到
ENV TZ=Asia/Taipei \
    PYTHONUNBUFFERED=1

# 安裝微軟的 SQL Server ODBC 驅動程式（pyodbc 要靠它連資料庫）
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl gnupg ca-certificates tzdata \
    && curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
    && curl -fsSL https://packages.microsoft.com/config/debian/12/prod.list -o /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18 unixodbc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 先只複製 requirements.txt 裝套件：之後只改 .py 的話，這一步會沿用快取，重建很快
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY *.py .

CMD ["python", "main.py"]
