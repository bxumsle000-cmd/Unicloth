package com.EEIT25.unicloth.dto.admin.cs;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 客服回覆會員問題時送出的資料。
 *
 * resolve 為 true：儲存回覆後直接結案。
 * resolve 為 false：儲存回覆，但客服單維持處理中。
 */
public record ReplySupportTicketRequest(
        @NotBlank(message = "請填寫回覆內容")
        @Size(max = 2000, message = "回覆內容不得超過 2000 個字")
        String reply,

        @NotNull(message = "請選擇是否結案")
        Boolean resolve
) {
}