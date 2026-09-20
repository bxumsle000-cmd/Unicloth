package com.EEIT25.unicloth.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 會員
 */
@Entity
@Table(name = "members")
@Getter
@Setter
@NoArgsConstructor
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 登入帳號，存小寫
    @Column(nullable = false, unique = true)
    private String email;

    // BCrypt 雜湊，絕對不存明碼
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String phone;

    // 可 NULL；結帳時當宅配地址的預設值
    @Column(length = 255)
    private String address;

    // male / female
    @Column(nullable = false)
    private String gender;

    @Column(nullable = false)
    private LocalDate birthday;

    // active / disabled
    @Column(nullable = false)
    private String status = "active";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
