package com.EEIT25.unicloth.dto.admin.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateAdminCategoryRequest(

        /**
         * 新分類要放在哪一個上層分類底下。
         */
        @NotNull(message = "請選擇上層分類")
        Long parentId,

        /**
         * 畫面顯示的中文分類名稱。
         */
        @NotBlank(message = "請輸入分類名稱")
        @Size(
                max = 50,
                message = "分類名稱最多 50 個字"
        )
        String name,

        /**
         * 分類固定代碼，會用在網址與前台查詢。
         *
         * 可使用：
         * 小寫英文字母、數字、底線、連字號。
         */
        @NotBlank(message = "請輸入分類代碼")
        @Size(
                max = 100,
                message = "分類代碼最多 100 個字"
        )
        @Pattern(
                regexp = "[a-z0-9_-]+",
                message =
                        "分類代碼只能使用小寫英文、數字、底線和連字號"
        )
        String code

) {
}