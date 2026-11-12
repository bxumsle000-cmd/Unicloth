# Entity 用到的語法整理

整理 `src/main/java/com/EEIT25/unicloth/entity/` 底下 19 個 Entity 實際用到的 annotation，每個只列一次。

## 總表

| 語法 | 來源 | 寫在哪 | 作用 |
| --- | --- | --- | --- |
| `@Entity` | JPA | class | 這個 class 對應資料庫的一張表 |
| `@Table` | JPA | class | 指定對應的表名 |
| `@Getter` | Lombok | class | 自動產生 `getXxx()` |
| `@Setter` | Lombok | class | 自動產生 `setXxx()` |
| `@NoArgsConstructor` | Lombok | class | 自動產生沒有參數的建構子 |
| `@AllArgsConstructor` | Lombok | class | 自動產生包含所有欄位的建構子 |
| `@Builder` | Lombok | class | 可以用 `builder()...build()` 建立物件 |
| `@Id` | JPA | 欄位 | 標記主鍵 |
| `@GeneratedValue` | JPA | 欄位 | 主鍵由資料庫自動遞增產生 |
| `@Column` | JPA | 欄位 | 設定欄位名稱、可否為 NULL、是否唯一、長度、可否修改 |
| `@Enumerated` | JPA | 欄位 | enum 存成文字而不是數字 |
| `@CreationTimestamp` | Hibernate | 欄位 | 新增時自動填入當下時間 |
| `@UpdateTimestamp` | Hibernate | 欄位 | 修改時自動更新成當下時間 |
| `@Builder.Default` | Lombok | 欄位 | 用 `builder()` 建立物件時保留欄位的預設值 |
| `@ManyToOne` | JPA | 欄位 | 多對一關聯 |
| `@JoinColumn` | JPA | 欄位 | 指定外鍵欄位的名稱 |
| `@OneToMany` | JPA | 欄位 | 一對多關聯 |
| `@ManyToMany` | JPA | 欄位 | 多對多關聯 |
| `@JoinTable` | JPA | 欄位 | 指定多對多的中間表 |

## 一、寫在 class 上面

每個 Entity 的 class 上面都是這七行：

```java
@Entity
@Table(name = "members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Member {
```

| 語法 | 來源 | 作用 |
| --- | --- | --- |
| `@Entity` | JPA | 告訴 JPA 這個 class 對應資料庫的一張表 |
| `@Table(name = "members")` | JPA | 指定對應的表名 |
| `@Getter` | Lombok | 自動產生所有欄位的 `getXxx()` |
| `@Setter` | Lombok | 自動產生所有欄位的 `setXxx()` |
| `@NoArgsConstructor` | Lombok | 自動產生沒有參數的建構子（JPA 規定一定要有） |
| `@AllArgsConstructor` | Lombok | 自動產生包含所有欄位的建構子（`@Builder` 需要它） |
| `@Builder` | Lombok | 可以用 `Member.builder().email("...").build()` 建立物件 |

## 二、主鍵

```java
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;
```

| 語法 | 作用 |
| --- | --- |
| `@Id` | 標記這個欄位是主鍵 |
| `@GeneratedValue(strategy = GenerationType.IDENTITY)` | 主鍵由資料庫自動遞增產生，新增時不用自己給值 |

例外：`MemberProfile` 只有 `@Id` 沒有 `@GeneratedValue`，因為它的主鍵 `member_id` 直接用會員的 id，要自己給值。

```java
@Id
@Column(name = "member_id")
private Long memberId;
```

## 三、一般欄位 `@Column`

```java
@Column(name = "order_no", nullable = false, unique = true)
private String orderNo;
```

`@Column` 用來設定欄位，專案裡用到的屬性有這五個：

| 屬性 | 作用 | 專案裡的例子 |
| --- | --- | --- |
| `name` | 指定資料庫的欄位名稱 | `@Column(name = "image_url")` |
| `nullable` | `false` 表示不可以是 NULL（預設是 `true`） | `@Column(nullable = false)` |
| `unique` | `true` 表示值不可以重複 | `@Column(name = "sku_code", nullable = false, unique = true)` |
| `length` | 字串的最大長度（預設 255） | `@Column(nullable = false, length = 2000)` |
| `updatable` | `false` 表示新增後就不能再修改 | `@Column(name = "created_at", nullable = false, updatable = false)` |

什麼屬性都不寫的 `@Column`（例如 `Product.description`）等於全部用預設值。

## 四、enum 欄位

```java
@Enumerated(EnumType.STRING)
@Column(name = "shipping_method", nullable = false)
private ShippingMethod shippingMethod;
```

| 語法 | 作用 |
| --- | --- |
| `@Enumerated(EnumType.STRING)` | enum 存進資料庫時存成文字（例如 `HOME`、`CVS`），而不是存成數字 0、1 |

## 五、自動填時間

```java
@CreationTimestamp
@Column(name = "created_at", nullable = false, updatable = false)
private LocalDateTime createdAt;

@UpdateTimestamp
@Column(name = "last_viewed_at", nullable = false)
private LocalDateTime lastViewedAt;
```

| 語法 | 來源 | 作用 |
| --- | --- | --- |
| `@CreationTimestamp` | Hibernate | 新增資料時自動填入當下時間 |
| `@UpdateTimestamp` | Hibernate | 每次修改資料時自動更新成當下時間（只有 `MemberProductView` 用到） |

## 六、預設值 `@Builder.Default`

```java
@Builder.Default
private OrderStatus status = OrderStatus.PENDING;
```

| 語法 | 來源 | 作用 |
| --- | --- | --- |
| `@Builder.Default` | Lombok | 用 `builder()` 建立物件時，沒有指定這個欄位就用 `=` 後面的預設值；不加的話預設值會被忽略，變成 `null` |

## 七、關聯

### 多對一 `@ManyToOne` + `@JoinColumn`

```java
@ManyToOne(fetch = FetchType.LAZY, optional = false)
@JoinColumn(name = "member_id", nullable = false)
private Member member;
```

| 語法 | 作用 |
| --- | --- |
| `@ManyToOne` | 多對一關聯，例如多筆購物車項目屬於同一個會員 |
| `fetch = FetchType.LAZY` | 查這筆資料時先不查關聯的那一筆，等真的用到（例如 `getMember()`）才查 |
| `optional = false` | 這個關聯一定要有值，不可以是 `null` |
| `@JoinColumn(name = "member_id")` | 指定外鍵欄位的名稱 |
| `@JoinColumn(..., nullable = false)` | 外鍵欄位不可以是 NULL |

關聯可以沒有值的時候，就不寫 `optional = false` 和 `nullable = false`，例如 `Category.parent`（最上層分類沒有父分類）：

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "parent_id")
private Category parent;
```

### 一對多 `@OneToMany`

```java
@OneToMany(mappedBy = "coupon")
private List<MemberCoupon> memberCoupons;
```

| 語法 | 作用 |
| --- | --- |
| `@OneToMany` | 一對多關聯，例如一張折價券有多筆會員領取紀錄（只有 `Coupon` 用到） |
| `mappedBy = "coupon"` | 外鍵不在這一邊，而是由 `MemberCoupon` 裡的 `coupon` 欄位負責 |

### 多對多 `@ManyToMany` + `@JoinTable`

```java
@ManyToMany(fetch = FetchType.LAZY)
@JoinTable(
        name = "product_styles",
        joinColumns = @JoinColumn(name = "product_id"),
        inverseJoinColumns = @JoinColumn(name = "style_id")
)
@Builder.Default
private Set<Style> styles = new HashSet<>();
```

| 語法 | 作用 |
| --- | --- |
| `@ManyToMany` | 多對多關聯，例如一個商品有多個風格、一個風格也有多個商品 |
| `@JoinTable(name = "product_styles")` | 指定中間表的名稱 |
| `joinColumns` | 中間表裡指向「自己」（`Product`）的外鍵欄位 |
| `inverseJoinColumns` | 中間表裡指向「對方」（`Style`）的外鍵欄位 |

用到的地方：`Product.styles`（中間表 `product_styles`）、`CouponSchedule.members`（中間表 `coupon_schedule_members`）。
