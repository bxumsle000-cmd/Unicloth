package com.EEIT25.unicloth.dto.admin.product;

import jakarta.validation.constraints.Future;

import java.time.LocalDateTime;

public record UpdateProductScheduledOffAtRequest(

        /*
         * null 代表清除預定下架時間。
         * 有值時必須是未來時間。
         */
        @Future(
                message = "預定下架時間必須晚於現在"
        )
        LocalDateTime scheduledOffAt

) {
}