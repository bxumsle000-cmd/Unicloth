package com.EEIT25.unicloth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@ConfigurationPropertiesScan   // 讓 security/ 裡的 JwtProperties、FirebaseProperties（@ConfigurationProperties）被註冊成 Bean
@EnableScheduling              // 開啟 @Scheduled 排程（OrderTimeoutScheduler：逾時未付款自動取消）
public class UniclothApplication {

    public static void main(String[] args) {
        SpringApplication.run(UniclothApplication.class, args);
    }

}
