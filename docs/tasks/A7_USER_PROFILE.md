# A7_USER_PROFILE

- Task Name: Quản lý hồ sơ người dùng
- Status: DONE
- Last Updated: 2026-06-13

## Mục tiêu

- Tạo API lấy thông tin user hiện tại.
- Tạo API cập nhật hồ sơ cá nhân và địa chỉ giao hàng mặc định.
- Tạo API đổi mật khẩu cho user đã đăng nhập.
- Tạo trang `/profile` để user xem và cập nhật hồ sơ.
- Đồng bộ lại `AuthContext` sau khi cập nhật profile thành công.

## File đã sửa

- `backend/models/User.js`
- `backend/controllers/authController.js`
- `backend/routes/authRoutes.js`
- `client/src/context/AuthContext.jsx`
- `client/src/components/Navbar.jsx`
- `client/src/App.jsx`
- `client/src/pages/ProfilePage.jsx`

## API đã thêm

- `GET /api/auth/me`
  - Dùng `protect`
  - Trả về thông tin user hiện tại, không trả password

- `PUT /api/auth/profile`
  - Dùng `protect`
  - Cho sửa:
    - `name`
    - `phoneNumber`
    - `shippingInfo`
  - Không cho sửa `role`
  - Không cho sửa `password`

- `PUT /api/auth/change-password`
  - Dùng `protect`
  - Nhận:
    - `currentPassword`
    - `newPassword`
  - Kiểm tra mật khẩu hiện tại đúng rồi mới lưu mật khẩu mới

## Luồng cập nhật profile

- User vào `/profile`.
- Frontend gọi `GET /api/auth/me` để lấy dữ liệu mới nhất từ backend.
- Form hiển thị:
  - thông tin cá nhân
  - địa chỉ giao hàng mặc định
- Khi user bấm lưu:
  - frontend gọi `PUT /api/auth/profile`
  - backend cập nhật `name`, `phoneNumber`, `shippingInfo`
  - backend trả về `user` mới
  - frontend gọi `updateUser()` trong `AuthContext`
  - `localStorage` và Navbar được cập nhật theo dữ liệu mới

## Luồng đổi mật khẩu

- User nhập:
  - mật khẩu hiện tại
  - mật khẩu mới
  - xác nhận mật khẩu mới
- Frontend kiểm tra:
  - nhập đủ dữ liệu
  - mật khẩu mới tối thiểu 6 ký tự
  - xác nhận mật khẩu khớp
- Sau đó gọi `PUT /api/auth/change-password`
- Backend kiểm tra `currentPassword`
- Nếu đúng:
  - gán `user.password = newPassword`
  - hook `pre("save")` trong `User` sẽ tự hash trước khi lưu

## Manual Test Checklist

- [x] Chưa đăng nhập vào `/profile` thấy thông báo yêu cầu đăng nhập
- [x] Đăng nhập rồi vào `/profile` thấy dữ liệu hiện tại
- [ ] Sửa `name` và lưu thành công
- [ ] Sửa `phoneNumber` và lưu thành công
- [ ] Sửa địa chỉ giao hàng mặc định và lưu thành công
- [x] Sau khi lưu profile, Navbar hiển thị tên mới nếu tên đã đổi
- [ ] Reload trang vẫn giữ dữ liệu profile mới
- [ ] Đổi mật khẩu với `currentPassword` đúng
- [ ] Đổi mật khẩu với `currentPassword` sai thì bị chặn
- [ ] `confirmNewPassword` không khớp thì frontend chặn
- [ ] Mật khẩu mới dưới 6 ký tự thì bị chặn
- [ ] `GET /api/auth/me` không có token thì trả 401
- [x] `npm run build` trong `client/` chạy thành công

## Vấn đề còn tồn tại

- Chưa hỗ trợ đổi email.
- Chưa có avatar.
- Chưa có nhiều địa chỉ giao hàng.
- Chưa có reset mật khẩu qua email.
- Thông báo đang ở mức đơn giản, chưa dùng toast UI riêng.

## Ghi chú bảo vệ đồ án

- `AuthContext` không chỉ lưu token mà còn lưu `user` trong `localStorage`, nên sau khi cập nhật profile cần cập nhật lại context để UI đổi ngay.
- `GET /api/auth/me` dùng để lấy dữ liệu user mới nhất từ backend, tránh phụ thuộc hoàn toàn vào dữ liệu cũ từ lúc login.
- `change-password` không dùng `findByIdAndUpdate`, mà dùng `findById` rồi `save()` để hook hash password vẫn chạy.
- `shippingInfo` được đặt trong `User` để tái sử dụng với luồng checkout sau này.
