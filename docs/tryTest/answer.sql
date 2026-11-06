CREATE TABLE categories(
    id BIGINT IDENTITY (1,1) NOT NULL,
    parent_id BIGINT NULL ,
    name NVARCHAR(50) NOT NULL ,
    code NVARCHAR(100) NOT NULL,
    icon_url NVARCHAR(500) NOT NULL
    CONSTRAINT pk_categories PRIMARY KEY (id),
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id)
)
CREATE UNIQUE INDEX uk_categories_code ON categories(code) WHERE code IS NOT NULL ;

CREATE TABLE products(
     id BIGINT IDENTITY (1,1) NOT NULL,
     slug NVARCHAR(100) NOT NULL CONSTRAINT uk_products_slug UNIQUE,
     category_id BIGINT NOT NULL ,
     name NVARCHAR(200) NOT NULL ,
     price INT NOT NULL ,
     is_new BIT NOT NULL CONSTRAINT df_products_is_new DEFAULT 0,
     is_hot BIT NOT NULL CONSTRAINT df_products_is_hot DEFAULT 0,
     status NVARCHAR(20) NOT NULL CONSTRAINT df_products_status DEFAULT N'ON_SALE',
     scheduled_off_at DATETIME2 NULL
     CONSTRAINT  pk_products PRIMARY KEY (id),
     CONSTRAINT  fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id)
)
CREATE INDEX idx_products_scheduled_off_at ON products(scheduled_off_at)
    WHERE scheduled_off_at IS NOT NULL;

CREATE TABLE product_variants(
     id BIGINT IDENTITY (1,1) NOT NULL,
     product_id BIGINT NOT NULL,
     sku_code NVARCHAR(50) NOT NULL CONSTRAINT uk_product_variants_sku_code UNIQUE,
     published_at DATETIME2 NOT NULL CONSTRAINT df_product_variants_published_at DEFAULT SYSDATETIME(),
     color NVARCHAR(30) NOT NULL ,
     size NVARCHAR(20) NOT NULL,
    CONSTRAINT 
)

