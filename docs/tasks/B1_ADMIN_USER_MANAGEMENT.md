# B1_ADMIN_USER_MANAGEMENT

- Task Name: Admin quản lý user và phân quyền
- Status: DONE
- Last Updated: 2026-06-14

## Mục tiêu

- Cho admin xem danh sách user từ giao diện.
- Cho admin đổi quyền `user` / `admin` mà không phải sửa database tay.
- Chặn user thường gọi API quản trị.
- Chặn admin tự hạ quyền chính mình để tránh mất quyền truy cập khu admin.

## File đã sửa

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

## Luồng phân quyền

- Frontend admin gọi API kèm `Authorization: Bearer <token>`.
- Backend nhận request và chạy:
  - `protect`
  - `protectAdmin`
- Nếu không có token hoặc token sai -> `401`
- Nếu có token nhưng không phải admin -> `403`
- Nếu là admin hợp lệ -> được xem danh sách user hoặc đổi role.

## Vì sao phải chặn ở backend

- Frontend chỉ là giao diện, người dùng có thể bỏ qua UI và gọi API trực tiếp bằng Postman.
- Nếu chỉ chặn ở frontend mà backend không kiểm tra, user thường vẫn có thể tự đổi role.
- Vì vậy lớp bảo mật chính phải nằm ở backend bằng `protect + protectAdmin`.

## Manual Test Checklist

- [ ] Login bằng tài khoản admin
- [ ] Vào `/admin/users` thấy danh sách user
- [ ] Danh sách không trả password
- [ ] Danh sách sắp xếp user mới nhất lên đầu
- [ ] Đổi user thường thành admin thành công
- [ ] Đổi admin thành user thành công
- [ ] Admin tự đổi quyền của chính mình bị chặn
- [ ] User thường gọi `GET /api/admin/users` bị `403`
- [ ] User thường gọi `PATCH /api/admin/users/:id/role` bị `403`
- [ ] Không có token gọi API admin bị `401`
- [ ] Gửi role sai khác `user/admin` bị `400`

## Vấn đề còn tồn tại

- Chưa có tìm kiếm / lọc user trong trang admin.
- Chưa có phân trang nếu số lượng user tăng nhiều.
- Chưa có xác nhận trước khi đổi quyền.
- Chưa có log lịch sử ai đã đổi quyền ai.

## Ghi chú bảo vệ đồ án

- `role` vẫn lưu trong `User model`, nhưng quyền không còn phải đổi tay trong database.
- Route quản trị được tách riêng dưới `/api/admin/users` để dễ quản lý và dễ bảo vệ.
- Điểm an toàn quan trọng nhất của task này là:
  - chặn user thường ở backend
  - chặn admin tự hạ quyền chính mình
