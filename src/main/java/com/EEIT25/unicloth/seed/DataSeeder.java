package com.EEIT25.unicloth.seed;

import com.EEIT25.unicloth.entity.Category;
import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.entity.ProductVariant;
import com.EEIT25.unicloth.repository.CategoryRepository;
import com.EEIT25.unicloth.repository.ProductRepository;
import com.EEIT25.unicloth.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.io.InputStream;
import java.util.List;

/**
 * 啟動時把 data/products.json 匯進資料庫。
 *
 * 只有 application.properties 設 app.seed.products=true 時這個 class 才會被建立（預設 false，什麼都不做）。
 * 匯入是「補上還沒有的」：slug 已存在的商品會跳過，所以重複執行不會塞出重複資料。
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.seed.products", havingValue = "true")
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ObjectMapper objectMapper;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;

    @Override
    @Transactional   // 整批一起成功或一起失敗，不會匯到一半
    public void run(String... args) throws Exception {
        List<ProductJson> items;
        try (InputStream in = new ClassPathResource("data/products.json").getInputStream()) {
            items = objectMapper.readValue(in, objectMapper.getTypeFactory()
                    .constructCollectionType(List.class, ProductJson.class));
        }
        log.info("[seed] products.json 讀到 {} 件商品", items.size());

        int inserted = 0, skipped = 0;
        for (ProductJson json : items) {
            if (productRepository.existsBySlug(json.slug())) {
                skipped++;
                continue;
            }
            Category sub = findOrCreateCategory(json.mainCategory(), json.subCategory());
            // Product 不認識 variants（沒有 @OneToMany），所以先存商品拿到 id，再逐一存 SKU
            Product p = productRepository.save(toProduct(json, sub));
            for (ProductJson.VariantJson vj : json.variants()) {
                variantRepository.save(toVariant(vj, p));
            }
            inserted++;
        }
        log.info("[seed] 完成：新增 {} 件、跳過 {} 件（已存在）", inserted, skipped);
    }

    /** 主分類（女裝）→ 副分類（外套類），沒有就建 */
    private Category findOrCreateCategory(String mainName, String subName) {
        Category main = categoryRepository.findByNameAndParentIsNull(mainName)
                .orElseGet(() -> {
                    Category c = new Category();
                    c.setName(mainName);
                    return categoryRepository.save(c);
                });
        return categoryRepository.findByNameAndParent(subName, main)
                .orElseGet(() -> {
                    Category c = new Category();
                    c.setName(subName);
                    c.setParent(main);
                    return categoryRepository.save(c);
                });
    }

    /** JSON → Product（不含 variants，variants 由 toVariant 另外建） */
    private Product toProduct(ProductJson json, Category category) {
        Product p = new Product();
        p.setSlug(json.slug());
        p.setName(json.name());
        p.setCategory(category);
        p.setDescription(json.description());
        p.setPrice(json.price());
        p.setOrigPrice(json.origPrice());
        p.setNewArrival(json.isNew());
        p.setHot(json.isHot());
        return p;
    }

    /** JSON → ProductVariant，並指定所屬商品 */
    private ProductVariant toVariant(ProductJson.VariantJson vj, Product product) {
        ProductVariant v = new ProductVariant();
        v.setProduct(product);
        v.setColor(vj.color());
        v.setSize(vj.size());
        v.setSkuCode(vj.skuCode());
        v.setStock(vj.stock());
        v.setUrl(vj.url());
        return v;
    }
}
