package com.EEIT25.unicloth.enums.order;

/**
 * 綠界金流付款狀態
 */
public enum PaymentStatus {

    PENDING,    // 等待付款
    PAID,       // 付款成功
    FAILED,     // 付款失敗
    CANCELLED   // 付款取消
}