package com.EEIT25.unicloth.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * 會員個人資料（跟 {@link Member} 一對一）
 * 主鍵就是會員 id，不自動產生；用 memberProfileRepository.findById(memberId) 查。
 */
@Entity
@Table(name = "member_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberProfile {

    // 對應 members.id
    @Id
    @Column(name = "member_id")
    private Long memberId;

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
}
