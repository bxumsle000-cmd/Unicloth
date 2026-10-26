package com.EEIT25.unicloth.entity;

import com.EEIT25.unicloth.enums.staff.Department;
import com.EEIT25.unicloth.enums.staff.StaffStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 後台員工帳號，跟前台會員 {@link Member} 完全分開
 */
@Entity
@Table(name = "staff")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Staff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 登入帳號，例如 sys01；建立後不能改
    @Column(nullable = false, unique = true, length = 50, updatable = false)
    private String account;

    // BCrypt 雜湊，絕對不存明碼
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false, length = 50)
    private String name;

    // 存成大寫字串，例如 ACTIVE
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StaffStatus status = StaffStatus.ACTIVE;

    // 還沒登入過是 null
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // 所屬部門，一個員工只有一個；存成大寫字串，例如 PRODUCT
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Department department;
}
