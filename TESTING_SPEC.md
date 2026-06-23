# Testing Spec — mobile-retail-ai

> Tài liệu này dành cho **Hà**.C Tiến dùng để review: mỗi PR phải kèm test theo spec này và `npm test` phải xanh.
> Phạm vi: chạy hoàn toàn ở **local dev**, không cần server/CI.

## 1. Mục tiêu

- Mỗi lần sửa code, chạy 1 lệnh là biết code còn đúng hay không.
- Test phải chạy nhanh (vài giây), không phụ thuộc internet, không phụ thuộc MongoDB thật.
- Ưu tiên test phần **logic nghiệp vụ** (dễ sai, dễ ảnh hưởng tiền/đơn hàng) hơn là test giao diện.

## 2. Công cụ (stack test)

Cả backend và client đều dùng **Vitest** (vì project đang dùng ES modules `"type": "module"` — Vitest hỗ trợ sẵn, ít cấu hình hơn Jest).

| Lớp test | Công cụ | Lý do |
|---|---|---|
| Backend - logic thuần | Vitest | Test hàm tính giá, validate… không cần DB |
| Backend - API end-to-end | Vitest + **Supertest** | Gọi thử endpoint Express như client thật |
| Backend - DB | **mongodb-memory-server** | MongoDB chạy trong RAM, không cần cài Mongo, tự xóa sau test |
| Client - component/logic | Vitest + **@testing-library/react** + jsdom | Test render và tương tác UI |

Cài đặt (dev tự chạy):
```bash
# backend
cd backend
npm i -D vitest supertest mongodb-memory-server

# client
cd client
npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Thêm script vào **cả 2** `package.json`:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

- `npm test` → chạy 1 lần (dùng khi review / trước khi commit).
- `npm run test:watch` → chạy nền, tự chạy lại khi sửa code (dùng khi đang code).

## 3. Cấu trúc & quy ước

- File test đặt **cạnh file nguồn**, đặt tên `*.test.js` (vd: `tradeInService.test.js` cạnh `tradeInService.js`).
- Mỗi nhóm dùng `describe(...)`, mỗi case dùng `it("should ...")` mô tả rõ hành vi.
- Test phải **độc lập**: không dựa vào thứ tự chạy, mỗi test tự dọn dữ liệu.
- Đặt tên test bằng tiếng Việt hoặc tiếng Anh đều được, miễn mô tả đúng kỳ vọng.

## 4. Phạm vi & mục tiêu coverage

| Module | Bắt buộc test | Mục tiêu coverage |
|---|---|---|
| `services/tradeInService.js` (tính giá thu cũ) | ✅ Bắt buộc, kỹ nhất | 100% |
| `controllers/orderController.js` (đặt hàng, trừ kho, thanh toán) | ✅ Bắt buộc | ≥ 80% |
| `middleware/authMiddleware.js` (phân quyền) | ✅ Bắt buộc | ≥ 80% |
| `controllers/authController.js` (đăng ký/đăng nhập) | ✅ Bắt buộc | ≥ 80% |
| `controllers/productController.js` | Nên có | ≥ 60% |
| Client: `CartContext`, `AuthContext` | ✅ Bắt buộc | ≥ 70% |
| Client: trang/màn hình | Nên có (1–2 màn quan trọng) | best effort |

**Định nghĩa "xong":** `npm test` ở cả backend và client đều pass, không có test bị skip mà không ghi lý do.

## 5. Danh sách test case cụ thể (bám theo code hiện tại)

### 5.1 Trade-in (`tradeInService.test.js`) — QUAN TRỌNG NHẤT
Đây là logic tiền bạc, dễ sai, dễ chấm điểm:
- Model có trong bảng giá → trả đúng `basePrice`.
- Model không có trong bảng (vd "iphone 99") → `basePrice = 0`, `estimatedPrice = 0`.
- Tên model có chữ HOA/thường/khoảng trắng thừa → vẫn nhận đúng (test hàm chuẩn hóa).
- Pin < 80% → trừ 700.000; pin 80–85% → trừ 400.000; pin > 85% → không trừ.
- Màn hình `replaced` → trừ 1.000.000; `unknown` → trừ 500.000.
- Thân máy `light_scratches` → 300.000; `heavy_scratches` → 800.000.
- Face ID `broken` → trừ 1.200.000.
- Thiếu hộp/cáp → trừ 300.000.
- **Case tổng hợp:** máy dính nhiều lỗi cùng lúc → tổng trừ đúng, và `estimatedPrice` **không bao giờ âm** (phải = 0 nếu trừ quá base).
- Mảng `deductions` liệt kê đúng từng lý do.

### 5.2 Order API (`orderController` qua Supertest + mongodb-memory-server)
- Tạo đơn thành công → trả 201, đơn lưu DB, **kho bị trừ đúng số lượng**.
- Đặt số lượng > tồn kho → trả 400, **kho KHÔNG bị trừ**.
- `productId` không tồn tại → trả 400.
- `items` rỗng → trả 400.
- Thiếu tên/sđt/địa chỉ giao hàng → trả 400 đúng thông báo.
- `paymentMethod` không hợp lệ → trả 400.
- Mapping thanh toán: `cod`→`unpaid`, `bank_transfer`→`pending`, `online_mock`→`paid` + có `transactionId` dạng `MOCK-...`.
- Đặt đơn khi **chưa đăng nhập** (guest) → vẫn tạo được, `user = null`.
- Đặt đơn khi **đã đăng nhập** → `user` gắn đúng id.

### 5.3 Auth (`authController` + `authMiddleware`)
- Đăng ký thiếu trường → 400.
- Đăng ký email trùng → 400.
- Đăng ký thành công → mật khẩu **đã được hash** (không lưu plain text), trả về token + user (không kèm password).
- Đăng nhập sai mật khẩu / sai email → 401.
- Đăng nhập đúng → trả token hợp lệ.
- `protect`: không có token → 401; token sai → 401; token đúng → cho qua, gắn `req.user`.
- `protectAdmin`: user role `user` → 403; role `admin` → cho qua.
- `protectOptional`: không token → vẫn next (không lỗi).

### 5.4 Client - Cart (`CartContext.test.jsx`)
- Thêm sản phẩm mới → có trong giỏ, quantity = 1.
- Thêm lại sản phẩm đã có → quantity tăng, không tạo dòng mới.
- `decreaseQuantity` về 0 → sản phẩm bị xóa khỏi giỏ.
- `removeFromCart` → xóa đúng sản phẩm.
- `totalItems` tính đúng tổng số lượng.
- `clearCart` → giỏ rỗng.

### 5.5 Client - Auth (`AuthContext.test.jsx`)
- `login` → set user/token và lưu vào localStorage.
- `logout` → xóa state + localStorage.
- `isAuthenticated` đúng theo có/không có user+token.

### 5.6 Security tests (bám theo `SECURITY_SPEC.md`) — RẤT QUAN TRỌNG

Mỗi lỗ hổng sửa xong phải có test tái hiện kịch bản tấn công + chứng minh đã chặn. Đây là bằng chứng bảo mật khi bảo vệ đồ án.

- **S1 — IDOR đơn hàng:**
  - User A đăng nhập, xem đơn của User B → **403** (không lộ dữ liệu).
  - Không đăng nhập gọi `GET /api/orders/:id` → **401**.
  - Admin xem được mọi đơn → 200.
  - Chủ đơn xem đơn của chính mình → 200.
- **S2 — Price tampering:**
  - Gửi `items[].price` bịa thấp (vd 1đ) → đơn lưu **theo giá DB**, không theo giá client.
  - Gửi `totalAmount` sai → server tự tính lại đúng (hoặc trả 400 nếu lệch).
  - `quantity` ≤ 0 / không phải số → **400**.
- **S4 — Rate limit login:** gọi `/api/auth/login` vượt ngưỡng trong 1 phút → **429**.
- **S5 — Mass assignment:** tạo/sửa sản phẩm kèm field lạ (vd `role`, `_id`, `createdAt`, `__proto__`) → field lạ **bị bỏ qua**, không lưu vào DB.
- **S6 — Không lộ lỗi nội bộ:** ép lỗi hệ thống → response **không chứa** stack trace / thông điệp lỗi DB.
- **S8 — Regex injection:** `keyword` chứa ký tự regex (vd `(a+)+`, `.*`) → được escape, truy vấn không lỗi/không treo.
- **S9 — Cấu hình bí mật:** chạy app khi thiếu `JWT_SECRET`/`MONGODB_URI` → app **không khởi động** (hoặc test hàm kiểm tra cấu hình trả lỗi).
- **Phân quyền tổng quát:** mọi endpoint admin (`POST/PUT/DELETE /api/products`, `GET /api/orders`, `PATCH /api/orders/:id/status`) — gọi bằng token user thường → **403**; không token → **401**.
- **Auth (đã nêu ở 5.3, nhấn lại ở góc độ bảo mật):** mật khẩu được hash (không lưu plain text); response đăng nhập/đăng ký **không kèm trường password**.

> Lưu ý thứ tự làm: phần này chỉ viết được **sau khi** dev đã sửa lỗ hổng tương ứng trong `SECURITY_SPEC.md`. Trước đó, có thể viết test ở dạng "kỳ vọng" (đang fail) để đánh dấu việc cần làm.

## 6. Quy tắc cho Hà (để cậu review dễ)

1. **Không sửa logic nghiệp vụ mà không cập nhật/ thêm test tương ứng.**
2. Mọi bug được fix phải kèm 1 test tái hiện bug đó (chống tái phát).
3. Test phải tự tạo và tự dọn dữ liệu (`beforeEach`/`afterEach`), không để lại rác trong DB in-memory.
4. Không gọi API thật/internet trong test.
5. Trước khi báo "xong 1 task": chạy `npm test` ở cả backend lẫn client, dán kết quả vào PR.
