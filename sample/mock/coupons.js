// 行銷後台的假資料，欄位對照 entity/Coupon.java、entity/MemberCoupon.java，之後換成呼叫後端 API

// 折價券範本（coupons 資料表）
// autoTrigger 是自動發送時機（SIGNUP 註冊禮／BIRTHDAY 生日禮／FIRST_ORDER 首購禮／INACTIVE 久未購買），null 代表只能手動發
// inactiveDays 只有 INACTIVE 用得到：超過幾天沒下單
window.MOCK_COUPONS = [
  { id: 1, code: 'WELCOME100', title: '新會員 100 元折價券', type: 'AMOUNT',  value: 100, minSubtotal: 990,  validDays: 30, autoTrigger: 'SIGNUP',     inactiveDays: null, active: true,  createdAt: '2026-09-01 10:00' },
  { id: 2, code: 'SAVE10',     title: '全館 9 折券',         type: 'PERCENT', value: 10,  minSubtotal: 1490, validDays: 14, autoTrigger: null,         inactiveDays: null, active: true,  createdAt: '2026-09-20 14:30' },
  { id: 3, code: 'AUTUMN200',  title: '秋季滿 2000 折 200',  type: 'AMOUNT',  value: 200, minSubtotal: 2000, validDays: 7,  autoTrigger: null,         inactiveDays: null, active: true,  createdAt: '2026-10-05 09:15' },
  { id: 4, code: 'SUMMER15',   title: '夏季 85 折券',        type: 'PERCENT', value: 15,  minSubtotal: 1990, validDays: 10, autoTrigger: null,         inactiveDays: null, active: false, createdAt: '2026-07-01 11:00' },
  { id: 5, code: 'BDAY150',    title: '生日禮 150 元折價券', type: 'AMOUNT',  value: 150, minSubtotal: 990,  validDays: 31, autoTrigger: 'BIRTHDAY',   inactiveDays: null, active: true,  createdAt: '2026-09-01 10:05' },
  { id: 6, code: 'COMEBACK',   title: '好久不見 85 折券',    type: 'PERCENT', value: 15,  minSubtotal: 990,  validDays: 14, autoTrigger: 'INACTIVE',   inactiveDays: 90,   active: true,  createdAt: '2026-09-15 16:00' },
];

// 會員（發券時用來挑對象）
window.MOCK_MEMBERS = [
  { id: 1, name: '王小明', email: 'ming@example.com' },
  { id: 2, name: '陳美玲', email: 'meiling@example.com' },
  { id: 3, name: '張家瑋', email: 'chiawei@example.com' },
  { id: 4, name: '林欣怡', email: 'hsinyi@example.com' },
  { id: 5, name: '黃柏翰', email: 'pohan@example.com' },
];

// 預約發券（新資料表）
// targetAll 是 true 代表發給全部會員（發送當下再決定是哪些人），否則看 memberIds
// status：PENDING 等待中／SENT 已發送／FAILED 時間到但沒發出（例如券已停用）／CANCELLED 已取消
window.MOCK_COUPON_SCHEDULES = [
  { id: 1, couponId: 2, targetAll: false, memberIds: [1, 2, 3], scheduledAt: '2026-09-20 15:00', createdBy: 'mkt01',   createdAt: '2026-09-18 10:20', status: 'SENT',      sentAt: '2026-09-20 15:00', sentCount: 3 },
  { id: 2, couponId: 4, targetAll: true,  memberIds: [],        scheduledAt: '2026-08-01 10:00', createdBy: 'mkt01',   createdAt: '2026-07-25 14:00', status: 'FAILED',    sentAt: null, sentCount: 0, failReason: '券已停用，沒有發出' },
  { id: 3, couponId: 3, targetAll: false, memberIds: [2, 3],    scheduledAt: '2026-10-10 09:00', createdBy: 'multi01', createdAt: '2026-10-06 11:30', status: 'CANCELLED', sentAt: null, sentCount: 0 },
  { id: 4, couponId: 3, targetAll: true,  memberIds: [],        scheduledAt: '2026-11-01 00:00', createdBy: 'mkt01',   createdAt: '2026-10-20 16:45', status: 'PENDING',   sentAt: null, sentCount: 0 },
  { id: 5, couponId: 2, targetAll: false, memberIds: [4, 5],    scheduledAt: '2026-11-11 11:00', createdBy: 'mkt01',   createdAt: '2026-10-21 09:10', status: 'PENDING',   sentAt: null, sentCount: 0 },
];

// 會員持有的券（member_coupons 資料表）
// source 是這張券怎麼來的：MANUAL（後台手動發）或折價券的 autoTrigger
// usedAt 有值代表用掉了，orderNo / orderDiscount 是那筆訂單的編號和 Order.discount
window.MOCK_MEMBER_COUPONS = [
  { id: 1,  couponId: 1, memberId: 1, source: 'SIGNUP',   receivedAt: '2026-09-02 12:00', expireAt: '2026-10-02 12:00', usedAt: '2026-09-10 20:11', orderNo: 'UC20260910-1182', orderDiscount: 100 },
  { id: 2,  couponId: 1, memberId: 2, source: 'SIGNUP',   receivedAt: '2026-09-05 08:30', expireAt: '2026-10-05 08:30', usedAt: null,               orderNo: null,              orderDiscount: 0 },
  { id: 3,  couponId: 1, memberId: 3, source: 'SIGNUP',   receivedAt: '2026-09-18 19:45', expireAt: '2026-10-18 19:45', usedAt: '2026-09-25 13:02', orderNo: 'UC20260925-2051', orderDiscount: 100 },
  { id: 4,  couponId: 1, memberId: 4, source: 'SIGNUP',   receivedAt: '2026-10-01 10:10', expireAt: '2026-10-31 10:10', usedAt: null,               orderNo: null,              orderDiscount: 0 },
  { id: 5,  couponId: 1, memberId: 5, source: 'SIGNUP',   receivedAt: '2026-10-12 16:20', expireAt: '2026-11-11 16:20', usedAt: '2026-10-15 21:40', orderNo: 'UC20261015-3037', orderDiscount: 100 },
  { id: 6,  couponId: 2, memberId: 1, source: 'MANUAL',   receivedAt: '2026-09-20 15:00', expireAt: '2026-10-04 15:00', usedAt: '2026-09-28 11:22', orderNo: 'UC20260928-1420', orderDiscount: 249 },
  { id: 7,  couponId: 2, memberId: 2, source: 'MANUAL',   receivedAt: '2026-09-20 15:00', expireAt: '2026-10-04 15:00', usedAt: null,               orderNo: null,              orderDiscount: 0 },
  { id: 8,  couponId: 2, memberId: 3, source: 'MANUAL',   receivedAt: '2026-09-20 15:00', expireAt: '2026-10-04 15:00', usedAt: '2026-10-01 09:50', orderNo: 'UC20261001-0977', orderDiscount: 399 },
  { id: 9,  couponId: 3, memberId: 4, source: 'MANUAL',   receivedAt: '2026-10-05 09:30', expireAt: '2026-10-12 09:30', usedAt: '2026-10-08 18:05', orderNo: 'UC20261008-2265', orderDiscount: 200 },
  { id: 10, couponId: 3, memberId: 5, source: 'MANUAL',   receivedAt: '2026-10-05 09:30', expireAt: '2026-10-12 09:30', usedAt: null,               orderNo: null,              orderDiscount: 0 },
  { id: 11, couponId: 4, memberId: 1, source: 'MANUAL',   receivedAt: '2026-07-01 11:30', expireAt: '2026-07-11 11:30', usedAt: '2026-07-05 14:00', orderNo: 'UC20260705-0318', orderDiscount: 435 },
  { id: 12, couponId: 5, memberId: 2, source: 'BIRTHDAY', receivedAt: '2026-09-01 00:00', expireAt: '2026-10-02 00:00', usedAt: '2026-09-14 19:30', orderNo: 'UC20260914-1733', orderDiscount: 150 },
  { id: 13, couponId: 5, memberId: 4, source: 'BIRTHDAY', receivedAt: '2026-10-01 00:00', expireAt: '2026-11-01 00:00', usedAt: null,               orderNo: null,              orderDiscount: 0 },
];
