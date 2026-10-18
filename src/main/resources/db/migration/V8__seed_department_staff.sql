-- ============================================================================
-- V8：每個部門各一個測試員工帳號（ADMIN 已經有 V5 的 sys01）
--   密碼都是 "Test1234"，password_hash 跟 V5 的 sys01 一樣
-- ============================================================================

INSERT INTO staff (account, password_hash, name, department)
VALUES
    (N'product01', N'$2a$10$GAymusEV9KVVrW5077/ZS.tuG/io1aQzHMM.Gmo5ALjiH0Hin3ttO', N'商品部測試員',   N'PRODUCT'),
    (N'order01',   N'$2a$10$GAymusEV9KVVrW5077/ZS.tuG/io1aQzHMM.Gmo5ALjiH0Hin3ttO', N'訂單物流測試員', N'ORDER'),
    (N'cs01',      N'$2a$10$GAymusEV9KVVrW5077/ZS.tuG/io1aQzHMM.Gmo5ALjiH0Hin3ttO', N'客服測試員',     N'CS'),
    (N'mkt01',     N'$2a$10$GAymusEV9KVVrW5077/ZS.tuG/io1aQzHMM.Gmo5ALjiH0Hin3ttO', N'行銷測試員',     N'MKT');
