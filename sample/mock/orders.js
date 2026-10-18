// 假訂單：用 mock/products.js 的商品產生，欄位對應 orders / order_items / payments 三張表
// （items 裡的 skuCode 是為了畫面方便；payments 是這張訂單的綠界付款紀錄）
window.MOCK_ORDERS = [
  {
    "id": 12,
    "orderNo": "UC20261015-3037",
    "memberName": "鄭心怡",
    "memberEmail": "member12@example.com",
    "status": "PENDING",
    "receiverName": "郭欣妤",
    "receiverPhone": "0953-106-718",
    "receiverEmail": "member12@example.com",
    "shippingMethod": "CVS",
    "shippingAddress": "7-ELEVEN 板新門市",
    "paymentMethod": "CREDIT",
    "note": "請在下午送達",
    "subtotal": 3160,
    "discount": 0,
    "couponName": null,
    "shippingFee": 0,
    "total": 3160,
    "paidAt": "2026-10-15 11:32",
    "shippedAt": null,
    "completedAt": null,
    "createdAt": "2026-10-15 11:29",
    "items": [
      {
        "skuCode": "488298-COL09-XS",
        "productName": "羅紋連帽上衣(長袖)",
        "color": "黑色",
        "size": "XS",
        "imageUrl": "img/products/women-488298/col09.jpg",
        "unitPrice": 590,
        "qty": 2,
        "totalPrice": 1180
      },
      {
        "skuCode": "486614-COL57-L",
        "productName": "Easy Care柔軟休閒襯衫(長袖)",
        "color": "橄欖綠",
        "size": "L",
        "imageUrl": "img/products/men-486614/col57.jpg",
        "unitPrice": 990,
        "qty": 2,
        "totalPrice": 1980
      }
    ],
    "payments": [
      {
        "merchantTradeNo": "UCMUXCCG007026",
        "ecpayTradeNo": "2415003290",
        "amount": 3160,
        "paymentMethod": "CREDIT",
        "status": "PAID",
        "createdAt": "2026-10-15 11:31",
        "paidAt": "2026-10-15 11:32"
      }
    ]
  },
  {
    "id": 4,
    "orderNo": "UC20261015-2667",
    "memberName": "郭欣妤",
    "memberEmail": "member4@example.com",
    "status": "PENDING",
    "receiverName": "張家瑋",
    "receiverPhone": "0969-943-640",
    "receiverEmail": "member4@example.com",
    "shippingMethod": "HOME",
    "shippingAddress": "桃園市中壢區中正路 300 號",
    "paymentMethod": "ATM",
    "note": null,
    "subtotal": 2980,
    "discount": 0,
    "couponName": null,
    "shippingFee": 0,
    "total": 2980,
    "paidAt": null,
    "shippedAt": null,
    "completedAt": null,
    "createdAt": "2026-10-15 06:13",
    "items": [
      {
        "skuCode": "487488-COL69-S",
        "productName": "美麗諾混紡襯衫式開襟外套",
        "color": "藏青色",
        "size": "S",
        "imageUrl": "img/products/men-487488/col69.jpg",
        "unitPrice": 1490,
        "qty": 2,
        "totalPrice": 2980
      }
    ],
    "payments": [
      {
        "merchantTradeNo": "UCMUORPC008243",
        "ecpayTradeNo": null,
        "amount": 2980,
        "paymentMethod": "ATM",
        "status": "PENDING",
        "createdAt": "2026-10-15 06:15",
        "paidAt": null
      }
    ]
  },
  {
    "id": 9,
    "orderNo": "UC20261015-8829",
    "memberName": "吳承恩",
    "memberEmail": "member9@example.com",
    "status": "PENDING",
    "receiverName": "吳承恩",
    "receiverPhone": "0930-763-496",
    "receiverEmail": "member9@example.com",
    "shippingMethod": "CVS",
    "shippingAddress": "7-ELEVEN 板新門市",
    "paymentMethod": "CREDIT",
    "note": null,
    "subtotal": 3970,
    "discount": 0,
    "couponName": null,
    "shippingFee": 0,
    "total": 3970,
    "paidAt": "2026-10-15 05:11",
    "shippedAt": null,
    "completedAt": null,
    "createdAt": "2026-10-15 05:08",
    "items": [
      {
        "skuCode": "487488-COL57-XL",
        "productName": "美麗諾混紡襯衫式開襟外套",
        "color": "橄欖綠",
        "size": "XL",
        "imageUrl": "img/products/men-487488/col57.jpg",
        "unitPrice": 1490,
        "qty": 2,
        "totalPrice": 2980
      },
      {
        "skuCode": "483281-COL39-L",
        "productName": "特級彈性AIRism防曬連帽外套",
        "color": "深咖啡色",
        "size": "L",
        "imageUrl": "img/products/women-483281/col39.jpg",
        "unitPrice": 990,
        "qty": 1,
        "totalPrice": 990
      }
    ],
    "payments": [
      {
        "merchantTradeNo": "UCMV4HJPC08229",
        "ecpayTradeNo": "2410154695",
        "amount": 3970,
        "paymentMethod": "CREDIT",
        "status": "PAID",
        "createdAt": "2026-10-15 05:10",
        "paidAt": "2026-10-15 05:11"
      }
    ]
  },
  {
    "id": 5,
    "orderNo": "UC20261014-1846",
    "memberName": "楊淑惠",
    "memberEmail": "member5@example.com",
    "status": "PENDING",
    "receiverName": "楊淑惠",
    "receiverPhone": "0992-374-592",
    "receiverEmail": "member5@example.com",
    "shippingMethod": "CVS",
    "shippingAddress": "全家 高雄四維店",
    "paymentMethod": "ATM",
    "note": null,
    "subtotal": 1180,
    "discount": 118,
    "couponName": "秋季 9 折券",
    "shippingFee": 50,
    "total": 1112,
    "paidAt": null,
    "shippedAt": null,
    "completedAt": null,
    "createdAt": "2026-10-14 22:55",
    "items": [
      {
        "skuCode": "483890-COL60-XXL",
        "productName": "亞麻混紡上衣(無袖)",
        "color": "淺藍色",
        "size": "XXL",
        "imageUrl": "img/products/women-483890/col60.jpg",
        "unitPrice": 590,
        "qty": 2,
        "totalPrice": 1180
      }
    ],
    "payments": [
      {
        "merchantTradeNo": "UCMV8RV9C02042",
        "ecpayTradeNo": null,
        "amount": 1112,
        "paymentMethod": "ATM",
        "status": "PENDING",
        "createdAt": "2026-10-14 22:57",
        "paidAt": null
      }
    ]
  },
  {
    "id": 11,
    "orderNo": "UC20261014-2689",
    "memberName": "黃怡婷",
    "memberEmail": "member11@example.com",
    "status": "PENDING",
    "receiverName": "黃怡婷",
    "receiverPhone": "0948-991-119",
    "receiverEmail": "member11@example.com",
    "shippingMethod": "CVS",
    "shippingAddress": "7-ELEVEN 忠孝門市",
    "paymentMethod": "COD",
    "note": "請在下午送達",
    "subtotal": 5150,
    "discount": 100,
    "couponName": "新會員 100 元折價券",
    "shippingFee": 0,
    "total": 5050,
    "paidAt": null,
    "shippedAt": null,
    "completedAt": null,
    "createdAt": "2026-10-14 21:51",
    "items": [
      {
        "skuCode": "486614-COL09-L",
        "productName": "Easy Care柔軟休閒襯衫(長袖)",
        "color": "黑色",
        "size": "L",
        "imageUrl": "img/products/men-486614/col09.jpg",
        "unitPrice": 990,
        "qty": 2,
        "totalPrice": 1980
      },
      {
        "skuCode": "490470-COL54-120CM",
        "productName": "PADDED布勞森外套",
        "color": "綠色",
        "size": "120cm",
        "imageUrl": "img/products/kids-490470/col54.jpg",
        "unitPrice": 1290,
        "qty": 2,
        "totalPrice": 2580
      },
      {
        "skuCode": "486102-COL30-S",
        "productName": "AIRism棉質圓領T恤(長袖)",
        "color": "原色",
        "size": "S",
        "imageUrl": "img/products/men-486102/col30.jpg",
        "unitPrice": 590,
        "qty": 1,
        "totalPrice": 590
      }
    ],
    "payments": []
  },
  {
    "id": 3,
    "orderNo": "UC20261014-2142",
    "memberName": "謝明哲",
    "memberEmail": "member3@example.com",
    "status": "PENDING",
    "receiverName": "謝明哲",
    "receiverPhone": "0945-246-659",
    "receiverEmail": "member3@example.com",
    "shippingMethod": "HOME",
    "shippingAddress": "桃園市中壢區中正路 300 號",
    "paymentMethod": "CREDIT",
    "note": "禮物包裝，不要放價格單",
    "subtotal": 3160,
    "discount": 100,
    "couponName": "新會員 100 元折價券",
    "shippingFee": 0,
    "total": 3060,
    "paidAt": null,
    "shippedAt": null,
    "completedAt": null,
    "createdAt": "2026-10-14 19:03",
    "items": [
      {
        "skuCode": "483890-COL36-M",
        "productName": "亞麻混紡上衣(無袖)",
        "color": "咖啡色",
        "size": "M",
        "imageUrl": "img/products/women-483890/col36.jpg",
        "unitPrice": 590,
        "qty": 2,
        "totalPrice": 1180
      },
      {
        "skuCode": "487511-COL66-L",
        "productName": "DRY-EX防曬連帽外套",
        "color": "藍色",
        "size": "L",
        "imageUrl": "img/products/men-487511/col66.jpg",
        "unitPrice": 990,
        "qty": 2,
        "totalPrice": 1980
      }
    ],
    "payments": [
      {
        "merchantTradeNo": "UCMV1MO0001561",
        "ecpayTradeNo": null,
        "amount": 3060,
        "paymentMethod": "CREDIT",
        "status": "PENDING",
        "createdAt": "2026-10-14 19:05",
        "paidAt": null
      }
    ]
  },
  {
    "id": 15,
    "orderNo": "UC20261014-4162",
    "memberName": "黃怡婷",
    "memberEmail": "member15@example.com",
    "status": "PENDING",
    "receiverName": "謝明哲",
    "receiverPhone": "0982-148-883",
    "receiverEmail": "member15@example.com",
    "shippingMethod": "HOME",
    "shippingAddress": "新北市板橋區文化路一段 25 號",
    "paymentMethod": "CREDIT",
    "note": null,
    "subtotal": 1670,
    "discount": 0,
    "couponName": null,
    "shippingFee": 50,
    "total": 1720,
    "paidAt": "2026-10-14 12:24",
    "shippedAt": null,
    "completedAt": null,
    "createdAt": "2026-10-14 12:21",
    "items": [
      {
        "skuCode": "483890-COL60-S",
        "productName": "亞麻混紡上衣(無袖)",
        "color": "淺藍色",
        "size": "S",
        "imageUrl": "img/products/women-483890/col60.jpg",
        "unitPrice": 590,
        "qty": 1,
        "totalPrice": 590
      },
      {
        "skuCode": "486666-COL10-150CM",
        "productName": "柔軟舒膚針織衫(長袖)(菱格紋)",
        "color": "粉紅色",
        "size": "150cm",
        "imageUrl": "img/products/kids-486666/col10.jpg",
        "unitPrice": 690,
        "qty": 1,
        "totalPrice": 690
      },
      {
        "skuCode": "486658-COL55-130CM",
        "productName": "柔軟針織刷毛圓領T恤(長袖)",
        "color": "綠色",
        "size": "130cm",
        "imageUrl": "img/products/kids-486658/col55.jpg",
        "unitPrice": 390,
        "qty": 1,
        "totalPrice": 390
      }
    ],
    "payments": [
      {
        "merchantTradeNo": "UCMURML1C07844",
        "ecpayTradeNo": "2411217402",
        "amount": 1720,
        "paymentMethod": "CREDIT",
        "status": "PAID",
        "createdAt": "2026-10-14 12:23",
        "paidAt": "2026-10-14 12:24"
      }
    ]
  },
  {
    "id": 2,
    "orderNo": "UC20261014-7113",
    "memberName": "陳美玲",
    "memberEmail": "member2@example.com",
    "status": "PENDING",
    "receiverName": "陳美玲",
    "receiverPhone": "0933-989-985",
    "receiverEmail": "member2@example.com",
    "shippingMethod": "CVS",
    "shippingAddress": "全家 高雄四維店",
    "paymentMethod": "ATM",
    "note": null,
    "subtotal": 4560,
    "discount": 0,
    "couponName": null,
    "shippingFee": 0,
    "total": 4560,
    "paidAt": null,
    "shippedAt": null,
    "completedAt": null,
    "createdAt": "2026-10-14 12:20",
    "items": [
      {
        "skuCode": "490470-COL10-120CM",
        "productName": "PADDED布勞森外套",
        "color": "粉紅色",
        "size": "120cm",
        "imageUrl": "img/products/kids-490470/col10.jpg",
        "unitPrice": 1290,
        "qty": 2,
        "totalPrice": 2580
      },
      {
        "skuCode": "483281-COL09-L",
        "productName": "特級彈性AIRism防曬連帽外套",
        "color": "黑色",
        "size": "L",
        "imageUrl": "img/products/women-483281/col09.jpg",
        "unitPrice": 990,
        "qty": 2,
        "totalPrice": 1980
      }
    ],
    "payments": [
      {
        "merchantTradeNo": "UCMUYRSAO06265",
        "ecpayTradeNo": null,
        "amount": 4560,
        "paymentMethod": "ATM",
        "status": "PENDING",
        "createdAt": "2026-10-14 12:22",
        "paidAt": null
      }
    ]
  },
  {
    "id": 10,
    "orderNo": "UC20261014-1321",
    "memberName": "楊淑惠",
    "memberEmail": "member10@example.com",
    "status": "PENDING",
    "receiverName": "林志豪",
    "receiverPhone": "0931-746-652",
    "receiverEmail": "member10@example.com",
    "shippingMethod": "CVS",
    "shippingAddress": "全家 高雄四維店",
    "paymentMethod": "COD",
    "note": null,
    "subtotal": 1580,
    "discount": 158,
    "couponName": "秋季 9 折券",
    "shippingFee": 50,
    "total": 1472,
    "paidAt": null,
    "shippedAt": null,
    "completedAt": null,
    "createdAt": "2026-10-14 11:13",
    "items": [
      {
        "skuCode": "483281-COL66-XS",
        "productName": "特級彈性AIRism防曬連帽外套",
        "color": "藍色",
        "size": "XS",
        "imageUrl": "img/products/women-483281/col66.jpg",
        "unitPrice": 990,
        "qty": 1,
        "totalPrice": 990
      },
      {
        "skuCode": "483890-COL09-XS",
        "productName": "亞麻混紡上衣(無袖)",
        "color": "黑色",
        "size": "XS",
        "imageUrl": "img/products/women-483890/col09.jpg",
        "unitPrice": 590,
        "qty": 1,
        "totalPrice": 590
      }
    ],
    "payments": []
  },
  {
    "id": 13,
    "orderNo": "UC20261014-6119",
    "memberName": "陳美玲",
    "memberEmail": "member13@example.com",
    "status": "PENDING",
    "receiverName": "陳美玲",
    "receiverPhone": "0913-864-776",
    "receiverEmail": "member13@example.com",
    "shippingMethod": "HOME",
    "shippingAddress": "台中市西屯區台灣大道三段 99 號",
    "paymentMethod": "CREDIT",
    "note": null,
    "subtotal": 8470,
    "discount": 100,
    "couponName": "新會員 100 元折價券",
    "shippingFee": 0,
    "total": 8370,
    "paidAt": "2026-10-14 09:55",
    "shippedAt": null,
    "completedAt": null,
    "createdAt": "2026-10-14 09:52",
    "items": [
      {
        "skuCode": "487855-COL41-XL",
        "productName": "刷毛喀什米爾寬版開襟外套(長袖)",
        "color": "黃色",
        "size": "XL",
        "imageUrl": "img/products/women-487855/col41.jpg",
        "unitPrice": 3990,
        "qty": 2,
        "totalPrice": 7980
      },
      {
        "skuCode": "483406-COL34-150CM",
        "productName": "防潑水輕便短褲",
        "color": "咖啡色",
        "size": "150cm",
        "imageUrl": "img/products/kids-483406/col34.jpg",
        "unitPrice": 490,
        "qty": 1,
        "totalPrice": 490
      }
    ],
    "payments": [
      {
        "merchantTradeNo": "UCMV5WZK008855",
        "ecpayTradeNo": "2415151720",
        "amount": 8370,
        "paymentMethod": "CREDIT",
        "status": "PAID",
        "createdAt": "2026-10-14 09:54",
        "paidAt": "2026-10-14 09:55"
      }
    ]
  },
  {
    "id": 1,
    "orderNo": "UC20261014-4188",
    "memberName": "黃怡婷",
    "memberEmail": "member1@example.com",
    "status": "PENDING",
    "receiverName": "黃怡婷",
    "receiverPhone": "0968-226-921",
    "receiverEmail": "member1@example.com",
    "shippingMethod": "HOME",
    "shippingAddress": "高雄市苓雅區四維三路 6 號 12 樓",
    "paymentMethod": "ATM",
    "note": null,
    "subtotal": 2280,
    "discount": 0,
    "couponName": null,
    "shippingFee": 50,
    "total": 2330,
    "paidAt": null,
    "shippedAt": null,
    "completedAt": null,
    "createdAt": "2026-10-14 07:43",
    "items": [
      {
        "skuCode": "490470-COL54-120CM",
        "productName": "PADDED布勞森外套",
        "color": "綠色",
        "size": "120cm",
        "imageUrl": "img/products/kids-490470/col54.jpg",
        "unitPrice": 1290,
        "qty": 1,
        "totalPrice": 1290
      },
      {
        "skuCode": "486614-COL33-XXL",
        "productName": "Easy Care柔軟休閒襯衫(長袖)",
        "color": "卡其色",
        "size": "XXL",
        "imageUrl": "img/products/men-486614/col33.jpg",
        "unitPrice": 990,
        "qty": 1,
        "totalPrice": 990
      }
    ],
    "payments": [
      {
        "merchantTradeNo": "UCMUT20W009597",
        "ecpayTradeNo": null,
        "amount": 2330,
        "paymentMethod": "ATM",
        "status": "PENDING",
        "createdAt": "2026-10-14 07:45",
        "paidAt": null
      }
    ]
  },
  {
    "id": 8,
    "orderNo": "UC20261014-6026",
    "memberName": "劉雅雯",
    "memberEmail": "member8@example.com",
    "status": "PENDING",
    "receiverName": "劉雅雯",
    "receiverPhone": "0918-590-491",
    "receiverEmail": "member8@example.com",
    "shippingMethod": "CVS",
    "shippingAddress": "全家 台中逢甲店",
    "paymentMethod": "CREDIT",
    "note": null,
    "subtotal": 1580,
    "discount": 0,
    "couponName": null,
    "shippingFee": 50,
    "total": 1630,
    "paidAt": "2026-10-14 03:21",
    "shippedAt": null,
    "completedAt": null,
    "createdAt": "2026-10-14 03:18",
    "items": [
      {
        "skuCode": "486614-COL09-XL",
        "productName": "Easy Care柔軟休閒襯衫(長袖)",
        "color": "黑色",
        "size": "XL",
        "imageUrl": "img/products/men-486614/col09.jpg",
        "unitPrice": 990,
        "qty": 1,
        "totalPrice": 990
      },
      {
        "skuCode": "483890-COL01-S",
        "productName": "亞麻混紡上衣(無袖)",
        "color": "米白色",
        "size": "S",
        "imageUrl": "img/products/women-483890/col01.jpg",
        "unitPrice": 590,
        "qty": 1,
        "totalPrice": 590
      }
    ],
    "payments": [
      {
        "merchantTradeNo": "UCMV0785C06701",
        "ecpayTradeNo": "2411662274",
        "amount": 1630,
        "paymentMethod": "CREDIT",
        "status": "PAID",
        "createdAt": "2026-10-14 03:20",
        "paidAt": "2026-10-14 03:21"
      }
    ]
  },
  {
    "id": 6,
    "orderNo": "UC20261013-3528",
    "memberName": "王小明",
    "memberEmail": "member6@example.com",
    "status": "PENDING",
    "receiverName": "許文傑",
    "receiverPhone": "0999-924-459",
    "receiverEmail": "member6@example.com",
    "shippingMethod": "HOME",
    "shippingAddress": "桃園市中壢區中正路 300 號",
    "paymentMethod": "ATM",
    "note": "禮物包裝，不要放價格單",
    "subtotal": 1180,
    "discount": 0,
    "couponName": null,
    "shippingFee": 50,
    "total": 1230,
    "paidAt": "2026-10-14 01:13",
    "shippedAt": null,
    "completedAt": null,
    "createdAt": "2026-10-13 19:39",
    "items": [
      {
        "skuCode": "488298-COL39-XL",
        "productName": "羅紋連帽上衣(長袖)",
        "color": "深咖啡色",
        "size": "XL",
        "imageUrl": "img/products/women-488298/col39.jpg",
        "unitPrice": 590,
        "qty": 2,
        "totalPrice": 1180
      }
    ],
    "payments": [
      {
        "merchantTradeNo": "UCMUVWWLC05243",
        "ecpayTradeNo": "2411783523",
        "amount": 1230,
        "paymentMethod": "ATM",
        "status": "PAID",
        "createdAt": "2026-10-13 19:41",
        "paidAt": "2026-10-14 01:13"
      }
    ]
  },
  {
    "id": 7,
    "orderNo": "UC20261013-7508",
    "memberName": "王小明",
    "memberEmail": "member7@example.com",
    "status": "PENDING",
    "receiverName": "王小明",
    "receiverPhone": "0949-883-417",
    "receiverEmail": "member7@example.com",
    "shippingMethod": "CVS",
    "shippingAddress": "萊爾富 中壢中正店",
    "paymentMethod": "CREDIT",
    "note": null,
    "subtotal": 1960,
    "discount": 100,
    "couponName": "新會員 100 元折價券",
    "shippingFee": 50,
    "total": 1910,
    "paidAt": "2026-10-13 16:41",
    "shippedAt": null,
    "completedAt": null,
    "createdAt": "2026-10-13 16:38",
    "items": [
      {
        "skuCode": "486658-COL03-140CM",
        "productName": "柔軟針織刷毛圓領T恤(長袖)",
        "color": "灰色",
        "size": "140cm",
        "imageUrl": "img/products/kids-486658/col03.jpg",
        "unitPrice": 390,
        "qty": 2,
        "totalPrice": 780
      },
      {
        "skuCode": "483890-COL60-S",
        "productName": "亞麻混紡上衣(無袖)",
        "color": "淺藍色",
        "size": "S",
        "imageUrl": "img/products/women-483890/col60.jpg",
        "unitPrice": 590,
        "qty": 2,
        "totalPrice": 1180
      }
    ],
    "payments": [
      {
        "merchantTradeNo": "UCMUUHGQO05530",
        "ecpayTradeNo": "2418239979",
        "amount": 1910,
        "paymentMethod": "CREDIT",
        "status": "PAID",
        "createdAt": "2026-10-13 16:40",
        "paidAt": "2026-10-13 16:41"
      }
    ]
  },
  {
    "id": 14,
    "orderNo": "UC20261013-4486",
    "memberName": "張家瑋",
    "memberEmail": "member14@example.com",
    "status": "PENDING",
    "receiverName": "張家瑋",
    "receiverPhone": "0920-942-737",
    "receiverEmail": "member14@example.com",
    "shippingMethod": "CVS",
    "shippingAddress": "萊爾富 中壢中正店",
    "paymentMethod": "COD",
    "note": null,
    "subtotal": 7460,
    "discount": 0,
    "couponName": null,
    "shippingFee": 0,
    "total": 7460,
    "paidAt": null,
    "shippedAt": null,
    "completedAt": null,
    "createdAt": "2026-10-13 04:57",
    "items": [
      {
        "skuCode": "487855-COL78-S",
        "productName": "刷毛喀什米爾寬版開襟外套(長袖)",
        "color": "紫色",
        "size": "S",
        "imageUrl": "img/products/women-487855/col78.jpg",
        "unitPrice": 3990,
        "qty": 1,
        "totalPrice": 3990
      },
      {
        "skuCode": "483406-COL30-160CM",
        "productName": "防潑水輕便短褲",
        "color": "原色",
        "size": "160cm",
        "imageUrl": "img/products/kids-483406/col30.jpg",
        "unitPrice": 490,
        "qty": 1,
        "totalPrice": 490
      },
      {
        "skuCode": "487488-COL09-XL",
        "productName": "美麗諾混紡襯衫式開襟外套",
        "color": "黑色",
        "size": "XL",
        "imageUrl": "img/products/men-487488/col09.jpg",
        "unitPrice": 1490,
        "qty": 2,
        "totalPrice": 2980
      }
    ],
    "payments": []
  },
  {
    "id": 20,
    "orderNo": "UC20261013-6016",
    "memberName": "黃怡婷",
    "memberEmail": "member20@example.com",
    "status": "SHIPPED",
    "receiverName": "黃怡婷",
    "receiverPhone": "0940-778-998",
    "receiverEmail": "member20@example.com",
    "shippingMethod": "CVS",
    "shippingAddress": "全家 台中逢甲店",
    "paymentMethod": "CREDIT",
    "note": null,
    "subtotal": 4940,
    "discount": 0,
    "couponName": null,
    "shippingFee": 0,
    "total": 4940,
    "paidAt": "2026-10-13 02:04",
    "shippedAt": "2026-10-14 06:31",
    "completedAt": null,
    "createdAt": "2026-10-13 02:01",
    "items": [
      {
        "skuCode": "488298-COL03-S",
        "productName": "羅紋連帽上衣(長袖)",
        "color": "灰色",
        "size": "S",
        "imageUrl": "img/products/women-488298/col03.jpg",
        "unitPrice": 590,
        "qty": 2,
        "totalPrice": 1180
      },
      {
        "skuCode": "486102-COL39-3XL",
        "productName": "AIRism棉質圓領T恤(長袖)",
        "color": "深咖啡色",
        "size": "3XL",
        "imageUrl": "img/products/men-486102/col39.jpg",
        "unitPrice": 590,
        "qty": 2,
        "totalPrice": 1180
      },
      {
        "skuCode": "490470-COL31-150CM",
        "productName": "PADDED布勞森外套",
        "color": "米色",
        "size": "150cm",
        "imageUrl": "img/products/kids-490470/col31.jpg",
        "unitPrice": 1290,
        "qty": 2,
        "totalPrice": 2580
      }
    ],
    "payments": [
      {
        "merchantTradeNo": "UCMUT20W009235",
        "ecpayTradeNo": null,
        "amount": 4940,
        "paymentMethod": "CREDIT",
        "status": "FAILED",
        "createdAt": "2026-10-13 02:02",
        "paidAt": null
      },
      {
        "merchantTradeNo": "UCMV4HJPC02928",
        "ecpayTradeNo": "2419454657",
        "amount": 4940,
        "paymentMethod": "CREDIT",
        "status": "PAID",
        "createdAt": "2026-10-13 02:03",
        "paidAt": "2026-10-13 02:04"
      }
    ]
  },
  {
    "id": 19,
    "orderNo": "UC20261012-1779",
    "memberName": "洪俊宏",
    "memberEmail": "member19@example.com",
    "status": "SHIPPED",
    "receiverName": "洪俊宏",
    "receiverPhone": "0959-873-290",
    "receiverEmail": "member19@example.com",
    "shippingMethod": "CVS",
    "shippingAddress": "全家 高雄四維店",
    "paymentMethod": "CREDIT",
    "note": null,
    "subtotal": 3960,
    "discount": 100,
    "couponName": "新會員 100 元折價券",
    "shippingFee": 0,
    "total": 3860,
    "paidAt": "2026-10-12 10:21",
    "shippedAt": "2026-10-13 02:29",
    "completedAt": null,
    "createdAt": "2026-10-12 10:18",
    "items": [
      {
        "skuCode": "486614-COL57-XS",
        "productName": "Easy Care柔軟休閒襯衫(長袖)",
        "color": "橄欖綠",
        "size": "XS",
        "imageUrl": "img/products/men-486614/col57.jpg",
        "unitPrice": 990,
        "qty": 2,
        "totalPrice": 1980
      },
      {
        "skuCode": "486614-COL33-L",
        "productName": "Easy Care柔軟休閒襯衫(長袖)",
        "color": "卡其色",
        "size": "L",
        "imageUrl": "img/products/men-486614/col33.jpg",
        "unitPrice": 990,
        "qty": 2,
        "totalPrice": 1980
      }
    ],
    "payments": [
      {
        "merchantTradeNo": "UCMV5WZK001454",
        "ecpayTradeNo": "2414237906",
        "amount": 3860,
        "paymentMethod": "CREDIT",
        "status": "PAID",
        "createdAt": "2026-10-12 10:20",
        "paidAt": "2026-10-12 10:21"
      }
    ]
  },
  {
    "id": 21,
    "orderNo": "UC20261012-7591",
    "memberName": "劉雅雯",
    "memberEmail": "member21@example.com",
    "status": "SHIPPED",
    "receiverName": "劉雅雯",
    "receiverPhone": "0986-619-952",
    "receiverEmail": "member21@example.com",
    "shippingMethod": "HOME",
    "shippingAddress": "桃園市中壢區中正路 300 號",
    "paymentMethod": "ATM",
    "note": "請在下午送達",
    "subtotal": 1370,
    "discount": 137,
    "couponName": "秋季 9 折券",
    "shippingFee": 50,
    "total": 1283,
    "paidAt": "2026-10-12 08:03",
    "shippedAt": "2026-10-13 10:18",
    "completedAt": null,
    "createdAt": "2026-10-12 01:57",
    "items": [
      {
        "skuCode": "486658-COL01-160CM",
        "productName": "柔軟針織刷毛圓領T恤(長袖)",
        "color": "米白色",
        "size": "160cm",
        "imageUrl": "img/products/kids-486658/col01.jpg",
        "unitPrice": 390,
        "qty": 2,
        "totalPrice": 780
      },
      {
        "skuCode": "483890-COL60-L",
        "productName": "亞麻混紡上衣(無袖)",
        "color": "淺藍色",
        "size": "L",
        "imageUrl": "img/products/women-483890/col60.jpg",
        "unitPrice": 590,
        "qty": 1,
        "totalPrice": 590
      }
    ],
    "payments": [
      {
        "merchantTradeNo": "UCMUUHGQO09995",
        "ecpayTradeNo": "2419538655",
        "amount": 1283,
        "paymentMethod": "ATM",
        "status": "PAID",
        "createdAt": "2026-10-12 01:59",
        "paidAt": "2026-10-12 08:03"
      }
    ]
  },
  {
    "id": 29,
    "orderNo": "UC20261011-1313",
    "memberName": "洪俊宏",
    "memberEmail": "member29@example.com",
    "status": "CANCELLED",
    "receiverName": "洪俊宏",
    "receiverPhone": "0923-436-126",
    "receiverEmail": "member29@example.com",
    "shippingMethod": "CVS",
    "shippingAddress": "萊爾富 中壢中正店",
    "paymentMethod": "CREDIT",
    "note": null,
    "subtotal": 1180,
    "discount": 0,
    "couponName": null,
    "shippingFee": 50,
    "total": 1230,
    "paidAt": null,
    "shippedAt": null,
    "completedAt": null,
    "createdAt": "2026-10-11 04:07",
    "items": [
      {
        "skuCode": "486102-COL16-XL",
        "productName": "AIRism棉質圓領T恤(長袖)",
        "color": "紅色",
        "size": "XL",
        "imageUrl": "img/products/men-486102/col16.jpg",
        "unitPrice": 590,
        "qty": 2,
        "totalPrice": 1180
      }
    ],
    "payments": [
      {
        "merchantTradeNo": "UCMUORPC002851",
        "ecpayTradeNo": null,
        "amount": 1230,
        "paymentMethod": "CREDIT",
        "status": "CANCELLED",
        "createdAt": "2026-10-11 04:09",
        "paidAt": null
      }
    ]
  },
  {
    "id": 16,
    "orderNo": "UC20261010-5296",
    "memberName": "劉雅雯",
    "memberEmail": "member16@example.com",
    "status": "SHIPPED",
    "receiverName": "劉雅雯",
    "receiverPhone": "0926-862-222",
    "receiverEmail": "member16@example.com",
    "shippingMethod": "CVS",
    "shippingAddress": "全家 高雄四維店",
    "paymentMethod": "COD",
    "note": null,
    "subtotal": 2580,
    "discount": 0,
    "couponName": null,
    "shippingFee": 0,
    "total": 2580,
    "paidAt": null,
    "shippedAt": "2026-10-11 05:02",
    "completedAt": null,
    "createdAt": "2026-10-10 13:39",
    "items": [
      {
        "skuCode": "490470-COL10-120CM",
        "productName": "PADDED布勞森外套",
        "color": "粉紅色",
        "size": "120cm",
        "imageUrl": "img/products/kids-490470/col10.jpg",
        "unitPrice": 1290,
        "qty": 1,
        "totalPrice": 1290
      },
      {
        "skuCode": "490470-COL54-160CM",
        "productName": "PADDED布勞森外套",
        "color": "綠色",
        "size": "160cm",
        "imageUrl": "img/products/kids-490470/col54.jpg",
        "unitPrice": 1290,
        "qty": 1,
        "totalPrice": 1290
      }
    ],
    "payments": []
  },
  {
    "id": 18,
    "orderNo": "UC20261010-2842",
    "memberName": "陳美玲",
    "memberEmail": "member18@example.com",
    "status": "SHIPPED",
    "receiverName": "陳美玲",
    "receiverPhone": "0992-976-661",
    "receiverEmail": "member18@example.com",
    "shippingMethod": "HOME",
    "shippingAddress": "台中市西屯區台灣大道三段 99 號",
    "paymentMethod": "COD",
    "note": null,
    "subtotal": 1180,
    "discount": 0,
    "couponName": null,
    "shippingFee": 50,
    "total": 1230,
    "paidAt": null,
    "shippedAt": "2026-10-11 07:13",
    "completedAt": null,
    "createdAt": "2026-10-10 07:44",
    "items": [
      {
        "skuCode": "486102-COL70-XL",
        "productName": "AIRism棉質圓領T恤(長袖)",
        "color": "淺紫色",
        "size": "XL",
        "imageUrl": "img/products/men-486102/col70.jpg",
        "unitPrice": 590,
        "qty": 2,
        "totalPrice": 1180
      }
    ],
    "payments": []
  },
  {
    "id": 17,
    "orderNo": "UC20261010-2927",
    "memberName": "張家瑋",
    "memberEmail": "member17@example.com",
    "status": "SHIPPED",
    "receiverName": "張家瑋",
    "receiverPhone": "0948-412-978",
    "receiverEmail": "member17@example.com",
    "shippingMethod": "CVS",
    "shippingAddress": "全家 台中逢甲店",
    "paymentMethod": "CREDIT",
    "note": null,
    "subtotal": 2360,
    "discount": 0,
    "couponName": null,
    "shippingFee": 50,
    "total": 2410,
    "paidAt": "2026-10-10 04:53",
    "shippedAt": "2026-10-11 09:45",
    "completedAt": null,
    "createdAt": "2026-10-10 04:50",
    "items": [
      {
        "skuCode": "483890-COL60-3XL",
        "productName": "亞麻混紡上衣(無袖)",
        "color": "淺藍色",
        "size": "3XL",
        "imageUrl": "img/products/women-483890/col60.jpg",
        "unitPrice": 590,
        "qty": 2,
        "totalPrice": 1180
      },
      {
        "skuCode": "483890-COL36-3XL",
        "productName": "亞麻混紡上衣(無袖)",
        "color": "咖啡色",
        "size": "3XL",
        "imageUrl": "img/products/women-483890/col36.jpg",
        "unitPrice": 590,
        "qty": 2,
        "totalPrice": 1180
      }
    ],
    "payments": [
      {
        "merchantTradeNo": "UCMV1MO0008293",
        "ecpayTradeNo": null,
        "amount": 2410,
        "paymentMethod": "CREDIT",
        "status": "FAILED",
        "createdAt": "2026-10-10 04:51",
        "paidAt": null
      },
      {
        "merchantTradeNo": "UCMUYRSAO09225",
        "ecpayTradeNo": "2411790564",
        "amount": 2410,
        "paymentMethod": "CREDIT",
        "status": "PAID",
        "createdAt": "2026-10-10 04:52",
        "paidAt": "2026-10-10 04:53"
      }
    ]
  },
  {
    "id": 30,
    "orderNo": "UC20261007-9010",
    "memberName": "李佳穎",
    "memberEmail": "member30@example.com",
    "status": "CANCELLED",
    "receiverName": "李佳穎",
    "receiverPhone": "0960-553-618",
    "receiverEmail": "member30@example.com",
    "shippingMethod": "CVS",
    "shippingAddress": "7-ELEVEN 板新門市",
    "paymentMethod": "CREDIT",
    "note": null,
    "subtotal": 4050,
    "discount": 0,
    "couponName": null,
    "shippingFee": 0,
    "total": 4050,
    "paidAt": "2026-10-07 20:22",
    "shippedAt": null,
    "completedAt": null,
    "createdAt": "2026-10-07 20:19",
    "items": [
      {
        "skuCode": "486666-COL69-140CM",
        "productName": "柔軟舒膚針織衫(長袖)(菱格紋)",
        "color": "藏青色",
        "size": "140cm",
        "imageUrl": "img/products/kids-486666/col69.jpg",
        "unitPrice": 690,
        "qty": 2,
        "totalPrice": 1380
      },
      {
        "skuCode": "486102-COL08-XL",
        "productName": "AIRism棉質圓領T恤(長袖)",
        "color": "深灰色",
        "size": "XL",
        "imageUrl": "img/products/men-486102/col08.jpg",
        "unitPrice": 590,
        "qty": 2,
        "totalPrice": 1180
      },
      {
        "skuCode": "487488-COL69-XS",
        "productName": "美麗諾混紡襯衫式開襟外套",
        "color": "藏青色",
        "size": "XS",
        "imageUrl": "img/products/men-487488/col69.jpg",
        "unitPrice": 1490,
        "qty": 1,
        "totalPrice": 1490
      }
    ],
    "payments": [
      {
        "merchantTradeNo": "UCMUXCCG006364",
        "ecpayTradeNo": "2418908524",
        "amount": 4050,
        "paymentMethod": "CREDIT",
        "status": "PAID",
        "createdAt": "2026-10-07 20:21",
        "paidAt": "2026-10-07 20:22"
      }
    ]
  },
  {
    "id": 23,
    "orderNo": "UC20261006-8935",
    "memberName": "林志豪",
    "memberEmail": "member23@example.com",
    "status": "DELIVERED",
    "receiverName": "黃怡婷",
    "receiverPhone": "0915-781-862",
    "receiverEmail": "member23@example.com",
    "shippingMethod": "HOME",
    "shippingAddress": "台北市大安區忠孝東路四段 100 號 5 樓",
    "paymentMethod": "CREDIT",
    "note": null,
    "subtotal": 4340,
    "discount": 0,
    "couponName": null,
    "shippingFee": 0,
    "total": 4340,
    "paidAt": "2026-10-06 02:40",
    "shippedAt": "2026-10-06 19:49",
    "completedAt": "2026-10-09 05:16",
    "createdAt": "2026-10-06 02:37",
    "items": [
      {
        "skuCode": "486614-COL33-XXL",
        "productName": "Easy Care柔軟休閒襯衫(長袖)",
        "color": "卡其色",
        "size": "XXL",
        "imageUrl": "img/products/men-486614/col33.jpg",
        "unitPrice": 990,
        "qty": 2,
        "totalPrice": 1980
      },
      {
        "skuCode": "486102-COL68-S",
        "productName": "AIRism棉質圓領T恤(長袖)",
        "color": "藍色",
        "size": "S",
        "imageUrl": "img/products/men-486102/col68.jpg",
        "unitPrice": 590,
        "qty": 2,
        "totalPrice": 1180
      },
      {
        "skuCode": "486102-COL00-XXL",
        "productName": "AIRism棉質圓領T恤(長袖)",
        "color": "白色",
        "size": "XXL",
        "imageUrl": "img/products/men-486102/col00.jpg",
        "unitPrice": 590,
        "qty": 2,
        "totalPrice": 1180
      }
    ],
    "payments": [
      {
        "merchantTradeNo": "UCMV5WZK008521",
        "ecpayTradeNo": "2413970866",
        "amount": 4340,
        "paymentMethod": "CREDIT",
        "status": "PAID",
        "createdAt": "2026-10-06 02:39",
        "paidAt": "2026-10-06 02:40"
      }
    ]
  },
  {
    "id": 24,
    "orderNo": "UC20261004-1374",
    "memberName": "陳美玲",
    "memberEmail": "member24@example.com",
    "status": "DELIVERED",
    "receiverName": "陳美玲",
    "receiverPhone": "0972-469-875",
    "receiverEmail": "member24@example.com",
    "shippingMethod": "HOME",
    "shippingAddress": "台中市西屯區台灣大道三段 99 號",
    "paymentMethod": "ATM",
    "note": "管理室代收即可",
    "subtotal": 1490,
    "discount": 0,
    "couponName": null,
    "shippingFee": 50,
    "total": 1540,
    "paidAt": "2026-10-04 14:08",
    "shippedAt": "2026-10-05 10:15",
    "completedAt": "2026-10-06 09:24",
    "createdAt": "2026-10-04 04:14",
    "items": [
      {
        "skuCode": "487488-COL57-L",
        "productName": "美麗諾混紡襯衫式開襟外套",
        "color": "橄欖綠",
        "size": "L",
        "imageUrl": "img/products/men-487488/col57.jpg",
        "unitPrice": 1490,
        "qty": 1,
        "totalPrice": 1490
      }
    ],
    "payments": [
      {
        "merchantTradeNo": "UCMV4HJPC09404",
        "ecpayTradeNo": "2416555514",
        "amount": 1540,
        "paymentMethod": "ATM",
        "status": "PAID",
        "createdAt": "2026-10-04 04:16",
        "paidAt": "2026-10-04 14:08"
      }
    ]
  },
  {
    "id": 25,
    "orderNo": "UC20261003-2489",
    "memberName": "王小明",
    "memberEmail": "member25@example.com",
    "status": "PICKED_UP",
    "receiverName": "王小明",
    "receiverPhone": "0916-190-550",
    "receiverEmail": "member25@example.com",
    "shippingMethod": "CVS",
    "shippingAddress": "萊爾富 中壢中正店",
    "paymentMethod": "ATM",
    "note": null,
    "subtotal": 4960,
    "discount": 496,
    "couponName": "秋季 9 折券",
    "shippingFee": 0,
    "total": 4464,
    "paidAt": "2026-10-03 21:09",
    "shippedAt": "2026-10-04 16:00",
    "completedAt": "2026-10-06 20:49",
    "createdAt": "2026-10-03 19:21",
    "items": [
      {
        "skuCode": "487488-COL57-M",
        "productName": "美麗諾混紡襯衫式開襟外套",
        "color": "橄欖綠",
        "size": "M",
        "imageUrl": "img/products/men-487488/col57.jpg",
        "unitPrice": 1490,
        "qty": 2,
        "totalPrice": 2980
      },
      {
        "skuCode": "486614-COL09-L",
        "productName": "Easy Care柔軟休閒襯衫(長袖)",
        "color": "黑色",
        "size": "L",
        "imageUrl": "img/products/men-486614/col09.jpg",
        "unitPrice": 990,
        "qty": 2,
        "totalPrice": 1980
      }
    ],
    "payments": [
      {
        "merchantTradeNo": "UCMURML1C03758",
        "ecpayTradeNo": "2418110954",
        "amount": 4464,
        "paymentMethod": "ATM",
        "status": "PAID",
        "createdAt": "2026-10-03 19:23",
        "paidAt": "2026-10-03 21:09"
      }
    ]
  },
  {
    "id": 27,
    "orderNo": "UC20261003-9281",
    "memberName": "黃怡婷",
    "memberEmail": "member27@example.com",
    "status": "PICKED_UP",
    "receiverName": "黃怡婷",
    "receiverPhone": "0920-486-235",
    "receiverEmail": "member27@example.com",
    "shippingMethod": "CVS",
    "shippingAddress": "全家 高雄四維店",
    "paymentMethod": "CREDIT",
    "note": null,
    "subtotal": 3270,
    "discount": 0,
    "couponName": null,
    "shippingFee": 0,
    "total": 3270,
    "paidAt": "2026-10-03 06:20",
    "shippedAt": "2026-10-04 13:40",
    "completedAt": "2026-10-06 13:47",
    "createdAt": "2026-10-03 06:17",
    "items": [
      {
        "skuCode": "490470-COL31-150CM",
        "productName": "PADDED布勞森外套",
        "color": "米色",
        "size": "150cm",
        "imageUrl": "img/products/kids-490470/col31.jpg",
        "unitPrice": 1290,
        "qty": 2,
        "totalPrice": 2580
      },
      {
        "skuCode": "486666-COL10-150CM",
        "productName": "柔軟舒膚針織衫(長袖)(菱格紋)",
        "color": "粉紅色",
        "size": "150cm",
        "imageUrl": "img/products/kids-486666/col10.jpg",
        "unitPrice": 690,
        "qty": 1,
        "totalPrice": 690
      }
    ],
    "payments": [
      {
        "merchantTradeNo": "UCMV5WZK005856",
        "ecpayTradeNo": null,
        "amount": 3270,
        "paymentMethod": "CREDIT",
        "status": "FAILED",
        "createdAt": "2026-10-03 06:18",
        "paidAt": null
      },
      {
        "merchantTradeNo": "UCMV1MO0004748",
        "ecpayTradeNo": "2418933272",
        "amount": 3270,
        "paymentMethod": "CREDIT",
        "status": "PAID",
        "createdAt": "2026-10-03 06:19",
        "paidAt": "2026-10-03 06:20"
      }
    ]
  },
  {
    "id": 22,
    "orderNo": "UC20261003-7566",
    "memberName": "林志豪",
    "memberEmail": "member22@example.com",
    "status": "PICKED_UP",
    "receiverName": "林志豪",
    "receiverPhone": "0975-660-701",
    "receiverEmail": "member22@example.com",
    "shippingMethod": "CVS",
    "shippingAddress": "7-ELEVEN 忠孝門市",
    "paymentMethod": "COD",
    "note": null,
    "subtotal": 990,
    "discount": 0,
    "couponName": null,
    "shippingFee": 50,
    "total": 1040,
    "paidAt": "2026-10-05 20:02",
    "shippedAt": "2026-10-04 10:04",
    "completedAt": "2026-10-05 20:02",
    "createdAt": "2026-10-03 06:05",
    "items": [
      {
        "skuCode": "486614-COL09-M",
        "productName": "Easy Care柔軟休閒襯衫(長袖)",
        "color": "黑色",
        "size": "M",
        "imageUrl": "img/products/men-486614/col09.jpg",
        "unitPrice": 990,
        "qty": 1,
        "totalPrice": 990
      }
    ],
    "payments": []
  },
  {
    "id": 28,
    "orderNo": "UC20261002-7707",
    "memberName": "蔡宗翰",
    "memberEmail": "member28@example.com",
    "status": "PICKED_UP",
    "receiverName": "謝明哲",
    "receiverPhone": "0932-499-389",
    "receiverEmail": "member28@example.com",
    "shippingMethod": "CVS",
    "shippingAddress": "7-ELEVEN 板新門市",
    "paymentMethod": "CREDIT",
    "note": null,
    "subtotal": 3160,
    "discount": 0,
    "couponName": null,
    "shippingFee": 0,
    "total": 3160,
    "paidAt": "2026-10-02 23:57",
    "shippedAt": "2026-10-04 02:42",
    "completedAt": "2026-10-06 06:50",
    "createdAt": "2026-10-02 23:54",
    "items": [
      {
        "skuCode": "486102-COL08-L",
        "productName": "AIRism棉質圓領T恤(長袖)",
        "color": "深灰色",
        "size": "L",
        "imageUrl": "img/products/men-486102/col08.jpg",
        "unitPrice": 590,
        "qty": 2,
        "totalPrice": 1180
      },
      {
        "skuCode": "483281-COL09-L",
        "productName": "特級彈性AIRism防曬連帽外套",
        "color": "黑色",
        "size": "L",
        "imageUrl": "img/products/women-483281/col09.jpg",
        "unitPrice": 990,
        "qty": 2,
        "totalPrice": 1980
      }
    ],
    "payments": [
      {
        "merchantTradeNo": "UCMV8RV9C08096",
        "ecpayTradeNo": "2410611506",
        "amount": 3160,
        "paymentMethod": "CREDIT",
        "status": "PAID",
        "createdAt": "2026-10-02 23:56",
        "paidAt": "2026-10-02 23:57"
      }
    ]
  },
  {
    "id": 26,
    "orderNo": "UC20261002-2186",
    "memberName": "蔡宗翰",
    "memberEmail": "member26@example.com",
    "status": "DELIVERED",
    "receiverName": "蔡宗翰",
    "receiverPhone": "0981-549-822",
    "receiverEmail": "member26@example.com",
    "shippingMethod": "HOME",
    "shippingAddress": "桃園市中壢區中正路 300 號",
    "paymentMethod": "CREDIT",
    "note": null,
    "subtotal": 3970,
    "discount": 0,
    "couponName": null,
    "shippingFee": 0,
    "total": 3970,
    "paidAt": "2026-10-02 16:47",
    "shippedAt": "2026-10-03 20:52",
    "completedAt": "2026-10-05 04:18",
    "createdAt": "2026-10-02 16:44",
    "items": [
      {
        "skuCode": "487488-COL69-L",
        "productName": "美麗諾混紡襯衫式開襟外套",
        "color": "藏青色",
        "size": "L",
        "imageUrl": "img/products/men-487488/col69.jpg",
        "unitPrice": 1490,
        "qty": 2,
        "totalPrice": 2980
      },
      {
        "skuCode": "487511-COL01-L",
        "productName": "DRY-EX防曬連帽外套",
        "color": "米白色",
        "size": "L",
        "imageUrl": "img/products/men-487511/col01.jpg",
        "unitPrice": 990,
        "qty": 1,
        "totalPrice": 990
      }
    ],
    "payments": [
      {
        "merchantTradeNo": "UCMUORPC006273",
        "ecpayTradeNo": "2414133646",
        "amount": 3970,
        "paymentMethod": "CREDIT",
        "status": "PAID",
        "createdAt": "2026-10-02 16:46",
        "paidAt": "2026-10-02 16:47"
      }
    ]
  }
];
