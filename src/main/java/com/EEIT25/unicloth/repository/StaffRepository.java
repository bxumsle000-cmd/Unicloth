package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.dto.admin.staff.StaffResponse;
import com.EEIT25.unicloth.entity.Staff;
import com.EEIT25.unicloth.enums.staff.Department;
import com.EEIT25.unicloth.enums.staff.StaffStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface StaffRepository extends JpaRepository<Staff, Long> {

    // 後台登入用：用帳號查員工
    Optional<Staff> findByAccount(String account);

    // 新增員工用：檢查帳號是否已被使用
    boolean existsByAccount(String account);

    /**
     * 員工列表 + 篩選（分頁）。每個條件都是「沒帶就不篩」：參數是 null → (NULL IS NULL OR …) 永遠成立<br>
     * - keyword：帳號或姓名包含關鍵字，不分大小寫<br>
     * - department / status：完全相等
     */
    @Query("""
            SELECT s FROM Staff s
            WHERE (:keyword IS NULL
                    OR LOWER(s.account) LIKE LOWER(CONCAT('%',:keyword,'%'))
                    OR LOWER(s.name) LIKE LOWER(CONCAT('%',:keyword,'%')))
                AND (:department IS NULL OR s.department = :department)
                AND (:status IS NULL OR s.status = :status)
            """)
    Page<StaffResponse> findByFilter(String keyword, Department department, StaffStatus status, Pageable pageable);

}
