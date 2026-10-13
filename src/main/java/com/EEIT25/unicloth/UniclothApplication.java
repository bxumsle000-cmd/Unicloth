package com.EEIT25.unicloth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan   // 讓 security/JwtProperties（@ConfigurationProperties）被註冊成 Bean
public class UniclothApplication {

    public static void main(String[] args) {
        SpringApplication.run(UniclothApplication.class, args);
    }

}
