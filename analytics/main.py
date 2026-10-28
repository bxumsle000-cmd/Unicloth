"""
銷售數據的 Python 分析服務（FastAPI）。

只給 Spring Boot 呼叫，前端不會直接連過來：
  React → Spring Boot /api/admin/mkt/sales/**（擋權限，只有 MKT、ADMIN）→ 這裡 http://127.0.0.1:8000

平常不用自己啟動：docker compose up -d 會一起把它跑起來（見 docker-compose.yml 的 analytics 服務）。
改了程式要重建容器才會生效：docker compose up -d --build analytics

想不透過 Docker 直接跑（例如除錯），先停掉容器，不然 8000 會被佔走：
  docker compose stop analytics
  pip install -r analytics/requirements.txt   # 第一次才要
  python analytics/main.py

只開給本機，別台電腦連不到，所以這裡不用再檢查登入。
"""

import os
from datetime import date, datetime

import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response

import coupon_performance
import member_customers
import order_structure
import product_sales
import sales_overview

app = FastAPI(title="Unicloth 銷售分析")


@app.exception_handler(ValueError)
def handle_value_error(request: Request, e: ValueError):
    """參數不對 → 400，格式跟 Spring Boot 的 ErrorResponse 一樣有 message，Spring Boot 會原樣轉給前端"""
    return JSONResponse(status_code=400, content={"code": 400, "message": str(e)})


@app.get("/sales/overview")
def get_sales_overview(range: str = "30d"):
    """營收總覽：range = 7d / 30d / 90d / 12m"""
    return sales_overview.get_overview(range, date.today())


@app.get("/sales/overview/export")
def export_sales_overview(start: date, end: date):
    """營收總覽匯出 Excel：start、end 格式 2026-10-01（含頭尾）"""
    return Response(
        content=sales_overview.export_excel(start, end),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@app.get("/sales/products")
def get_product_sales(range: str = "30d", main: int | None = None, sub: int | None = None):
    """商品銷售：range = 7d / 30d / 90d / 12m；main、sub 是主分類、副分類的 id，不帶就是全部"""
    return product_sales.get_product_sales(range, date.today(), main, sub)


@app.get("/sales/products/rank")
def get_product_rank(range: str = "30d", main: int | None = None, sub: int | None = None,
                     type: str = "hot", page: int = 0):
    """商品排行的其中一頁：type = hot（熱銷）/ slow（滯銷）；page 從 0 開始；range、main、sub 跟 /sales/products 一樣"""
    return product_sales.get_product_rank(range, date.today(), main, sub, type, page)


@app.get("/sales/orders")
def get_order_structure(range: str = "30d", shipping: str | None = None):
    """訂單結構：range = 7d / 30d / 90d / 12m；shipping = HOME / CVS，不帶就是全部"""
    return order_structure.get_order_structure(range, datetime.now(), shipping)


@app.get("/sales/members")
def get_member_customers(range: str = "30d", gender: str | None = None, age: str | None = None):
    """會員與顧客：range = 7d / 30d / 90d / 12m；gender = female / male；age = u24 / 25-34 / 35-44 / 45up，不帶就是全部"""
    return member_customers.get_member_customers(range, date.today(), gender, age)


@app.get("/sales/coupons")
def get_coupon_performance(range: str = "30d"):
    """折價券成效：range = 7d / 30d / 90d / 12m"""
    return coupon_performance.get_coupon_performance(range, datetime.now())


if __name__ == "__main__":
    # 直接跑只聽 127.0.0.1；在容器裡要聽 0.0.0.0，Docker 才轉得進來（docker-compose.yml 設 ANALYTICS_HOST，埠號一樣只開給本機）
    uvicorn.run(app, host=os.getenv("ANALYTICS_HOST", "127.0.0.1"), port=8000)
