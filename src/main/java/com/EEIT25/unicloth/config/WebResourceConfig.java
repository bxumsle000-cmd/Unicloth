package com.EEIT25.unicloth.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebResourceConfig implements WebMvcConfigurer {
    private final Path productImageDirectory = Paths.get(
            "src",
            "main",
            "resources",
            "static",
            "img",
            "products"
    ).toAbsolutePath().normalize();

    @Override
    public void addResourceHandlers(
            ResourceHandlerRegistry registry
    ) {
        registry.addResourceHandler("/img/products/**")
                .addResourceLocations(
                        productImageDirectory.toUri().toString()
                );
    }
}