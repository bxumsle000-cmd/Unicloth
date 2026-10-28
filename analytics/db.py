"""
連 SQL Server（跟 Spring Boot 同一個資料庫）。

連線資訊預設跟 application.properties 一樣；要換就設環境變數 DB_HOST、DB_PORT、DB_NAME、DB_USER、DB_PASSWORD。
"""

import os

import pandas as pd
import pyodbc

# 新版的 Driver 18 優先，沒有才用 17（兩個都是微軟官方的 SQL Server 驅動程式）
DRIVER_LIST = ["ODBC Driver 18 for SQL Server", "ODBC Driver 17 for SQL Server"]


def _connection_string() -> str:
    installed = pyodbc.drivers()
    driver = next((name for name in DRIVER_LIST if name in installed), None)
    if driver is None:
        raise RuntimeError("找不到 SQL Server 的 ODBC 驅動程式，請安裝 ODBC Driver 18 for SQL Server")
    return (
        f"DRIVER={{{driver}}};"
        f"SERVER={os.getenv('DB_HOST', 'localhost')},{os.getenv('DB_PORT', '14321')};"
        f"DATABASE={os.getenv('DB_NAME', 'Unicloth')};"
        f"UID={os.getenv('DB_USER', 'sa')};"
        f"PWD={os.getenv('DB_PASSWORD', 'Eeit25@Unicloth')};"
        "Encrypt=yes;TrustServerCertificate=yes;"   # 跟 Spring Boot 的 encrypt=true;trustServerCertificate=true 一樣
    )


def query(sql: str, params: tuple = ()) -> pd.DataFrame:
    """執行 SELECT，結果轉成 DataFrame（欄位名稱就是 SQL 裡 AS 取的名字）"""
    with pyodbc.connect(_connection_string()) as conn:
        cursor = conn.cursor()
        cursor.execute(sql, params)
        columns = [col[0] for col in cursor.description]
        return pd.DataFrame.from_records([tuple(row) for row in cursor.fetchall()], columns=columns)
