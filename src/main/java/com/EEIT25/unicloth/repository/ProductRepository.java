package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {

    boolean existsBySlug(String slug);
}
