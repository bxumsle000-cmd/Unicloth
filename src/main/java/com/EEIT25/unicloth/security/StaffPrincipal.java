package com.EEIT25.unicloth.security;

import com.EEIT25.unicloth.enums.staff.Department;

/**
 * 員工登入後放在 SecurityContext 裡的身分（principal）。
 * <p>
 * 會員的 principal 是 {@code Long}（會員 id），員工故意用另一個型別：
 * {@link CurrentMember} 和 SecurityConfig 都是用 {@code principal instanceof Long} 判斷「這是會員」，
 * 員工 id 不是 Long，就不會被誤認成同一個 id 的會員，去動到那個會員的購物車、訂單。
 *
 * @param staffId    員工 id
 * @param department 登入當下所屬的部門（從 token 讀出來）
 */
public record StaffPrincipal(Long staffId, Department department) {
}
