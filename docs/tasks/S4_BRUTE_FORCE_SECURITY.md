# Task Name
S4 - Chống brute force đăng nhập

# Status
IN PROGRESS

# Last Updated
2026-06-24

# Mục tiêu
- Giới hạn số lần gọi `POST /api/auth/login` theo IP.
- Khóa tạm tài khoản/email sau nhiều lần nhập sai mật khẩu.
- Có test tự động chứng minh đã chặn brute force.

# Các file đã sửa
- `backend/models/User.js`
- `backend/middleware/authRateLimitMiddleware.js`
- `backend/routes/authRoutes.js`
- `backend/controllers/authController.js`
- `backend/routes/authRoutes.rateLimit.test.js`

# Nội dung thay đổi
- Thêm `failedLoginAttempts` và `lockUntil` vào `User`.
- Thêm middleware `loginRateLimiter` bằng `express-rate-limit`.
- Gắn rate limiter vào route `POST /api/auth/login`.
- Trong `loginUser`, nếu user đang bị khóa tạm thì trả `423`.
- Nếu nhập sai quá nhiều lần thì set `lockUntil`.
- Nếu đăng nhập đúng thì reset bộ đếm sai và trạng thái khóa.
- Thêm test tự động cho 3 case chính của S4.

# Luồng dữ liệu sau khi sửa
1. Client gọi `POST /api/auth/login`.
2. Request đi qua `loginRateLimiter`.
3. Nếu IP vượt ngưỡng thì trả `429`.
4. Nếu qua được rate limiter, controller tìm user theo email.
5. Nếu `lockUntil` còn hiệu lực thì trả `423`.
6. Nếu password sai thì tăng `failedLoginAttempts`.
7. Nếu sai quá ngưỡng thì khóa tạm user.
8. Nếu password đúng thì reset bộ đếm và trả token.

# Manual Test Checklist
- [ ] Nhập sai mật khẩu 5 lần cho cùng 1 email.
- [ ] Lần tiếp theo thấy tài khoản bị khóa tạm.
- [ ] Spam login nhiều lần từ cùng 1 IP thì nhận `429`.
- [ ] Nhập sai 1-2 lần rồi đăng nhập đúng thì login thành công.
- [ ] Sau login đúng, bộ đếm sai được reset.

# Kết quả test
- Đã thêm test tự động:
  - khóa tạm theo email sau nhiều lần sai
  - chặn `429` theo IP
  - login đúng reset bộ đếm
- Đã chạy file `backend/routes/authRoutes.rateLimit.test.js`
- Kết quả: `1 file passed`, `3 tests passed`

# Vấn đề còn tồn tại
- Chưa thêm rate limit cho `register`.
- Chưa có captcha.
- Chưa có khóa tạm nâng cao theo device/session.

# Ghi chú phục vụ bảo vệ đồ án
- Lỗi này map vào OWASP `A07: Identification and Authentication Failures`.
- Đồ án đang dùng mô hình 2 lớp:
  - lớp 1: giới hạn request theo IP
  - lớp 2: khóa tạm theo email/user
- Cách này thực tế hơn việc chỉ dùng mỗi rate limit theo IP.
