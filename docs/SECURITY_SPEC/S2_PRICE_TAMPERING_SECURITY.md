# S2 - Chặn Price Tampering khi tạo đơn hàng

- Task Name: Chặn backend tin giá và tổng tiền do client gửi
- Status: DONE
- Last Updated: 2026-06-23

## Mục tiêu

- Chặn lỗ hổng bảo mật S2: client tự sửa `price` hoặc `totalAmount` khi gọi `POST /api/orders`.
- Đảm bảo backend chỉ tin:
  - `productId`
  - `quantity`
  - thông tin giao hàng
  - phương thức thanh toán
- Backend phải tự lấy giá thật từ `Product` trong MongoDB và tự tính lại tổng tiền trước khi lưu order.

## File đã sửa

- `backend/controllers/orderController.js`

## File đã tạo

- `backend/routes/orderRoutes.priceTampering.test.js`

## Hiện trạng cũ

Trước khi sửa:

- frontend `CheckoutPage` gửi:
  - `items[].productId`
  - `items[].name`
  - `items[].price`
  - `items[].quantity`
  - `items[].image`
  - `totalAmount`
- backend `createOrder` có query `Product` thật để kiểm tra tồn kho
- nhưng vẫn lưu thẳng:
  - `items`
  - `totalAmount`

Điều này tạo ra lỗ hổng:

- attacker có thể sửa `price` trong request
- attacker có thể sửa `totalAmount` trong request
- nếu backend tin dữ liệu này thì order lưu sai giá thật

## Logic cũ

Luồng cũ:

1. nhận `items` và `totalAmount` từ client
2. query `Product` để kiểm tra tồn kho
3. tạo order bằng chính `items` client gửi lên
4. lưu `totalAmount` client gửi lên

Điểm sai:

- backend dùng DB để kiểm tra stock
- nhưng lại không dùng DB để chốt giá

## Logic mới

Luồng mới:

1. nhận `items` từ client
2. chỉ lấy ra:
  - `productId`
  - `quantity`
3. validate:
  - phải có `productId`
  - `quantity` phải là số nguyên >= 1
4. query `Product` thật từ MongoDB
5. tự dựng `orderItems` mới từ DB:
  - `productId`
  - `name` từ `product.name`
  - `price` từ `product.price`
  - `quantity` từ dữ liệu đã validate
  - `image` từ `product.images[0]`
6. tự tính `calculatedTotalAmount`
7. tạo `Order` bằng:
  - `items: orderItems`
  - `totalAmount: calculatedTotalAmount`

## Nội dung thay đổi chi tiết

### 1. Không còn dùng `totalAmount` từ client

Trong `createOrder`, field `totalAmount` đã được bỏ khỏi destructure của `req.body`.

Ý nghĩa:

- backend không còn tin tổng tiền frontend gửi lên

### 2. Thêm bước chuẩn hóa `items`

Backend tạo `normalizedRequestItems`:

- ép `productId` thành chuỗi
- ép `quantity` thành số

Ý nghĩa:

- tách dữ liệu tối thiểu backend cần tin khỏi dữ liệu thừa do client gửi lên

### 3. Thêm validate `productId` và `quantity`

Backend chặn:

- thiếu `productId`
- `quantity < 1`
- `quantity` không phải số nguyên

### 4. Tự dựng `orderItems`

Backend không dùng lại `name`, `price`, `image` từ client.

Thay vào đó lấy từ `Product` thật trong database.

### 5. Tự tính `calculatedTotalAmount`

Backend cộng:

```text
price thật * quantity thật
```

cho từng item để ra tổng tiền cuối cùng.

### 6. Trừ kho theo `orderItems`

Sau khi tạo order, backend trừ kho dựa trên `orderItems` đã chuẩn hóa, không dựa trên item client gửi lên.

## Test tự động đã thêm

File:

- `backend/routes/orderRoutes.priceTampering.test.js`

### Case 1 - Client gửi giá giả

Test tạo:

- 1 `Product` thật trong DB với giá `10.000.000`

Sau đó gửi request tạo đơn với:

- `price = 1000`
- `totalAmount = 2000`
- `name` giả
- `image` giả

Kỳ vọng:

- response vẫn tạo đơn thành công
- `items[0].price` phải bằng `10000000`
- `items[0].name` phải bằng tên thật trong DB
- `items[0].image` phải bằng ảnh thật trong DB
- `totalAmount` phải bằng `20000000`

### Case 2 - Quantity không hợp lệ

Gửi:

- `quantity = 0`

Kỳ vọng:

- trả `400`
- message: `Item quantity must be at least 1`

## Kết quả test

Đã chạy:

```bash
cd backend
npm test
```

Kết quả:

- `3 test files passed`
- `15 tests passed`

Bao gồm:

- `tradeInService.test.js`
- `orderRoutes.security.test.js`
- `orderRoutes.priceTampering.test.js`

## Manual Test Checklist

- [x] Gửi order với `items[].price` giả -> backend vẫn lưu giá thật từ DB
- [x] Gửi order với `totalAmount` giả -> backend vẫn lưu tổng thật do server tính
- [x] Gửi `quantity = 0` -> backend trả `400`
- [x] Backend vẫn tạo order thành công với payload hợp lệ
- [x] Test cũ S1 vẫn pass sau khi sửa S2

## Giá trị bảo mật đạt được

Sau task này:

- client không thể mua rẻ hơn bằng cách sửa `price`
- client không thể gửi `totalAmount` giả để backend tin theo
- order lưu đúng giá thật từ hệ thống
- tổng tiền trong order được server tính lại

## Ghi chú phục vụ bảo vệ đồ án

- Đây là lỗi bảo mật rất quan trọng vì liên quan trực tiếp đến tiền và doanh thu.
- Cách sửa đúng không phải là “kiểm tra thêm ở frontend”.
- Cách sửa đúng là:
  - backend không tin client
  - backend tự lấy giá từ DB
  - backend tự tính tổng tiền
- Test tự động đã được thêm để chứng minh backend đã chặn được kịch bản tấn công này.
