# B1_ADMIN_USER_MANAGEMENT

- Task Name: Admin quản lý user và phân quyền
- Status: DONE
- Last Updated: 2026-06-14

## Mục tiêu

- Cho admin xem danh sách user từ giao diện.
- Cho admin đổi quyền `user` / `admin` mà không phải sửa database tay.
- Cho admin khóa / mở khóa tài khoản an toàn từ giao diện.
- Chặn user thường gọi API quản trị.
- Chặn admin tự hạ quyền hoặc tự khóa chính mình để tránh mất quyền truy cập khu admin.

## File đã sửa

- `backend/models/User.js`
- `backend/controllers/authController.js`
- `backend/controllers/userAdminController.js`
- `backend/routes/userAdminRoutes.js`
- `backend/server.js`
- `client/src/pages/AdminUsersPage.jsx`
- `client/src/App.jsx`
- `client/src/layouts/AdminLayout.jsx`
- `client/src/components/admin/AdminSidebar.jsx`

## API đã thêm

- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/role`
- `PATCH /api/admin/users/:id/status`

## Luồng phân quyền

- Frontend admin gọi API kèm `Authorization: Bearer <token>`.
- Backend nhận request và chạy:
  - `protect`
  - `protectAdmin`
- Nếu không có token hoặc token sai -> `401`
- Nếu có token nhưng không phải admin -> `403`
- Nếu là admin hợp lệ -> được xem danh sách user, đổi role, khóa hoặc mở khóa tài khoản.

## Vì sao phải chặn ở backend

- Frontend chỉ là giao diện, người dùng có thể bỏ qua UI và gọi API trực tiếp bằng Postman.
- Nếu chỉ chặn ở frontend mà backend không kiểm tra, user thường vẫn có thể tự đổi role hoặc tự mở khóa.
- Vì vậy lớp bảo mật chính phải nằm ở backend bằng `protect + protectAdmin`.

## Pha 1: Nâng cấp UI/UX frontend

- Nâng cấp `AdminUsersPage` theo hướng dashboard quản lý người dùng.
- Thêm:
  - tìm kiếm frontend theo `name`, `email`, `phoneNumber`
  - filter frontend theo role `all / admin / user`
  - phân trang frontend, 8 user mỗi trang
  - avatar chữ cái đầu tên user
  - badge role trực quan
  - modal xem chi tiết user
- Giữ nguyên API hiện có, không đổi logic B1.
- Bổ sung `shippingInfo` vào dữ liệu trả về để modal hiển thị thông tin giao hàng.

## Pha 2: Khóa / mở khóa tài khoản

- Thêm field backend:
  - `isActive`
  - `banReason`
  - `bannedAt`
  - `bannedBy`
- Thêm API:
  - `PATCH /api/admin/users/:id/status`
- Thêm cột trạng thái ở `AdminUsersPage`
- Thêm badge:
  - `Hoạt động`
  - `Bị khóa`
- Thêm action:
  - `Khóa tài khoản`
  - `Mở khóa`
- Thêm xác nhận trước khi đổi role.
- Nếu user bị khóa thì backend chặn đăng nhập và trả message `Tài khoản đã bị khóa`.

## Vì sao phải chặn admin tự khóa / tự hạ quyền

- Nếu admin tự khóa chính mình thì có thể không đăng nhập lại được.
- Nếu admin tự hạ quyền chính mình xuống `user` thì có thể mất toàn bộ quyền quản trị.
- Với scope đồ án hiện tại, cách an toàn nhất là chặn cả 2 trường hợp này ngay ở backend và disable ở UI.

## Manual Test Checklist

- [ ] Login bằng tài khoản admin
- [ ] Vào `/admin/users` thấy danh sách user
- [ ] Danh sách không trả password
- [ ] Danh sách sắp xếp user mới nhất lên đầu
- [ ] Tìm theo tên user hoạt động đúng
- [ ] Tìm theo email hoạt động đúng
- [ ] Tìm theo số điện thoại hoạt động đúng
- [ ] Filter `all / admin / user` hoạt động đúng
- [ ] Chuyển trang pagination hoạt động đúng
- [ ] Badge admin hiển thị khác badge khách hàng
- [ ] Badge trạng thái hiển thị đúng `Hoạt động / Bị khóa`
- [ ] Modal “Xem chi tiết” hiển thị đúng name, email, phoneNumber, role, createdAt
- [ ] Modal hiển thị `shippingInfo` nếu user có lưu
- [ ] Đổi role có confirm trước khi gọi API
- [ ] Đổi user thường thành admin thành công
- [ ] Đổi admin thành user thành công
- [ ] Admin tự đổi quyền của chính mình bị chặn
- [ ] Admin khóa user khác thành công
- [ ] User bị khóa không login được
- [ ] Admin mở khóa user thành công
- [ ] User sau khi mở khóa login lại được
- [ ] Admin tự khóa chính mình bị chặn
- [ ] User thường gọi `GET /api/admin/users` bị `403`
- [ ] User thường gọi `PATCH /api/admin/users/:id/role` bị `403`
- [ ] User thường gọi `PATCH /api/admin/users/:id/status` bị `403`
- [ ] Không có token gọi API admin bị `401`
- [ ] Gửi role sai khác `user/admin` bị `400`
- [ ] Khóa tài khoản mà không nhập lý do bị `400`

## Vấn đề còn tồn tại

- Chưa làm order history trong modal.
- Chưa làm tổng chi tiêu theo user.
- Search/filter/pagination hiện vẫn là frontend-only.
- Chưa có xác nhận tùy biến đẹp cho thao tác mở khóa, hiện dùng confirm đơn giản.
- Chưa có log lịch sử ai đã đổi quyền ai hoặc khóa ai ở giao diện admin.

## Ghi chú bảo vệ đồ án

- `role` vẫn lưu trong `User model`, nhưng quyền không còn phải đổi tay trong database.
- `isActive` là cờ chặn đăng nhập cho user bị khóa.
- Route quản trị được tách riêng dưới `/api/admin/users` để dễ quản lý và dễ bảo vệ.
- Điểm an toàn quan trọng nhất của task này là:
  - chặn user thường ở backend
  - chặn admin tự hạ quyền chính mình
  - chặn admin tự khóa chính mình
- Pha 2 tập trung vào an toàn quản trị trước, chưa mở rộng sang lịch sử đơn hàng hay thống kê chi tiêu.
