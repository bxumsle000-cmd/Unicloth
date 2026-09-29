package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.coupon.CouponResponse;
import com.EEIT25.unicloth.dto.coupon.UsableCouponResponse;
import com.EEIT25.unicloth.entity.Coupon;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.entity.MemberCoupon;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.CouponRepository;
import com.EEIT25.unicloth.repository.MemberCouponRepository;
import com.EEIT25.unicloth.repository.MemberRepository;
import com.EEIT25.unicloth.security.CurrentMember;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CouponService {
    private final MemberRepository memberRepository;
    private final MemberCouponRepository memberCouponRepository;
    private final CurrentMember currentMember;
    private final CouponRepository couponRepository;

    @Transactional
    public List<CouponResponse> getMyCoupons(){
        Member member = memberRepository.findById(currentMember.getCurrentId())
                .orElseThrow(()-> ApiException.unauthorized("登入過期或失效"));
        return memberCouponRepository.findByMemberOrderByExpireAtAsc(member)
                .stream().map(memberCoupon -> CouponResponse.from(memberCoupon))
                .toList();
    }
    @Transactional
    public List<UsableCouponResponse>  getUsableCoupons(int subtotal){
        Member member = memberRepository.findById(currentMember.getCurrentId())
                .orElseThrow(()-> ApiException.unauthorized("登入過期或失效"));

        LocalDateTime now = LocalDateTime.now();

        return memberCouponRepository.findByMemberOrderByExpireAtAsc(member)
                .stream()
                .filter(memberCoupon -> memberCoupon.getUsedAt()==null &&
                        memberCoupon.getExpireAt().isAfter(now))
                .map(memberCoupon ->
                        UsableCouponResponse.from(memberCoupon,subtotal))
                .toList();
    }

    @Transactional
    public void grantTo(Long memberId, Long couponId){
        Member member = memberRepository.findById(memberId)
                .orElseThrow(()-> ApiException.unauthorized("登入過期或失效"));
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(()-> ApiException.notFound("沒有找到這張折價券"));

        if (!coupon.isActive()) {
            throw ApiException.badRequest("這張折價券已停止發放");
        }

        MemberCoupon memberCoupon = MemberCoupon.builder()
                .member(member)
                .coupon(coupon)
                .expireAt(LocalDateTime.now().plusDays(coupon.getValidDays()))
                .build();
        memberCouponRepository.save(memberCoupon);
    }

}
