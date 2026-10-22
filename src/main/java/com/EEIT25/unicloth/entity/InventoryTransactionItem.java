package com.EEIT25.unicloth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "inventory_transaction_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryTransactionItem {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    /**
     * 所屬的庫存異動主紀錄。
     */
    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "transaction_id",
            nullable = false
    )
    private InventoryTransaction transaction;

    /**
     * 被調整的 SKU。
     *
     * SKU 日後刪除時，資料庫會將 variant_id 設成 null，
     * 但下方的商品快照仍會保留。
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    private ProductVariant variant;

    /**
     * 操作當下的 SKU 編號快照。
     */
    @Column(
            name = "sku_code",
            nullable = false,
            length = 50
    )
    private String skuCode;

    /**
     * 操作當下的商品名稱快照。
     */
    @Column(
            name = "product_name",
            nullable = false,
            length = 200
    )
    private String productName;

    /**
     * 操作當下的顏色快照。
     */
    @Column(
            nullable = false,
            length = 30
    )
    private String color;

    /**
     * 操作當下的尺寸快照。
     */
    @Column(
            nullable = false,
            length = 20
    )
    private String size;

    /**
     * 庫存變化量。
     *
     * 例如：
     * 進貨 5 件為 5；
     * 盤點由 10 改成 7 為 -3。
     */
    @Column(
            name = "quantity_change",
            nullable = false
    )
    private Integer quantityChange;

    /**
     * 異動前庫存。
     */
    @Column(
            name = "stock_before",
            nullable = false
    )
    private Integer stockBefore;

    /**
     * 異動後庫存。
     */
    @Column(
            name = "stock_after",
            nullable = false
    )
    private Integer stockAfter;
}