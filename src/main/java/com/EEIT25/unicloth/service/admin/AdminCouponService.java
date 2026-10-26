package com.EEIT25.unicloth.service.admin;

import com.EEIT25.unicloth.dto.admin.coupon.AdminCouponResponse;
import com.EEIT25.unicloth.dto.admin.coupon.CouponRecordResponse;
import com.EEIT25.unicloth.dto.admin.coupon.CouponScheduleResponse;
import com.EEIT25.unicloth.dto.admin.coupon.CreateCouponRequest;
import com.EEIT25.unicloth.dto.admin.coupon.GrantCouponRequest;
import com.EEIT25.unicloth.dto.admin.coupon.IssueMemberResponse;
import com.EEIT25.unicloth.dto.admin.coupon.UpdateCouponRequest;
import com.EEIT25.unicloth.entity.Coupon;
import com.EEIT25.unicloth.entity.CouponSchedule;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.entity.MemberCoupon;
import com.EEIT25.unicloth.enums.coupon.CouponAutoTrigger;
import com.EEIT25.unicloth.enums.coupon.CouponScheduleStatus;
import com.EEIT25.unicloth.enums.coupon.CouponSource;
import com.EEIT25.unicloth.enums.coupon.CouponType;
import com.EEIT25.unicloth.enums.coupon.MemberCouponStatus;
import com.EEIT25.unicloth.enums.member.MemberStatus;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.CouponRepository;
import com.EEIT25.unicloth.repository.CouponScheduleRepository;
import com.EEIT25.unicloth.repository.MemberCouponRepository;
import com.EEIT25.unicloth.repository.MemberRepository;
import com.EEIT25.unicloth.security.CurrentStaff;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;

/**
 * 行銷後台的折價券管理（員工用，/api/admin/mkt）<br>
 * 會員端的功能（我的折價券、結帳可用券）在 {@link com.EEIT25.unicloth.service.shop.CouponService CouponService}。<br><br>
 * - {@link #getAllCoupons()}：折價券列表<br><br>
 * - {@link #createCoupon(CreateCouponRequest)}：新增折價券<br><br>
 * - {@link #editCoupon(Long, UpdateCouponRequest)}：編輯折價券（折扣碼不能改）<br><br>
 * - {@link #changeActive(Long, boolean)}：啟用／停用折價券<br><br>
 * - {@link #getIssueMembers()}：發券時可以選的會員<br><br>
 * - {@link #grantTo(Long, GrantCouponRequest)}：發券給會員（立即或預約）<br><br>
 * - {@link #getSchedules(CouponScheduleStatus, Pageable)}：預約發送紀錄（分頁）<br><br>
 * - {@link #cancelSchedule(Long)}：取消預約發送<br><br>
 * - {@link #sendBirthdayCoupons()}：生日禮自動發送（每天檢查兩次，發給這個月還沒領過的當月壽星）<br><br>
 * - {@link #getRecords(String, Long, CouponSource, MemberCouponStatus, LocalDate, LocalDate, Pageable)}：發券紀錄（分頁）
 */
@Service
@RequiredArgsConstructor
public class AdminCouponService {
    private final CouponRepository couponRepository;
    private final CouponScheduleRepository couponScheduleRepository;
    private final MemberRepository memberRepository;
    private final MemberCouponRepository memberCouponRepository;
    private final CurrentStaff currentStaff;

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
     * 發券時可以選的會員：狀態 ACTIVE 的會員（停用的不能發），連同姓名。<br>
     * 用姓名、Email 搜尋在前端做。
     */
    @Transactional(readOnly = true)
    public List<IssueMemberResponse> getIssueMembers(){
        return memberRepository.findIssueMembers(MemberStatus.ACTIVE);
    }

    /**
     * 發券給會員：只有啟用中的券能發，只發給狀態 ACTIVE 的會員。<br>
     * scheduledAt 是 null 就立即寫進 member_coupons；有值就存成一筆預約，時間到了由 {@link CouponSendScheduler} 發出。
     */
    @Transactional
    public void grantTo(Long couponId, GrantCouponRequest request){
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> ApiException.notFound("沒有找到這張折價券"));
        if (!coupon.isActive()) {
            throw ApiException.badRequest("這張折價券已停止發放");
        }

        // 指定會員時：去掉重複的 id，而且每一位都要存在、狀態是 ACTIVE
        List<Member> targetMembers = List.of();
        if (!request.targetAll()) {
            if (request.memberIds() == null || request.memberIds().isEmpty()) {
                throw ApiException.badRequest("請選擇要發給哪些會員");
            }
            List<Long> distinctMemberIds = request.memberIds().stream().distinct().toList();
            targetMembers = memberRepository.findByIdInAndStatus(distinctMemberIds, MemberStatus.ACTIVE);
            if (targetMembers.size() != distinctMemberIds.size()) {
                throw ApiException.badRequest("有會員不存在或已停用");
            }
        }

        // 立即發送
        if (request.scheduledAt() == null) {
            if (request.targetAll()) {
                targetMembers = memberRepository.findByStatus(MemberStatus.ACTIVE);
            }
            issue(coupon, targetMembers, CouponSource.MANUAL);
            return;
        }

        // 預約發送：全部會員的話 members 留空，等發送當下再查
        if (!request.scheduledAt().isAfter(LocalDateTime.now())) {
            throw ApiException.badRequest("預約時間要晚於現在");
        }
        CouponSchedule schedule = CouponSchedule.builder()
                .coupon(coupon)
                .targetAll(request.targetAll())
                .members(new HashSet<>(targetMembers))
                .scheduledAt(request.scheduledAt())
                .createdBy(currentStaff.require())
                .build();
        couponScheduleRepository.save(schedule);
    }

    /**
     * 執行一筆時間到了的預約，給 {@link CouponSendScheduler} 呼叫，每筆預約各自一個交易。<br>
     * 券在這段期間被停用的話不發，狀態改成 FAILED；停用的會員也不發。
     */
    @Transactional
    public void sendSchedule(Long scheduleId){
        CouponSchedule schedule = couponScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> ApiException.notFound("沒有找到這筆預約"));
        // 排程查出來之後才被取消的，就不發
        if (schedule.getStatus() != CouponScheduleStatus.PENDING) {
            return;
        }

        if (!schedule.getCoupon().isActive()) {
            schedule.setStatus(CouponScheduleStatus.FAILED);
            return;
        }

        List<Member> targetMembers = schedule.isTargetAll()
                ? memberRepository.findByStatus(MemberStatus.ACTIVE)
                : schedule.getMembers().stream()
                        .filter(member -> member.getStatus() == MemberStatus.ACTIVE)
                        .toList();

        int count = issue(schedule.getCoupon(), targetMembers, CouponSource.MANUAL);
        schedule.setSentCount(count);
        schedule.setSentAt(LocalDateTime.now());
        schedule.setStatus(CouponScheduleStatus.SENT);
    }

    /**
     * 生日禮自動發送，給 {@link BirthdayCouponScheduler} 每天呼叫兩次，回傳總共發了幾張。<br>
     * 自動發送時機設成 BIRTHDAY、而且啟用中的券，每張都發給當月壽星（狀態 ACTIVE 的會員）。<br>
     * 這個月已經領過同一張生日券的會員不再發，所以一個月跑很多次也只會發一張。
     */
    @Transactional
    public int sendBirthdayCoupons(){
        List<Coupon> birthdayCoupons = couponRepository.findByAutoTriggerAndActiveTrue(CouponAutoTrigger.BIRTHDAY);
        if (birthdayCoupons.isEmpty()) {
            return 0;
        }

        LocalDate today = LocalDate.now();
        List<Member> birthdayMembers = memberRepository.findByBirthdayMonthAndStatus(today.getMonthValue(), MemberStatus.ACTIVE);
        LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();

        int totalCount = 0;
        for (Coupon coupon : birthdayCoupons) {
            List<Long> receivedMemberIds = memberCouponRepository
                    .findReceivedMemberIds(coupon.getId(), CouponSource.BIRTHDAY, monthStart);
            List<Member> notReceivedMembers = birthdayMembers.stream()
                    .filter(member -> !receivedMemberIds.contains(member.getId()))
                    .toList();
            totalCount += issue(coupon, notReceivedMembers, CouponSource.BIRTHDAY);
        }
        return totalCount;
    }

    /**
     * 預約發送紀錄（含已發送、已取消的），分頁查詢。<br>
     * status 是 null 就查全部狀態；排序由 pageable 決定（Controller 預設預約時間晚的排前面）。
     */
    @Transactional(readOnly = true)
    public Page<CouponScheduleResponse> getSchedules(CouponScheduleStatus status, Pageable pageable){
        return couponScheduleRepository.findByStatusFilter(status, pageable)
                .map(schedule -> CouponScheduleResponse.from(schedule));
    }

    /**
     * 發券紀錄：每張發出去的券一筆（手動發的和自動發的都有），發券時間新的排前面，分頁查詢。<br>
     * 每個篩選是 null 就不篩（keyword 空白也不篩）：<br>
     * - keyword：比對會員姓名或 email（不分大小寫、部分符合就算）<br>
     * - status：可使用 / 已使用 / 已過期，判斷方式見 {@link MemberCouponStatus#of}<br>
     * - receivedFrom、receivedTo：發券日期的區間，兩端都含，只填一邊也可以
     */
    @Transactional(readOnly = true)
    public Page<CouponRecordResponse> getRecords(String keyword, Long couponId, CouponSource source, MemberCouponStatus status,
                                                 LocalDate receivedFrom, LocalDate receivedTo, Pageable pageable){
        if (receivedFrom != null && receivedTo != null && receivedFrom.isAfter(receivedTo)) {
            throw ApiException.badRequest("開始日期不能晚於結束日期");
        }

        // 姓名或 email 部分符合就算：轉小寫、前後加 %
        String keywordPattern = keyword == null || keyword.isBlank()
                ? null
                : "%" + keyword.trim().toLowerCase() + "%";
        // 日期換成時間：結束日要含當天，所以查到隔天 00:00 之前
        LocalDateTime receivedFromTime = receivedFrom == null ? null : receivedFrom.atStartOfDay();
        LocalDateTime receivedToTime = receivedTo == null ? null : receivedTo.plusDays(1).atStartOfDay();

        String statusName = status == null ? null : status.name();
        // 排序寫死在查詢裡；pageable 帶了 sort 的話會再接一次 order by，SQL Server 會報錯，所以只取頁碼和筆數
        Pageable pageOnly = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        return memberCouponRepository.findRecords(keywordPattern, couponId, source, statusName,
                receivedFromTime, receivedToTime, LocalDateTime.now(), pageOnly);
    }

    /** 取消預約：只有還沒發送（PENDING）的能取消 */
    @Transactional
    public void cancelSchedule(Long scheduleId){
        CouponSchedule schedule = couponScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> ApiException.notFound("沒有找到這筆預約"));
        if (schedule.getStatus() != CouponScheduleStatus.PENDING) {
            throw ApiException.badRequest("只有等待中的預約能取消，這筆是「" + schedule.getStatus().getLabel() + "」");
        }
        schedule.setStatus(CouponScheduleStatus.CANCELLED);
    }

    /**
     * 每位會員各發一張，回傳發了幾張。<br>
     * 到期時間 = 現在 + 這種券的有效天數；source 是這張券怎麼來的（手動發 MANUAL、生日禮 BIRTHDAY…）。
     */
    private int issue(Coupon coupon, List<Member> members, CouponSource source) {
        LocalDateTime expireAt = LocalDateTime.now().plusDays(coupon.getValidDays());
        List<MemberCoupon> memberCoupons = members.stream()
                .map(member -> MemberCoupon.builder()
                        .member(member)
                        .coupon(coupon)
                        .expireAt(expireAt)
                        .source(source)
                        .build())
                .toList();
        memberCouponRepository.saveAll(memberCoupons);
        return memberCoupons.size();
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
