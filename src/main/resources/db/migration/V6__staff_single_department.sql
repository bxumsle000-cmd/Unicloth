-- ============================================================================
-- V6：一個員工只屬於一個部門
--   部門直接放在 staff.department，不再需要 staff_departments 這張對應表
-- ============================================================================

ALTER TABLE staff ADD department NVARCHAR(20) NULL;   -- PRODUCT / ORDER / CS / MKT / SYS
GO

-- 把原本的部門搬過來；萬一有人屬於多個部門，取字母順序第一個
UPDATE staff
SET department = (SELECT MIN(d.department) FROM staff_departments d WHERE d.staff_id = staff.id);

-- 理論上不會有沒部門的員工；萬一有，先隨便給一個部門並停用帳號，等系統管理員之後補設
UPDATE staff SET department = N'PRODUCT', status = N'DISABLED' WHERE department IS NULL;

ALTER TABLE staff ALTER COLUMN department NVARCHAR(20) NOT NULL;

DROP TABLE staff_departments;
