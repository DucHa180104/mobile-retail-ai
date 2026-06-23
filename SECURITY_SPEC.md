# Security Spec - mobile-retail-ai

> Tài liệu này mô tả các rủi ro bảo mật ưu tiên cao cho dự án `mobile-retail-ai`.
> Mục tiêu là chỉ ra các lỗ hổng cần chặn, cách kiểm thử lại và tiêu chí hoàn thành ở mức đồ án nhưng vẫn đúng kỹ thuật.
> Phạm vi: local development, ưu tiên fix các lỗi ảnh hưởng trực tiếp đến tài khoản, đơn hàng, phân quyền và dữ liệu nhạy cảm.

## 1. Mục tiêu

- Xác định các lỗ hổng bảo mật quan trọng nhất trong hệ thống hiện tại.
- Đảm bảo mỗi lỗi quan trọng sau khi sửa đều có test hoặc checklist test tay đi kèm.
- Giảm rủi ro cho các luồng nhạy cảm: đăng nhập, phân quyền admin, tạo đơn, xem đơn, cập nhật dữ liệu.

## 2. Mức ưu tiên

| Mã lỗi | Tên lỗi | Mức độ |
|---|---|---|
| S1 | IDOR đơn hàng | Rất cao |
| S2 | Price tampering khi checkout | Rất cao |
| S3 | Thiếu bảo vệ route admin | Rất cao |
| S4 | Brute force login / thiếu rate limit | Cao |
| S5 | Mass assignment / update field không mong muốn | Cao |
| S6 | Lộ lỗi nội bộ / stack trace | Cao |
| S7 | Upload file không an toàn | Trung bình |
| S8 | Regex injection / search abuse | Trung bình |
| S9 | Cấu hình bí mật không an toàn | Cao |
| S10 | Kiểm tra đầu vào chưa chặt | Trung bình |

## 3. Danh sách rủi ro chi tiết

### S1 - IDOR đơn hàng

**Mô tả**

User A không được phép xem đơn của User B chỉ bằng cách thay `orderId` trên URL hoặc API.

**Rủi ro**

- Lộ thông tin giao hàng
- Lộ sản phẩm đã mua
- Lộ tổng tiền, trạng thái thanh toán

**Yêu cầu fix**

- Route lấy chi tiết đơn phải kiểm tra:
  - admin được xem mọi đơn
  - user thường chỉ xem đơn của chính mình
  - guest không xem được đơn người khác

**Cách test**

- User A gọi `GET /api/orders/:id` với đơn của A -> 200
- User B gọi cùng `orderId` của A -> 403
- Không token -> 401
- Admin gọi -> 200

### S2 - Price tampering khi checkout

**Mô tả**

Client không được phép tự gửi giá cuối cùng rồi để server tin hoàn toàn.

**Rủi ro**

- Người dùng sửa request để mua giá rẻ hơn thực tế
- Sai tổng tiền, sai doanh thu

**Yêu cầu fix**

- Server phải lấy giá sản phẩm từ database
- Server tự tính tổng tiền từ DB và số lượng
- Không tin giá, subtotal, total gửi từ frontend

**Cách test**

- Gửi request tạo đơn với giá giả thấp hơn DB -> server vẫn tính theo DB
- Gửi `totalAmount` sai -> server không dùng trực tiếp hoặc trả 400
- `quantity <= 0` -> 400

### S3 - Thiếu bảo vệ route admin

**Mô tả**

Route admin không được chỉ bảo vệ bằng frontend.

**Rủi ro**

- User thường hoặc người lạ gọi API admin trực tiếp
- Sửa sản phẩm, xem user, đổi trạng thái đơn trái phép

**Yêu cầu fix**

- Tất cả API admin phải dùng `protect` + `protectAdmin`
- Frontend `AdminProtectedRoute` chỉ là lớp UX, không phải lớp bảo mật chính

**Cách test**

- Không token gọi API admin -> 401
- Token user thường gọi API admin -> 403
- Token admin -> 200

### S4 - Brute force login / thiếu rate limit

**Mô tả**

Nếu không giới hạn số lần login thất bại, attacker có thể thử mật khẩu liên tục.

**Rủi ro**

- Dò mật khẩu
- Gây quá tải route đăng nhập

**Yêu cầu fix**

- Thêm rate limit cho `/api/auth/login`
- Có thông báo rõ khi vượt ngưỡng

**Cách test**

- Gọi login sai nhiều lần liên tiếp -> 429
- Sau thời gian chờ, request hợp lệ hoạt động lại

### S5 - Mass assignment / update field không mong muốn

**Mô tả**

Client không được gửi field nhạy cảm và để server lưu thẳng.

**Rủi ro**

- User tự nâng role thành admin
- Ghi đè field nội bộ

**Yêu cầu fix**

- Chỉ pick các field cho phép ở từng API
- Không cho update `role`, `password`, `isActive` ở API profile thường

**Cách test**

- Gửi field `role: "admin"` vào API profile -> bị bỏ qua
- Gửi field lạ vào API product -> không được lưu

### S6 - Lộ lỗi nội bộ / stack trace

**Mô tả**

API không nên trả stack trace, query DB hay lỗi nội bộ chi tiết cho client.

**Rủi ro**

- Lộ cấu trúc hệ thống
- Tăng khả năng khai thác sâu hơn

**Yêu cầu fix**

- Middleware lỗi phải trả message an toàn
- Log chi tiết ở server, không trả ra client

**Cách test**

- Gây lỗi backend có chủ đích -> client chỉ nhận message gọn, không có stack trace

### S7 - Upload file không an toàn

**Mô tả**

Module upload ảnh phải giới hạn loại file và dung lượng.

**Rủi ro**

- Upload file không phải ảnh
- Upload file quá lớn gây chiếm tài nguyên

**Yêu cầu fix**

- Chỉ cho `png`, `jpg`, `jpeg`, `webp`
- Giới hạn kích thước file
- Không thực thi file upload

**Cách test**

- Upload `.txt` -> bị chặn
- Upload ảnh > giới hạn -> bị chặn
- Upload ảnh hợp lệ -> thành công

### S8 - Regex injection / search abuse

**Mô tả**

Từ khóa tìm kiếm nếu đưa thẳng vào regex có thể gây lỗi hoặc làm truy vấn nặng bất thường.

**Rủi ro**

- Regex độc gây chậm hệ thống
- Lỗi server

**Yêu cầu fix**

- Escape ký tự đặc biệt trước khi tạo regex
- Giới hạn chiều dài keyword nếu cần

**Cách test**

- Gửi keyword kiểu `.*`, `a+a+a+`, `(` -> không làm treo API

### S9 - Cấu hình bí mật không an toàn

**Mô tả**

Các secret như JWT, Mongo URI, Mail credentials, Gemini key không được hardcode.

**Rủi ro**

- Lộ key
- Khó deploy môi trường khác

**Yêu cầu fix**

- Dùng `.env`
- Có `.env.example`
- Không commit `.env` thật lên Git
- App nên fail sớm nếu thiếu biến quan trọng

**Cách test**

- Thiếu `JWT_SECRET` hoặc `MONGODB_URI` -> app báo lỗi rõ và không chạy sai âm thầm

### S10 - Kiểm tra đầu vào chưa chặt

**Mô tả**

Nhiều API cần validate dữ liệu đầu vào rõ ràng.

**Rủi ro**

- Dữ liệu bẩn vào DB
- Lỗi logic phía sau

**Yêu cầu fix**

- Validate field bắt buộc
- Validate enum
- Validate số lượng, giá, stock, rating, status

**Cách test**

- Gửi thiếu field -> 400
- Gửi enum sai -> 400
- Gửi số âm ở field không cho phép -> 400

## 4. Quy tắc bảo vệ backend

1. Không tin dữ liệu nhạy cảm từ frontend nếu server có thể tự xác định lại.
2. Frontend chỉ hỗ trợ UX, backend mới là nơi chặn quyền thật.
3. Mọi route admin phải có bảo vệ rõ ràng ở backend.
4. Route có dữ liệu riêng tư phải kiểm tra quyền sở hữu tài nguyên.
5. Không trả password, token nội bộ hoặc stack trace ra response.

## 5. Tiêu chí hoàn thành tối thiểu

- Các route admin quan trọng đã có `protect` + `protectAdmin`
- Route đơn hàng không còn IDOR
- Checkout không tin giá từ client
- Login có giới hạn cơ bản hoặc cơ chế chống brute force
- Upload ảnh giới hạn loại file và kích thước
- `.env` thật không bị commit
- Có test hoặc checklist test cho các lỗi mức rất cao và cao

## 6. Gắn với testing

File này đi cùng `TESTING_SPEC.md`.

Nguyên tắc:

- Mỗi lỗi bảo mật quan trọng sau khi sửa nên có test tái hiện.
- Nếu chưa viết test tự động được ngay, phải có checklist test tay rõ ràng.
- Với lỗi mức rất cao, ưu tiên có test backend tự động.

## 7. Ghi chú

- Đây là security baseline cho đồ án, không phải checklist pentest production đầy đủ.
- Khi hệ thống mở rộng thêm thanh toán thật, chatbot thật, upload nhiều file hoặc deploy public, spec này cần được cập nhật tiếp.
