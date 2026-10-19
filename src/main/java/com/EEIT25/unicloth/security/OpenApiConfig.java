package com.EEIT25.unicloth.security;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger UI 的 Authorize 按鈕：貼上登入拿到的 token（不用打 Bearer），之後每個請求都會自動帶
 * {@code Authorization: Bearer <token>}，跟 {@link JwtAuthFilter} 讀的格式一樣。
 */
@Configuration
@SecurityScheme(name = "bearerAuth", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT")
@OpenAPIDefinition(security = @SecurityRequirement(name = "bearerAuth"))
public class OpenApiConfig {
}
