package com.EEIT25.unicloth.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 客服單狀態：處理中 → 待回覆 → 已解決<br>
 * DB 存的是 name()，例如 "IN_PROGRESS"
 */
@Getter
@RequiredArgsConstructor
public enum TicketStatus {
    IN_PROGRESS("處理中"),
    RESOLVED("已解決");

    // 畫面上顯示的中文
    private final String label;
}
