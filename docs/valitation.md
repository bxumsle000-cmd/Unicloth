# Spring Boot DTO 常見驗證（Bean Validation）

DTO 驗證在 Spring Boot 裡通常用 **Jakarta Bean Validation**（實作是 Hibernate Validator），在欄位上加註解就能做檢查。

---

## 前置條件（沒做會完全沒效果）

### 1. 加依賴

Spring Boot 2.3 之後 `spring-boot-starter-web` 不再內建驗證，要自己加：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

### 2. Controller 參數要加 `@Valid`

不加的話 DTO 上的註解全部不會執行。

### 3. 套件名稱

| Spring Boot 版本 | import 套件 |
|---|---|
| Spring Boot 3 | `jakarta.validation.constraints.*` |
| Spring Boot 2 | `javax.validation.constraints.*` |

import 錯會編譯失敗。

---

## 常見註解

| 註解 | 用途 | 常用在 |
|---|---|---|
| `@NotNull` | 不可為 null | 任何型別 |
| `@NotEmpty` | 不可為 null，且長度/大小不可為 0 | String、List、Map |
| `@NotBlank` | 不可為 null，且去掉空白後不可為空字串 | **只能用在 String** |
| `@Size(min, max)` | 長度或元素數量範圍 | String、List |
| `@Min` / `@Max` | 整數最小/最大值 | int、long、Integer |
| `@DecimalMin` / `@DecimalMax` | 小數最小/最大值 | BigDecimal、double |
| `@Positive` / `@PositiveOrZero` | 正數 / 正數或 0 | 數字 |
| `@Negative` / `@NegativeOrZero` | 負數 / 負數或 0 | 數字 |
| `@Digits(integer, fraction)` | 限制整數位數與小數位數 | BigDecimal（例如金額） |
| `@Email` | Email 格式 | String |
| `@Pattern(regexp)` | 自訂正規表達式 | String（例如手機號碼） |
| `@Past` / `@PastOrPresent` | 過去的日期 | LocalDate（例如生日） |
| `@Future` / `@FutureOrPresent` | 未來的日期 | LocalDate（例如預約日） |
| `@AssertTrue` / `@AssertFalse` | 必須為 true / false | boolean（例如同意條款） |
| `@Valid` | 驗證巢狀物件內部的欄位 | DTO 裡的另一個 DTO 或 List |

### `@NotNull` / `@NotEmpty` / `@NotBlank` 差別

| 值 | `@NotNull` | `@NotEmpty` | `@NotBlank` |
|---|---|---|---|
| `null` | ❌ | ❌ | ❌ |
| `""` | ✅ | ❌ | ❌ |
| `"   "` | ✅ | ✅ | ❌ |

> 使用者輸入的文字欄位（名稱、帳號）通常用 `@NotBlank`。

---

## 範例

### DTO

```java
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class UserCreateRequest {

    @NotBlank(message = "名稱不可為空")
    @Size(max = 50, message = "名稱最多 50 字")
    private String name;

    @NotBlank(message = "Email 不可為空")
    @Email(message = "Email 格式錯誤")
    private String email;

    @NotBlank
    @Pattern(regexp = "^09\\d{8}$", message = "手機格式錯誤")
    private String phone;

    @NotNull
    @Min(value = 18, message = "年齡需滿 18 歲")
    @Max(150)
    private Integer age;

    @Past(message = "生日必須是過去的日期")
    private LocalDate birthday;

    @NotNull
    @Digits(integer = 8, fraction = 2)
    @PositiveOrZero
    private BigDecimal balance;

    @AssertTrue(message = "必須同意服務條款")
    private boolean agreeTerms;

    @Valid                 // 沒加這個，AddressDto 裡面的註解不會被檢查
    @NotNull
    private AddressDto address;

    @NotEmpty
    private List<@NotBlank String> tags;   // 驗證 List 裡每個元素

    // getters / setters 省略
}
```

### Controller

```java
@PostMapping("/users")
public ResponseEntity<String> create(@Valid @RequestBody UserCreateRequest request) {
    return ResponseEntity.ok("success");
}
```

### 統一處理驗證錯誤

驗證失敗時，Spring 會丟出 `MethodArgumentNotValidException`，預設回傳 400。
如果想把錯誤訊息整理成自己的格式，可以用 `@RestControllerAdvice` 統一處理：

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
          .forEach(e -> errors.put(e.getField(), e.getDefaultMessage()));
        return ResponseEntity.badRequest().body(errors);
    }
}
```

---

## 容易踩的坑

### 🔴 會造成錯誤或驗證失效的

- **null 會直接通過大部分註解**
  `@Email`、`@Size`、`@Min`、`@Pattern` 等遇到 null 都視為合法。如果欄位是必填，要再加 `@NotNull` 或 `@NotBlank`，像範例中 email 那樣疊兩個。
- **巢狀物件忘了加 `@Valid`**
  內層欄位不會被驗證，而且不會報錯，很難發現。
- **`@NotBlank` 用在非 String 的欄位**
  例如用在 Integer，執行時會丟出 `UnexpectedTypeException`。
- **數字欄位用 `int` 而不是 `Integer`**
  前端沒傳值時，`int` 會變成 0，`@NotNull` 檢查不到。必填的數字欄位建議用包裝型別。

### 🟡 風格上的建議（不影響運作）

- `message` 建議都寫上，否則預設訊息是英文。
- 簡單規則用 `@Pattern` 就好；跨欄位的規則（例如「密碼」與「確認密碼」要相同）需要自訂驗證註解，等熟悉基本用法後再學即可。