package com.EEIT25.unicloth.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Firebase 登入相關設定，對應 application.properties 裡 {@code firebase.*} 的項目。
 *
 * @param projectId Firebase 專案 ID；空白代表還沒設定，Google 登入會回 503，其他功能不受影響
 */
@ConfigurationProperties(prefix = "firebase")
public record FirebaseProperties(
        String projectId
) {
}
