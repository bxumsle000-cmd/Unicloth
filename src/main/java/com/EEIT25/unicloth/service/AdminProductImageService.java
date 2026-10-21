package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AdminProductImageService {
    private static final long MAX_FILE_SIZE = 5L * 1024L * 1024L;
    private static final Pattern COLOR_CODE_PATTERN = Pattern.compile(
            "COL\\d{2}",
            Pattern.CASE_INSENSITIVE
    );
    private final ProductRepository productRepository;

    /**
     * 儲存商品顏色圖片，並回傳瀏覽器可讀取的網址。
     * 圖片會放進原有的 static/img/products 商品圖片目錄。
     */
    public String saveProductImage(
            Long productId,
            String colorCode,
            MultipartFile image
    ) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> ApiException.notFound(
                        "找不到商品：" + productId
                ));

        if (image == null || image.isEmpty()) {
            throw ApiException.badRequest("請選擇要上傳的商品圖片");
        }

        if (image.getSize() > MAX_FILE_SIZE) {
            throw ApiException.badRequest("圖片大小不能超過 5MB");
        }

        String normalizedColorCode = normalizeColorCode(colorCode);
        String extension = resolveExtension(image.getContentType());

        Path rootDirectory = Paths.get(
                "src",
                "main",
                "resources",
                "static",
                "img",
                "products"
        ).toAbsolutePath().normalize();

        Path productDirectory = rootDirectory
                .resolve(product.getSlug())
                .normalize();

        if (!productDirectory.startsWith(rootDirectory)) {
            throw ApiException.badRequest("圖片儲存路徑錯誤");
        }

        String fileName = normalizedColorCode.toLowerCase(Locale.ROOT)
                + "-"
                + UUID.randomUUID().toString().substring(0, 8)
                + "."
                + extension;

        Path targetFile = productDirectory.resolve(fileName).normalize();

        if (!targetFile.startsWith(productDirectory)) {
            throw ApiException.badRequest("圖片檔名錯誤");
        }

        try {
            Files.createDirectories(productDirectory);

            try (InputStream inputStream = image.getInputStream()) {
                Files.copy(
                        inputStream,
                        targetFile,
                        StandardCopyOption.REPLACE_EXISTING
                );
            }
        } catch (IOException e) {
            throw new ApiException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "商品圖片儲存失敗"
            );
        }

        return "/img/products/"
                + product.getSlug()
                + "/"
                + fileName;
    }

    /**
     * 驗證並整理顏色代碼。
     */
    private String normalizeColorCode(String colorCode) {
        if (colorCode == null) {
            throw ApiException.badRequest("請輸入顏色代碼");
        }

        String normalized = colorCode.trim().toUpperCase(Locale.ROOT);

        if (!COLOR_CODE_PATTERN.matcher(normalized).matches()) {
            throw ApiException.badRequest(
                    "顏色代碼格式必須像 COL09"
            );
        }

        return normalized;
    }

    /**
     * 只允許常用的商品圖片格式。
     */
    private String resolveExtension(String contentType) {
        if (contentType == null) {
            throw ApiException.badRequest("無法判斷圖片格式");
        }

        return switch (contentType.toLowerCase(Locale.ROOT)) {
            case "image/jpeg", "image/jpg" -> "jpg";
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            default -> throw ApiException.badRequest(
                    "圖片只支援 JPG、PNG 或 WEBP"
            );
        };
    }
}