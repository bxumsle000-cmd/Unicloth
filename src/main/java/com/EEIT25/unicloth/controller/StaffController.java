package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.staff.ChangeStaffNameRequest;
import com.EEIT25.unicloth.dto.staff.CreateNewStaffRequest;
import com.EEIT25.unicloth.dto.staff.StaffFilterRequest;
import com.EEIT25.unicloth.dto.staff.StaffResponse;
import com.EEIT25.unicloth.dto.staff.TempPasswordResponse;
import com.EEIT25.unicloth.service.admin.StaffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * 後台員工帳號管理（只有 ADMIN 能用，SecurityConfig 擋 /api/admin/admin/**）<br>
 * 要操作哪個員工都用網址上的 account 指定
 */
@RestController
@RequestMapping("/api/admin/admin/staff")
@RequiredArgsConstructor
public class StaffController {
    private final StaffService staffService;

    /** 員工列表，分頁 + 篩選（篩選條件都可省略）：?keyword=sys&department=ADMIN&status=ACTIVE&page=0&size=20 */
    @GetMapping
    public Page<StaffResponse> getStaff(
            @ParameterObject @ModelAttribute StaffFilterRequest filter,
            @ParameterObject @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        return staffService.getStaff(filter, pageable);
    }

    /** 新增員工，回傳臨時密碼給管理者 */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TempPasswordResponse create(@Valid @RequestBody CreateNewStaffRequest request) {
        return new TempPasswordResponse(staffService.createNewStaff(request));
    }

    /** 改員工姓名 */
    @PatchMapping("/{account}/name")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeName(@PathVariable String account, @Valid @RequestBody ChangeStaffNameRequest request) {
        staffService.changeName(account, request.name());
    }

    /** 重設密碼，回傳臨時密碼給管理者 */
    @PostMapping("/{account}/reset-password")
    public TempPasswordResponse resetPassword(@PathVariable String account) {
        return new TempPasswordResponse(staffService.resetPassword(account));
    }

    /** 停用員工帳號 */
    @PatchMapping("/{account}/disable")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void disable(@PathVariable String account) {
        staffService.disable(account);
    }

    /** 重新啟用員工帳號 */
    @PatchMapping("/{account}/enable")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void enable(@PathVariable String account) {
        staffService.enable(account);
    }
}
