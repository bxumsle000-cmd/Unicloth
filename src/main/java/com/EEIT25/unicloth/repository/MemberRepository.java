package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.dto.coupon.IssueMemberResponse;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.enums.MemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {

    // Google 登入用：同一個 email 已有帳號時，把 Firebase uid 綁上去
    Optional<Member> findByEmail(String email);

    // Google 登入用：用 Firebase uid 查會員
    Optional<Member> findByFirebaseUid(String firebaseUid);

    // 後台發券給全部會員：只發給 ACTIVE 的
    List<Member> findByStatus(MemberStatus status);

    // 後台發券給指定會員：只發給 ACTIVE 的
    List<Member> findByIdInAndStatus(Collection<Long> ids, MemberStatus status);

    // 後台發券選會員用：某個狀態的會員連同姓名（members 和 member_profiles 沒有 JPA 關聯，所以用 left join ... on 接；沒補填資料的姓名是 null）
    @Query("""
            select new com.EEIT25.unicloth.dto.coupon.IssueMemberResponse(m.id, p.name, m.email)
            from Member m
            left join MemberProfile p on p.memberId = m.id
            where m.status = :status
            order by m.id
            """)
    List<IssueMemberResponse> findIssueMembers(@Param("status") MemberStatus status);

    // 生日禮自動發送用：某個月份生日、某個狀態的會員（生日在 member_profiles，沒補填資料的會員不會被查到）
    @Query("""
            select m from Member m
            join MemberProfile p on p.memberId = m.id
            where month(p.birthday) = :month
              and m.status = :status
            order by m.id
            """)
    List<Member> findByBirthdayMonthAndStatus(@Param("month") int month, @Param("status") MemberStatus status);
}
