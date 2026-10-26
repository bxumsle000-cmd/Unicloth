package com.EEIT25.unicloth.enums.product;

public enum InventoryTransactionType {

    /**
     * 進貨入庫，庫存增加。
     */
    RECEIVE,

    /**
     * 盤點調整，庫存可能增加或減少。
     */
    ADJUSTMENT

}