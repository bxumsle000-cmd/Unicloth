package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.admin.mkt.AdminCouponGrantResponse;
import com.EEIT25.unicloth.dto.admin.mkt.AdminCouponListResponse;
import com.EEIT25.unicloth.dto.admin.mkt.CreateCouponRequest;
import com.EEIT25.unicloth.dto.admin.mkt.GrantCouponToMemberRequest;
import com.EEIT25.unicloth.dto.admin.mkt.UpdateCouponActiveRequest;
import com.EEIT25.unicloth.entity.Coupon;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.entity.MemberCoupon;
import com.EEIT25.unicloth.entity.MemberProfile;
import com.EEIT25.unicloth.enums.CouponType;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.CouponRepository;
import com.EEIT25.unicloth.repository.MemberCouponRepository;
import com.EEIT25.unicloth.repository.MemberProfileRepository;
import com.EEIT25.unicloth.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 行銷部門的折價券管理服務。
 *
 * 會員端 CouponService 只處理「我的折價券」與結帳使用；
 * 行銷人員建立、停止發放、指定發券與查詢發放紀錄，都集中在這個類別。
 */
@Service
@RequiredArgsConstructor
public class AdminCouponService {
    private final CouponRepository couponRepository;
    private final MemberRepository memberRepository;
    private final MemberProfileRepository memberProfileRepository;
    private final MemberCouponRepository memberCouponRepository;

    /**
     * 依折扣碼、名稱與啟用狀態取得折價券範本清單。
     */
    @Transactional(readOnly = true)
    public Page<AdminCouponListResponse> getCoupons(
            String keyword,
            Boolean active,
            Pageable pageable
    ) {
        String trimmedKeyword = keyword == null ? "" : keyword.trim();

        return couponRepository
                .findByAdminFilter(trimmedKeyword, active, pageable)
                .map(AdminCouponListResponse::from);
    }

    /**
     * 查看指定折價券實際發送給會員的紀錄。
     *
     * 會員姓名另存於 MemberProfile，因此把本頁所有 Profile 一次讀取，
     * 避免清單每一列都額外查一次資料庫。
     */
    @Transactional(readOnly = true)
    public Page<AdminCouponGrantResponse> getCouponGrantHistory(
            Long couponId,
            Pageable pageable
    ) {
        findCoupon(couponId);

        Page<MemberCoupon> grantPage = memberCouponRepository
                .findAdminGrantHistory(couponId, pageable);

        List<Long> memberIds = grantPage.getContent().stream()
                .map(memberCoupon -> memberCoupon.getMember().getId())
                .distinct()
                .toList();

        Map<Long, String> memberNames = memberProfileRepository
                .findAllById(memberIds)
                .stream()
                .collect(Collectors.toMap(
                        MemberProfile::getMemberId,
                        MemberProfile::getName
                ));

        return grantPage.map(memberCoupon -> AdminCouponGrantResponse.from(
                memberCoupon,
                memberNames.getOrDefault(
                        memberCoupon.getMember().getId(),
                        "—"
                )
        ));
    }

    /**
     * 建立新的折價券範本。
     *
     * 代碼統一轉成大寫，讓 welcome100 與 WELCOME100
     * 被視為同一種折價券，避免會員輸入時產生混淆。
     */
    @Transactional
    public AdminCouponListResponse createCoupon(CreateCouponRequest request) {
        String normalizedCode = request.code()
                .trim()
                .toUpperCase(Locale.ROOT);

        if (couponRepository.findByCode(normalizedCode).isPresent()) {
            throw ApiException.conflict("折扣碼已存在：" + normalizedCode);
        }

        validateCouponValue(request.type(), request.value());

        Coupon coupon = couponRepository.save(Coupon.builder()
                .code(normalizedCode)
                .title(request.title().trim())
                .type(request.type())
                .value(request.value())
                .minSubtotal(request.minSubtotal())
                .validDays(request.validDays())
                .signupGift(request.signupGift())
                .active(true)
                .build());

        return AdminCouponListResponse.from(coupon);
    }

    /**
     * 停止或重新啟用一種折價券。
     *
     * 只影響未來的領取與人工發券；
     * 已經存在會員帳戶中的折價券不會被刪除。
     */
    @Transactional
    public AdminCouponListResponse updateCouponActive(
            Long couponId,
            UpdateCouponActiveRequest request
    ) {
        Coupon coupon = findCoupon(couponId);
        coupon.setActive(request.active());

        return AdminCouponListResponse.from(coupon);
    }

    /**
     * 發一張指定折價券給指定會員。
     *
     * 每次發放都建立一筆新的 MemberCoupon，
     * 因此同一位會員可在不同活動中持有同種類的多張券。
     */
    @Transactional
    public void grantCouponToMember(GrantCouponToMemberRequest request) {
        String normalizedEmail = request.memberEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        Member member = memberRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> ApiException.notFound(
                        "找不到會員：" + normalizedEmail
                ));

        Coupon coupon = findCoupon(request.couponId());

        if (!coupon.isActive()) {
            throw ApiException.badRequest("這張折價券已停止發放");
        }

        memberCouponRepository.save(MemberCoupon.builder()
                .member(member)
                .coupon(coupon)
                .expireAt(LocalDateTime.now().plusDays(coupon.getValidDays()))
                .build());
    }

    /**
     * 固定金額折抵與百分比折扣共用的數值檢查。
     */
    private void validateCouponValue(CouponType type, Integer value) {
        if (type == CouponType.PERCENT && value > 100) {
            throw ApiException.badRequest("折扣百分比不得超過 100");
        }
    }

    /**
     * 集中處理找不到折價券的情況，避免每個功能重複查詢。
     */
    private Coupon findCoupon(Long couponId) {
        return couponRepository.findById(couponId)
                .orElseThrow(() -> ApiException.notFound(
                        "找不到折價券：" + couponId
                ));
    }
}