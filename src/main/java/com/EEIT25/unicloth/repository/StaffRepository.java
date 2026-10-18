package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StaffRepository extends JpaRepository<Staff, Long> {

    // 後台登入用：用帳號查員工
    Optional<Staff> findByAccount(String account);

    // 新增員工用：檢查帳號是否已被使用
    boolean existsByAccount(String account);
}
