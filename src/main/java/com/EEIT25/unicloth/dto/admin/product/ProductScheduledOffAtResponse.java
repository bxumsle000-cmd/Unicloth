package com.EEIT25.unicloth.dto.admin.product;

import java.time.LocalDateTime;

public record ProductScheduledOffAtResponse(
        Long productId,
        LocalDateTime scheduledOffAt
) {
}