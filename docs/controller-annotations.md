# Controller 用到的語法整理

整理 `src/main/java/com/EEIT25/unicloth/controller/` 底下 27 個 Controller 實際用到的 annotation，每個只列一次。

## 總表

| 語法 | 來源 | 寫在哪 | 作用 |
| --- | --- | --- | --- |
| `@RestController` | Spring | class | 這個 class 是 API，方法的回傳值會轉成 JSON 回給前端 |
| `@Controller` | Spring | class | 這個 class 是一般 Controller，回傳的字串是要去的頁面 |
| `@RequestMapping` | Spring | class | 這個 class 所有 API 共用的網址開頭 |
| `@RequiredArgsConstructor` | Lombok | class | 自動產生建構子，把 `final` 的 Service 注入進來 |
| `@Slf4j` | Lombok | class | 自動產生 `log` 變數，可以寫 `log.warn(...)` |
| `@GetMapping` | Spring | 方法 | 處理 GET 請求（查詢） |
| `@PostMapping` | Spring | 方法 | 處理 POST 請求（新增） |
| `@PutMapping` | Spring | 方法 | 處理 PUT 請求（整筆修改） |
| `@PatchMapping` | Spring | 方法 | 處理 PATCH 請求（修改一部分） |
| `@DeleteMapping` | Spring | 方法 | 處理 DELETE 請求（刪除） |
| `@ResponseStatus` | Spring | 方法 | 指定成功時回傳的 HTTP 狀態碼 |
| `@PathVariable` | Spring | 參數 | 取網址路徑裡 `{}` 的值 |
| `@RequestParam` | Spring | 參數 | 取網址 `?` 後面的值 |
| `@RequestBody` | Spring | 參數 | 把請求內容的 JSON 轉成物件 |
| `@Valid` | Jakarta Validation | 參數 | 檢查物件裡的驗證規則（例如 `@NotBlank`） |
| `@ModelAttribute` | Spring | 參數 | 把網址 `?` 後面的多個值裝成一個物件 |
| `@RequestPart` | Spring | 參數 | 取上傳的檔案 |
| `@DateTimeFormat` | Spring | 參數 | 指定日期字串的格式，轉成 `LocalDate` |
| `@PageableDefault` | Spring Data | 參數 | 分頁的預設值（每頁幾筆、依什麼排序） |
| `@ParameterObject` | springdoc | 參數 | 讓 Swagger 文件把物件的欄位拆開顯示 |

## 一、寫在 class 上面

```java
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/cart")
public class CartController {
    private final CartItemService cartItemService;
```

| 語法 | 作用 |
| --- | --- |
| `@RestController` | 這個 class 是 API，方法的回傳值會轉成 JSON 回給前端 |
| `@RequiredArgsConstructor` | 自動產生建構子，Spring 透過它把 `final` 的 `cartItemService` 注入進來 |
| `@RequestMapping("/api/cart")` | 這個 class 裡所有 API 的網址都以 `/api/cart` 開頭 |

### `@Slf4j`

只有 `EcpayController` 用到，加了之後可以直接用 `log`：

```java
@Slf4j
@RestController
public class EcpayController {
    ...
    log.warn("ECPay callback rejected: {}", ex.getMessage());
```

### `@Controller`

只有 `SpaForwardController` 用到。跟 `@RestController` 的差別是回傳的字串不會當成資料回給前端，而是當成要去的頁面：

```java
@Controller
public class SpaForwardController {

    @GetMapping({ "/cart", "/checkout", "/member/**", "/admin/**" })
    public String forwardToIndex() {
        return "forward:/index.html";
    }
}
```

## 二、對應 HTTP 方法

```java
@GetMapping
public List<CartItemResponse> getCartItems() { ... }

@PostMapping
public void add(...) { ... }

@PatchMapping
public void changeQty(...) { ... }

@PutMapping("/{id}")
public void editCoupon(...) { ... }

@DeleteMapping("/{cartItemId}")
public void remove(...) { ... }
```

| 語法 | 對應請求 | 專案裡的用途 |
| --- | --- | --- |
| `@GetMapping` | GET | 查詢資料 |
| `@PostMapping` | POST | 新增資料 |
| `@PutMapping` | PUT | 整張表單一起送的修改 |
| `@PatchMapping` | PATCH | 只改一部分，例如改數量、啟用、取消 |
| `@DeleteMapping` | DELETE | 刪除資料 |

括號裡的路徑會接在 class 的 `@RequestMapping` 後面，例如 `@DeleteMapping("/{cartItemId}")` 的完整網址是 `/api/cart/{cartItemId}`。不寫括號就是直接用 `/api/cart`。

括號裡用到的屬性：

| 屬性 | 作用 | 專案裡的例子 |
| --- | --- | --- |
| `value` | 路徑（同時寫其他屬性時才需要寫出 `value =`） | `@GetMapping(value = "/overview", ...)` |
| `consumes` | 限定前端送來的內容格式 | `consumes = MediaType.MULTIPART_FORM_DATA_VALUE`（上傳檔案） |
| `produces` | 指定回傳的內容格式 | `produces = MediaType.APPLICATION_JSON_VALUE` |
| `{ "...", "..." }` | 一個方法同時對應多個路徑 | `@GetMapping({ "/cart", "/checkout" })` |

## 三、回傳的狀態碼 `@ResponseStatus`

```java
@PostMapping
@ResponseStatus(HttpStatus.NO_CONTENT)
public void add(@Valid @RequestBody AddCartItemRequest request) {
```

不寫的話成功時回 200。專案裡用到兩種：

| 寫法 | 狀態碼 | 用在 |
| --- | --- | --- |
| `@ResponseStatus(HttpStatus.CREATED)` | 201 | 新增成功，而且有回傳資料 |
| `@ResponseStatus(HttpStatus.NO_CONTENT)` | 204 | 成功但沒有回傳資料（方法是 `void`） |

## 四、方法的參數

### `@PathVariable`：取路徑裡的值

```java
@DeleteMapping("/{cartItemId}")
public void remove(@PathVariable Long cartItemId) {
```

前端呼叫 `DELETE /api/cart/5`，`cartItemId` 就是 `5`。參數名稱要跟 `{}` 裡的名稱一樣。

### `@RequestParam`：取 `?` 後面的值

```java
@GetMapping("/products")
public String getProductSales(@RequestParam(defaultValue = "30d") String range,
                              @RequestParam(required = false) Long main) {
```

前端呼叫 `/products?range=7d&main=3`，`range` 是 `"7d"`、`main` 是 `3`。

| 寫法 | 作用 |
| --- | --- |
| `@RequestParam` | 一定要帶，沒帶會回 400 |
| `@RequestParam(required = false)` | 可以不帶，沒帶就是 `null` |
| `@RequestParam(defaultValue = "30d")` | 可以不帶，沒帶就用預設值 |
| `@RequestParam("colorCode")` | 指定網址上的參數名稱 |
| `@RequestParam Map<String, String> params` | 把所有參數一次收進 Map（`EcpayController` 接綠界通知用） |

### `@RequestBody` + `@Valid`：取請求內容的 JSON

```java
public void add(@Valid @RequestBody AddCartItemRequest request) {
```

| 語法 | 作用 |
| --- | --- |
| `@RequestBody` | 把前端送來的 JSON 轉成 `AddCartItemRequest` 物件 |
| `@Valid` | 檢查 `AddCartItemRequest` 裡寫的驗證規則，不合格就回 400，不會進到方法裡 |

### `@ModelAttribute`：把多個查詢參數裝成一個物件

```java
@GetMapping
public Page<StaffResponse> getStaff(
        @ParameterObject @ModelAttribute StaffFilterRequest filter,
        @ParameterObject @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
```

前端呼叫 `?keyword=sys&department=ADMIN&status=ACTIVE`，三個值會自動放進 `StaffFilterRequest` 對應的欄位，不用寫三個 `@RequestParam`。

### `@PageableDefault`：分頁預設值

用在 `Pageable` 參數前面（例子同上）。前端沒帶 `page`、`size`、`sort` 時就用這裡設定的值。

| 屬性 | 作用 |
| --- | --- |
| `size` | 每頁幾筆 |
| `sort` | 依哪個欄位排序 |
| `direction` | `Sort.Direction.ASC` 由小到大、`Sort.Direction.DESC` 由大到小 |

### `@ParameterObject`：給 Swagger 文件用

加在 `Pageable` 和 `@ModelAttribute` 的物件前面，讓 Swagger 文件把物件裡的欄位（`page`、`size`、`keyword`……）一個一個列出來。只影響文件顯示，不影響 API 的行為。

### `@DateTimeFormat`：日期格式

```java
@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
```

前端帶 `?start=2026-10-01`，會照 `yyyy-MM-dd` 的格式轉成 `LocalDate`。

### `@RequestPart`：上傳檔案

```java
@PostMapping(
        value = "/{productId}/images",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
)
@ResponseStatus(HttpStatus.CREATED)
public AdminProductImageResponse uploadImage(
        @PathVariable Long productId,
        @RequestParam("colorCode") String colorCode,
        @RequestPart("image") MultipartFile image
) {
```

`@RequestPart("image")` 取出表單裡名稱是 `image` 的檔案，型別是 `MultipartFile`。只有 `AdminProductController` 上傳商品圖片用到。

## 五、回傳型別

這部分不是 annotation，但每個 Controller 都會用到。

| 回傳型別 | 作用 | 專案裡的例子 |
| --- | --- | --- |
| DTO 或 `List<DTO>` | 轉成 JSON 回給前端 | `List<CartItemResponse> getCartItems()` |
| `Page<DTO>` | 分頁結果，包含資料和總頁數、總筆數 | `Page<StaffResponse> getStaff(...)` |
| `void` | 不回傳資料，通常搭配 `@ResponseStatus(HttpStatus.NO_CONTENT)` | `void remove(...)` |
| `ResponseEntity<T>` | 自己決定狀態碼、header、內容 | `AdminMktSalesController` 匯出 Excel、`EcpayController` 回覆綠界 |

`ResponseEntity` 的例子（匯出 Excel 要自己設定檔名和檔案類型）：

```java
return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(fileName).build().toString())
        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
        .body(adminSalesService.exportOverview(start, end));
```
