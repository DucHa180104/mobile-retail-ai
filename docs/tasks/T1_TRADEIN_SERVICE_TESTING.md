# T1 - Kiểm thử `tradeInService`

- **Trạng thái:** IN PROGRESS
- **Cập nhật lần cuối:** 2026-06-23

## Mục tiêu

- Thiết lập test backend đầu tiên theo `TESTING_SPEC.md`.
- Kiểm thử logic thu cũ trong `backend/services/tradeInService.js`.
- Xác nhận Vitest ở backend đã chạy được thật, không còn ở trạng thái "chưa có test file".

## Bối cảnh

Theo `TESTING_SPEC.md`, module `tradeInService.js` là phần ưu tiên test đầu tiên vì:

- Là logic tính tiền, dễ sai và ảnh hưởng trực tiếp đến kết quả estimate.
- Là hàm thuần, không cần MongoDB, không cần Express, không cần frontend.
- Phù hợp để dựng bộ test đầu tiên cho dự án.

Trước khi viết test:

- `backend/package.json` đã được thêm script:
  - `test`
  - `test:watch`
  - `test:coverage`
- Chạy `npm test` trong backend báo:
  - `No test files found`

Điều này cho thấy:

- Cấu hình Vitest backend đã hoạt động.
- Dự án chỉ đang thiếu file test thật.

## File đã tạo

- `backend/services/tradeInService.test.js`

## File liên quan

- `backend/services/tradeInService.js`
- `backend/package.json`
- `TESTING_SPEC.md`

## Nội dung đã làm

Đã tạo file test đầu tiên cho backend bằng Vitest:

- Import:
  - `describe`
  - `it`
  - `expect`
- Import 2 hàm cần test:
  - `getBasePrice`
  - `calculateTradeInEstimate`

Đã viết **9 test case đầu tiên**:

1. Model có trong bảng giá trả đúng `basePrice`
2. Tên model có chữ hoa + khoảng trắng thừa vẫn được chuẩn hóa đúng
3. Model không có trong bảng giá trả `0`
4. Pin dưới `80%` bị trừ `700000`
5. Nhiều deduction cùng lúc cộng đúng và `estimatedPrice` không âm
6. Pin từ `80%` đến `85%` bị trừ `400000`
7. Pin trên `85%` không bị trừ
8. `displayStatus = "unknown"` bị trừ `500000`
9. Model không có trong bảng giá nhưng có nhiều lỗi vẫn trả `estimatedPrice = 0`

## Cách viết test

### Mức test đang dùng

- Đây là **unit test**
- Test trực tiếp từng hàm trong service
- Không cần:
  - server Express
  - route
  - controller
  - database

### Nguyên tắc áp dụng

- Mỗi `it(...)` kiểm tra 1 rule hoặc 1 nhóm rule rõ ràng.
- Ưu tiên input đơn giản, dễ đọc.
- Khi cần test object/mảng, dùng `toEqual(...)`.
- Khi cần test giá trị số đơn, dùng `toBe(...)`.
- Có thêm case chặn số âm bằng `Math.max(..., 0)` để bám đúng spec.

## Lệnh đã chạy

Chạy tại thư mục `backend`:

```bash
npm.cmd test
```

## Kết quả đạt được

Kết quả test backend:

- `1 test file passed`
- `9 tests passed`

Vitest đã chạy thành công:

- Không còn lỗi `No test files found`
- Bộ test đầu tiên của backend đã hoạt động thật

## Checklist pass / fail hiện tại

### Case đã pass

- [x] Model có trong bảng giá trả đúng `basePrice`
- [x] Tên model có chữ hoa và khoảng trắng thừa vẫn được chuẩn hóa đúng
- [x] Model không có trong bảng giá trả `0`
- [x] Pin dưới `80%` bị trừ `700000`
- [x] Pin từ `80%` đến `85%` bị trừ `400000`
- [x] Pin trên `85%` không bị trừ
- [x] `displayStatus = "unknown"` bị trừ `500000`
- [x] Nhiều deduction cùng lúc cộng đúng
- [x] `estimatedPrice` không âm
- [x] Model không có trong bảng giá nhưng nhiều lỗi vẫn trả `estimatedPrice = 0`

### Case chưa làm

- [ ] `displayStatus = "replaced"` bị trừ `1000000`
- [ ] `bodyCondition = "light_scratches"` bị trừ `300000`
- [ ] `bodyCondition = "heavy_scratches"` ở case đơn
- [ ] `faceIdStatus = "broken"` ở case đơn
- [ ] `accessoryStatus = "missing_box_or_cable"` ở case đơn
- [ ] Case tổng hợp kiểm tra đầy đủ mọi deduction theo đúng thứ tự mong muốn của spec
- [ ] Chạy `test:coverage` và ghi nhận tỷ lệ coverage thực tế

## So sánh với `TESTING_SPEC.md`

### Đã bám được các ý sau

- Model có trong bảng giá
- Model không có trong bảng giá
- Chuẩn hóa model name
- Pin `< 80%`
- Pin `80% - 85%`
- Pin `> 85%`
- Màn hình `unknown`
- Nhiều lỗi cùng lúc
- `estimatedPrice` không âm
- `deductions` trả đúng lý do và số tiền

### Chưa làm hết toàn bộ spec

Vẫn còn thiếu một số case để tiến gần 100% phần `tradeInService`:

- `displayStatus = "replaced"`
- `bodyCondition = "light_scratches"`
- `bodyCondition = "heavy_scratches"` ở case đơn
- `faceIdStatus = "broken"` ở case đơn
- `accessoryStatus = "missing_box_or_cable"` ở case đơn
- Case tổng hợp kiểm tra đầy đủ mọi deduction theo đúng thứ tự mong muốn của spec

## Giá trị đạt được cho đồ án

Sau task này, dự án đã có:

- Hệ thống test backend đầu tiên hoạt động thật
- Minh chứng rằng phần logic nghiệp vụ thu cũ có thể kiểm tra tự động
- Nền tảng để tiếp tục mở rộng test cho:
  - `authMiddleware`
  - `authController`
  - `orderController`

Điểm có thể trình bày với người hướng dẫn:

- Đã bắt đầu triển khai test tự động đúng theo `TESTING_SPEC.md`
- Chọn `tradeInService` làm module đầu tiên vì là logic thuần, ít phụ thuộc, dễ kiểm tra
- Đã tạo file test thực tế và chạy pass trên máy local

## Vấn đề còn tồn tại

- Client test vẫn chưa chạy ổn, cần xử lý riêng phần môi trường / cấu hình Vitest frontend.
- Bộ test `tradeInService` mới ở mức nền tảng, chưa đạt hết toàn bộ case trong spec.
- Chưa có `coverage report` thực tế cho backend.

## Bước tiếp theo đề xuất

1. Bổ sung các case còn thiếu để tiến gần `100%` spec cho `tradeInService`
2. Viết test cho `authMiddleware.js`
3. Viết test cho `authController.js`
4. Sau đó mới sang `orderController.js`

## Ghi chú phục vụ bảo vệ đồ án

- Đây là test cấp hàm (unit test), không phải test API.
- Mục tiêu của test này là chứng minh logic tính giá thu cũ chạy đúng và không hồi quy khi sửa code.
- Điểm mạnh của cách làm:
  - nhanh
  - dễ đọc
  - không phụ thuộc internet
  - không phụ thuộc MongoDB thật
