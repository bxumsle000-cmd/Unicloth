package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.coupon.AdminCouponResponse;
import com.EEIT25.unicloth.dto.coupon.CouponResponse;
import com.EEIT25.unicloth.dto.coupon.CreateCouponRequest;
import com.EEIT25.unicloth.dto.coupon.GrantCouponRequest;
import com.EEIT25.unicloth.dto.coupon.UpdateCouponRequest;
import com.EEIT25.unicloth.dto.coupon.UsableCouponResponse;
import com.EEIT25.unicloth.entity.Coupon;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.entity.MemberCoupon;
import com.EEIT25.unicloth.enums.CouponType;
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

/**
 * 折價券相關服務<br>
 * Coupon 是券的種類（例如 新會員 100 元折價券），MemberCoupon 是「某會員持有的一張」，有自己的到期時間和使用時間。<br><br>
 * <b>電商（會員用，/api/coupon）</b><br>
 * - {@link #getMyCoupons()}：會員中心的「我的折價券」<br><br>
 * - {@link #getUsableCoupons(int)}：結帳時可選的券，順便算出每張這次能折多少<br><br>
 * - {@link #grantTo(GrantCouponRequest)}：發一張券給指定會員<br><br>
 * <b>行銷後台（員工用，/api/admin/mkt）</b><br>
 * - {@link #getAllCoupons()}：折價券列表<br><br>
 * - {@link #createCoupon(CreateCouponRequest)}：新增折價券<br><br>
 * - {@link #editCoupon(Long, UpdateCouponRequest)}：編輯折價券（折扣碼不能改）<br><br>
 * - {@link #changeActive(Long, boolean)}：啟用／停用折價券
 */
@Service
@RequiredArgsConstructor
public class CouponService {
    private final MemberRepository memberRepository;
    private final MemberCouponRepository memberCouponRepository;
    private final CurrentMember currentMember;
    private final CouponRepository couponRepository;

    // ==================== 電商（會員用，/api/coupon） ====================

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

    /**
     * 發一張折價券給指定會員。<br>
     * 停止發放（isActive = false）的券不能發；到期時間 = 現在 + 這種券的有效天數。
     */
    @Transactional
    public void grantTo(GrantCouponRequest request){
        Member member = memberRepository.findById(request.memberId())
                .orElseThrow(()-> ApiException.unauthorized("登入過期或失效"));
        Coupon coupon = couponRepository.findById(request.couponId())
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

    // ==================== 行銷後台（員工用，/api/admin/mkt） ====================

    /**
     * 折價券列表：所有券（含停用的），新建的排前面，每張附上已發出幾張。<br>
     * 關鍵字、狀態、發送方式的篩選在前端做（券的數量不多）。
     */
    @Transactional
    public List<AdminCouponResponse> getAllCoupons(){
        return couponRepository.findAllByOrderByIdDesc()
                .stream()
                .map(coupon -> AdminCouponResponse.from(coupon))
                .toList();
    }

    /**
     * 新增折價券：折扣碼轉大寫後不能重複，新增的券預設啟用。<br>
     * 打折的 % 要在 1～99 之間；折固定金額的話，折的金額要比最低消費小（不然會折到 0 元以下）。
     */
    @Transactional
    public void createCoupon(CreateCouponRequest request){
        String code = request.code().trim().toUpperCase();
        if (couponRepository.existsByCode(code)) {
            throw ApiException.conflict("這個折扣碼已經有了");
        }
        checkDiscount(request.type(), request.value(), request.minSubtotal());

        Coupon coupon = Coupon.builder()
                .code(code)
                .title(request.title().trim())
                .type(request.type())
                .value(request.value())
                .minSubtotal(request.minSubtotal())
                .validDays(request.validDays())
                .autoTrigger(request.autoTrigger())
                .build();
        couponRepository.save(coupon);
    }

    /**
     * 編輯折價券：折扣碼不能改，其他都能改，檢查規則跟新增一樣。<br>
     * 已發出、還沒用的券折扣內容也會跟著變；有效天數只影響之後發的券，已發出的券到期時間不變。
     */
    @Transactional
    public void editCoupon(Long id, UpdateCouponRequest request){
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("沒有找到這張折價券"));
        checkDiscount(request.type(), request.value(), request.minSubtotal());

        // 在 @Transactional 裡改 entity，方法結束時 JPA 會自動存回 DB，不用再呼叫 save
        coupon.setTitle(request.title().trim());
        coupon.setType(request.type());
        coupon.setValue(request.value());
        coupon.setMinSubtotal(request.minSubtotal());
        coupon.setValidDays(request.validDays());
        coupon.setAutoTrigger(request.autoTrigger());
    }

    @Transactional
    public void changeActive(Long id, boolean isActive){
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("沒有找到這張折價券"));
        coupon.setActive(isActive);
    }

    /**
     * 新增、編輯共用的折扣檢查（要同時看兩個欄位，DTO 的 annotation 做不到）：<br>
     * 打折的 % 要在 1～99 之間；折固定金額的話，折的金額要比最低消費小（不然會折到 0 元以下）。
     */
    private void checkDiscount(CouponType type, int value, int minSubtotal) {
        if (type == CouponType.PERCENT && value > 99) {
            throw ApiException.badRequest("打折的 % 要在 1～99 之間");
        }
        if (type == CouponType.AMOUNT && value >= minSubtotal) {
            throw ApiException.badRequest("折的金額要比最低消費小");
        }
    }
}
