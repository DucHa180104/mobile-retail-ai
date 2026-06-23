# S1 - Chặn IDOR xem đơn hàng trái phép

## Trạng thái

DONE

## Cập nhật gần nhất

2026-06-23

## Mục tiêu

- Kiểm tra và chứng minh hệ thống không còn lỗ hổng **IDOR** ở API xem chi tiết đơn hàng.
- Đảm bảo:
  - người chưa đăng nhập không xem được đơn hàng
  - user thường không xem được đơn của user khác
  - chủ đơn xem được đơn của chính mình
  - admin xem được mọi đơn
- Tạo bằng chứng kỹ thuật bằng **test tự động Supertest** để phục vụ review và bảo vệ đồ án.

## Mô tả lỗ hổng

**IDOR** là lỗi phân quyền khi người dùng chỉ cần thay `id` trên URL/API là có thể truy cập dữ liệu không thuộc về mình.

Trong ngữ cảnh dự án này:

- Endpoint liên quan: `GET /api/orders/:id`
- Rủi ro nếu bị hở:
  - lộ họ tên khách hàng
  - lộ số điện thoại
  - lộ địa chỉ giao hàng
  - lộ sản phẩm đã mua
  - lộ tổng tiền, trạng thái đơn, trạng thái thanh toán

Đây là lỗi bảo mật nghiêm trọng vì liên quan trực tiếp đến dữ liệu cá nhân và dữ liệu mua hàng.

## Hiện trạng sau khi kiểm tra

Qua kiểm tra code backend hiện tại:

- route `GET /api/orders/:id` đã có middleware `protect`
- controller `getOrderById` đã kiểm tra quyền:
  - admin được xem mọi đơn
  - owner được xem đơn của chính mình
  - user khác bị chặn `403`

Kết luận: **logic fix S1 đã có trong code production**.

## Các file liên quan

- `backend/routes/orderRoutes.js`
- `backend/controllers/orderController.js`
- `backend/middleware/authMiddleware.js`
- `backend/routes/orderRoutes.security.test.js`

## Nội dung đã thực hiện

### 1. Kiểm tra route bảo vệ endpoint

Đã xác nhận route:

```js
router.get("/:id", protect, getOrderById);
```

Ý nghĩa:

- mọi request vào API này bắt buộc phải có token hợp lệ
- nếu không có token, middleware `protect` trả `401`

### 2. Kiểm tra logic phân quyền trong controller

Đã xác nhận controller có điều kiện:

- `isAdmin`
- `isOwner`

Nếu không phải admin và cũng không phải chủ đơn:

- trả `403`

### 3. Viết test tự động bảo mật S1

Đã tạo file:

- `backend/routes/orderRoutes.security.test.js`

Mục tiêu của file test:

- dựng app Express tối thiểu chỉ để test route order
- dùng `mongodb-memory-server` để tạo MongoDB trong RAM
- tạo user test, admin test, order test
- tạo JWT test
- gọi API thật bằng `supertest`
- kiểm tra response status và message

## Các test case đã viết

### Test 1 - Chưa đăng nhập

Mục tiêu:

- người không có token không được xem chi tiết đơn hàng

Kỳ vọng:

- gọi `GET /api/orders/:id`
- trả `401`

### Test 2 - User A xem đơn của User B

Mục tiêu:

- chứng minh user thường không thể truy cập đơn của người khác

Kỳ vọng:

- user B dùng token của mình gọi vào đơn của user A
- trả `403`

### Test 3 - Chủ đơn xem đơn của chính mình

Mục tiêu:

- chứng minh hệ thống vẫn cho phép truy cập hợp lệ

Kỳ vọng:

- owner gọi đúng đơn của mình
- trả `200`

### Test 4 - Admin xem đơn bất kỳ

Mục tiêu:

- chứng minh admin có quyền xem phục vụ quản trị

Kỳ vọng:

- admin gọi đơn của user khác
- trả `200`

## Cách chạy test

### Lệnh chạy

```bash
cd backend
npm test
```

### Kết quả thực tế

Đã chạy thành công:

- `2 test files passed`
- `13 tests passed`

Trong đó:

- file test cũ: `tradeInService.test.js`
- file test mới: `orderRoutes.security.test.js`

## Manual Test Checklist

- [x] Không đăng nhập, gọi `GET /api/orders/:id` -> `401`
- [x] User A xem đơn của user B -> `403`
- [x] Chủ đơn xem đơn của chính mình -> `200`
- [x] Admin xem đơn của user khác -> `200`

## Luồng test tự động

1. Test tạo một MongoDB in-memory.
2. Test tạo user owner, user thường khác và admin.
3. Test tạo một order gắn với owner.
4. Test dùng `supertest` gọi API thật:
   - không token
   - token user khác
   - token owner
   - token admin
5. So sánh status code và response body với kỳ vọng bảo mật.

## Kết quả đạt được

- Đã xác minh route xem đơn hàng không còn mở công khai.
- Đã xác minh user không thể truy cập đơn của người khác.
- Đã xác minh admin vẫn có quyền xem để phục vụ quản trị.
- Đã có **bằng chứng tự động hóa** cho phần bảo mật S1.

## Giá trị đối với đồ án

Phần này có giá trị tốt khi bảo vệ vì:

- không chỉ nói miệng là "đã fix"
- có test chứng minh cụ thể
- đúng hướng làm phần mềm an toàn:
  - có kiểm tra
  - có tái hiện tình huống tấn công
  - có xác nhận hệ thống chặn đúng

## Điểm còn lưu ý

- Với đơn guest (`order.user = null`), hiện tại endpoint `GET /api/orders/:id` không cho guest truy cập.
- Đây là lựa chọn an toàn hơn về bảo mật.
- Nếu sau này muốn guest tra cứu đơn:
  - nên dùng mã tra cứu riêng
  - không nên cho tra cứu trực tiếp bằng Mongo `_id`

## Gợi ý bước tiếp theo

Sau S1, có thể tiếp tục theo thứ tự:

1. **S2 - Price tampering** khi checkout
2. **S3 - Bảo vệ toàn bộ route admin**
3. **S4 - Rate limit login**
4. Ghi thêm các test bảo mật vào `TESTING_SPEC.md`

## Ghi chú phục vụ người hướng dẫn

Đây là một hạng mục bảo mật đã có:

- kiểm tra hiện trạng code
- chứng minh logic bảo vệ đã tồn tại
- bổ sung test tự động ở mức API
- chạy test pass thành công

Phần này có thể dùng làm ví dụ cho cách sinh viên xử lý một lỗ hổng bảo mật theo quy trình đầy đủ:

- nhận diện rủi ro
- kiểm tra code
- viết test tái hiện
- chạy test xác nhận fix
