package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.Style;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * 查詢與管理商品風格。
 */
public interface StyleRepository
        extends JpaRepository<Style, Long> {

    /**
     * 使用固定代碼查詢，例如 japanese。
     */
    Optional<Style> findByCode(String code);

    /**
     * 使用正式名稱查詢，例如日系。
     */
    Optional<Style> findByName(String name);

    /**
     * 使用正式名稱、代碼或搜尋別名判斷風格。
     */
    @Query(
            value = """
                    SELECT DISTINCT style.*
                    FROM styles style
                    LEFT JOIN style_aliases alias_data
                        ON alias_data.style_id = style.id
                    WHERE LOWER(style.name)
                        LIKE LOWER(CONCAT('%', :keyword, '%'))
                       OR LOWER(style.code)
                        LIKE LOWER(CONCAT('%', :keyword, '%'))
                       OR LOWER(alias_data.alias)
                        LIKE LOWER(CONCAT('%', :keyword, '%'))
                    """,
            nativeQuery = true
    )
    List<Style> findMatchingStyles(
            @Param("keyword") String keyword
    );

    /**
     * 取得指定風格的相關風格。
     */
    @Query(
            value = """
                    SELECT DISTINCT target_style.*
                    FROM styles target_style
                    JOIN style_relations relation
                        ON relation.target_style_id =
                           target_style.id
                    WHERE relation.source_style_id
                        IN (:sourceStyleIds)
                    """,
            nativeQuery = true
    )
    List<Style> findRelatedStyles(
            @Param("sourceStyleIds")
            Collection<Long> sourceStyleIds
    );
}