package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {

    // 登入用：email 存的是小寫，查之前記得先 toLowerCase()
    Optional<Member> findByEmail(String email);

    // 註冊用：檢查 email 是否已被使用
    boolean existsByEmail(String email);
}
