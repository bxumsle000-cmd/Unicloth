package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.coupon.CouponResponse;
import com.EEIT25.unicloth.dto.coupon.UsableCouponResponse;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.repository.MemberCouponRepository;
import com.EEIT25.unicloth.security.CurrentMember;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 折價券相關服務（電商，會員用，/api/coupon）<br>
 * Coupon 是券的種類（例如 新會員 100 元折價券），MemberCoupon 是「某會員持有的一張」，有自己的到期時間和使用時間。<br>
 * 行銷後台的折價券管理（含發券）在 {@link AdminCouponService}。<br><br>
 * - {@link #getMyCoupons()}：會員中心的「我的折價券」<br><br>
 * - {@link #getUsableCoupons(int)}：結帳時可選的券，順便算出每張這次能折多少
 */
@Service
@RequiredArgsConstructor
public class CouponService {
    private final MemberCouponRepository memberCouponRepository;
    private final CurrentMember currentMember;

    /** 我的折價券：登入會員持有的所有券（含已使用、已過期），快到期的排前面 */
    @Transactional
    public List<CouponResponse> getMyCoupons(){
        Member member = currentMember.require();
        return memberCouponRepository.findByMemberOrderByExpireAtAsc(member)
                .stream().map(memberCoupon -> CouponResponse.from(memberCoupon))
                .toList();
    }

    /**
     * 結帳時可選的折價券：只留未使用、未過期的，快到期的排前面。<br>
     * 沒達到最低消費的券也會回傳（前端顯示但不能選），每張都算好這次的小計能折多少。
     */
    @Transactional
    public List<UsableCouponResponse>  getUsableCoupons(int subtotal){
        Member member = currentMember.require();

        LocalDateTime now = LocalDateTime.now();

        return memberCouponRepository.findByMemberOrderByExpireAtAsc(member)
                .stream()
                .filter(memberCoupon -> memberCoupon.getUsedAt()==null &&
                        memberCoupon.getExpireAt().isAfter(now))
                .map(memberCoupon ->
                        UsableCouponResponse.from(memberCoupon,subtotal))
                .toList();
    }
}
