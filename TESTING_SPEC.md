# Testing Spec - mobile-retail-ai

> Tài liệu này mô tả chuẩn kiểm thử cho dự án `mobile-retail-ai`.
> Mục tiêu là đảm bảo các thay đổi quan trọng đều có test đi kèm và `npm test` chạy thành công trong môi trường local development.
> Phạm vi: chạy hoàn toàn ở local dev, không phụ thuộc CI hay MongoDB thật nếu không cần.

## 1. Mục tiêu

- Mỗi lần sửa code, chỉ cần chạy một lệnh là biết logic còn đúng hay không.
- Test phải chạy nhanh trong vài giây, không phụ thuộc internet, không phụ thuộc MongoDB thật.
- Ưu tiên test phần logic nghiệp vụ dễ sai và ảnh hưởng trực tiếp đến tiền, đơn hàng, phân quyền hơn là test giao diện thuần túy.

## 2. Công cụ

Toàn bộ dự án dùng **Vitest** vì codebase đang chạy ES Modules (`"type": "module"`), cấu hình gọn và phù hợp local development.

| Lớp test | Công cụ | Mục đích |
|---|---|---|
| Backend - logic thuần | Vitest | Test hàm tính giá, validate, helper |
| Backend - API | Vitest + Supertest | Gọi thử endpoint Express như client thật |
| Backend - DB | mongodb-memory-server | Dùng MongoDB trong RAM, không cần MongoDB thật |
| Client - component/logic | Vitest + @testing-library/react + jsdom | Test render và tương tác UI |

### Cài đặt

```bash
# backend
cd backend
npm i -D vitest supertest mongodb-memory-server

# client
cd client
npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

### Scripts cần có trong `package.json`

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

- `npm test`: chạy test một lần, dùng trước khi commit hoặc review.
- `npm run test:watch`: chạy nền, tự test lại khi sửa code.
- `npm run test:coverage`: chạy test và đo coverage.

## 3. Cấu trúc và quy ước

- File test đặt cạnh file nguồn, đặt tên dạng `*.test.js` hoặc `*.test.jsx`.
- Mỗi nhóm test dùng `describe(...)`.
- Mỗi ca test dùng `it("should ...")` hoặc tên tiếng Việt mô tả rõ hành vi.
- Test phải độc lập, không phụ thuộc thứ tự chạy.
- Mỗi test tự chuẩn bị và tự dọn dữ liệu nếu có side effect.

## 4. Phạm vi và mục tiêu coverage

| Module | Mức ưu tiên | Coverage mục tiêu |
|---|---|---|
| `services/tradeInService.js` | Bắt buộc, ưu tiên cao nhất | 100% |
| `controllers/orderController.js` | Bắt buộc | >= 80% |
| `middleware/authMiddleware.js` | Bắt buộc | >= 80% |
| `controllers/authController.js` | Bắt buộc | >= 80% |
| `controllers/productController.js` | Nên có | >= 60% |
| `client/src/context/CartContext.jsx` | Bắt buộc | >= 70% |
| `client/src/context/AuthContext.jsx` | Bắt buộc | >= 70% |
| Các trang frontend quan trọng | Nên có | Best effort |

**Định nghĩa hoàn thành:** `npm test` ở cả backend và client đều pass, không có test bị skip mà không ghi rõ lý do.

## 5. Danh sách test case cụ thể

### 5.1 Trade-in (`tradeInService.test.js`) - ưu tiên cao nhất

Đây là logic tiền bạc, dễ sai, cần test kỹ:

- Model có trong bảng giá -> trả đúng `basePrice`
- Model không có trong bảng giá -> `basePrice = 0`, `estimatedPrice = 0`
- Tên model có chữ hoa, chữ thường, khoảng trắng thừa -> vẫn nhận đúng
- Pin < 80% -> trừ 700.000
- Pin từ 80% đến 85% -> trừ 400.000
- Pin > 85% -> không trừ
- `displayStatus = "replaced"` -> trừ 1.000.000
- `displayStatus = "unknown"` -> trừ 500.000
- `bodyCondition = "light_scratches"` -> trừ 300.000
- `bodyCondition = "heavy_scratches"` -> trừ 800.000
- `faceIdStatus = "broken"` -> trừ 1.200.000
- `accessoryStatus = "missing_box_or_cable"` -> trừ 300.000
- Case tổng hợp nhiều lỗi cùng lúc -> tổng trừ đúng, `estimatedPrice` không âm
- Mảng `deductions` liệt kê đúng lý do và số tiền

### 5.2 Order API (`orderController` qua Supertest + mongodb-memory-server)

- Tạo đơn thành công -> trả 201, đơn lưu DB, kho bị trừ đúng
- Đặt số lượng lớn hơn tồn kho -> trả 400, kho không bị trừ
- `productId` không tồn tại -> trả 400
- `items` rỗng -> trả 400
- Thiếu thông tin giao hàng bắt buộc -> trả 400
- `paymentMethod` không hợp lệ -> trả 400
- Mapping thanh toán:
  - `cod` -> `unpaid`
  - `bank_transfer` -> `pending`
  - `online_mock` -> `paid` + có `transactionId`
- Đặt đơn khi chưa đăng nhập -> vẫn tạo được, `user = null`
- Đặt đơn khi đã đăng nhập -> `user` gắn đúng `req.user._id`

### 5.3 Auth (`authController` + `authMiddleware`)

- Đăng ký thiếu trường -> 400
- Đăng ký email trùng -> 400
- Đăng ký thành công:
  - password được hash
  - response không trả password
  - có token + user
- Đăng nhập sai email hoặc sai password -> 401
- Đăng nhập đúng -> có token hợp lệ
- `protect`:
  - không token -> 401
  - token sai -> 401
  - token đúng -> next và gắn `req.user`
- `protectAdmin`:
  - role `user` -> 403
  - role `admin` -> cho qua
- `protectOptional`:
  - không token -> vẫn next

### 5.4 Client - Cart (`CartContext.test.jsx`)

- Thêm sản phẩm mới -> có trong giỏ, quantity = 1
- Thêm lại sản phẩm cũ -> quantity tăng, không tạo dòng mới
- `decreaseQuantity` về 0 -> xóa sản phẩm
- `removeFromCart` -> xóa đúng item
- `totalItems` tính đúng tổng số lượng
- `clearCart` -> giỏ hàng rỗng

### 5.5 Client - Auth (`AuthContext.test.jsx`)

- `login` -> set user/token và lưu localStorage
- `logout` -> xóa state và localStorage
- `isAuthenticated` phản ánh đúng theo có/không có user và token

### 5.6 Security tests (tham chiếu `SECURITY_SPEC.md`)

Sau khi sửa lỗ hổng bảo mật tương ứng, phải có test tái hiện và chứng minh đã chặn được:

- **S1 - IDOR đơn hàng**
  - User A không xem được đơn của User B -> 403
  - Chưa đăng nhập -> 401
  - Admin xem được mọi đơn -> 200
- **S2 - Price tampering**
  - Client gửi giá giả -> server vẫn dùng giá DB
  - Client gửi `totalAmount` sai -> server tự tính lại hoặc trả 400
  - `quantity <= 0` hoặc sai kiểu -> 400
- **S4 - Rate limit login**
  - Gọi `/api/auth/login` vượt ngưỡng -> 429
- **S5 - Mass assignment**
  - Gửi field lạ khi tạo/sửa product -> field lạ bị bỏ qua
- **S6 - Không lộ lỗi nội bộ**
  - Response không trả stack trace hoặc lỗi DB chi tiết
- **S8 - Regex injection**
  - Keyword chứa regex độc -> được escape, không treo, không lỗi
- **S9 - Cấu hình bí mật**
  - Thiếu `JWT_SECRET` hoặc `MONGODB_URI` -> app không khởi động
- **Phân quyền tổng quát**
  - Token user thường gọi endpoint admin -> 403
  - Không token gọi endpoint admin -> 401

## 6. Quy tắc thực hiện

1. Không sửa logic nghiệp vụ mà không cập nhật hoặc bổ sung test tương ứng.
2. Mỗi bug được fix phải có ít nhất một test tái hiện bug đó.
3. Test phải tự chuẩn bị và tự dọn dữ liệu.
4. Không gọi internet hay API bên ngoài trong test.
5. Trước khi báo hoàn thành một task quan trọng, cần chạy `npm test` ở backend và client.

## 7. Thứ tự triển khai đề xuất

1. `tradeInService.test.js`
2. `authMiddleware.test.js`
3. `authController.test.js`
4. `orderController.test.js`
5. `CartContext.test.jsx`
6. `AuthContext.test.jsx`
7. Security tests theo `SECURITY_SPEC.md`

## 8. Ghi chú

- Mục tiêu của tài liệu này là tạo một chuẩn kiểm thử rõ ràng, có thể dùng lâu dài cho dự án.
- Nếu phạm vi dự án thay đổi, file spec này cần được cập nhật cùng với logic mới.
