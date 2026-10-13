package com.EEIT25.unicloth.entity;

import com.EEIT25.unicloth.enums.MemberStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 會員帳號（登入用）
 * 姓名、電話等個人資料在 {@link MemberProfile}
 */
@Entity
@Table(name = "members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 登入帳號
    @Column(nullable = false, unique = true)
    private String email;

    // BCrypt 雜湊，絕對不存明碼
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    // 存成大寫字串，例如 ACTIVE
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MemberStatus status = MemberStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
