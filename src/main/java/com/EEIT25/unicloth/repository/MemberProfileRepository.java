package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.MemberProfile;
import org.springframework.data.jpa.repository.JpaRepository;

// 主鍵是會員 id，findById(memberId) 就是查這個會員的個人資料
public interface MemberProfileRepository extends JpaRepository<MemberProfile, Long> {
}
