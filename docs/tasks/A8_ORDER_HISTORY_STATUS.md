# A8_ORDER_HISTORY_STATUS

- Task Name: Lịch sử đơn hàng đầy đủ và chi tiết đơn hàng theo trạng thái
- Status: DONE
- Last Updated: 2026-06-13

## Mục tiêu

- Cho phép lọc đơn hàng theo `status` ở backend.
- Thêm tab trạng thái ở trang `MyOrdersPage`.
- Tạo trang chi tiết đơn hàng riêng cho user.
- Hiển thị timeline trạng thái đơn hàng đơn giản theo kiểu dễ hiểu, gần với các sàn thương mại điện tử.
- Giữ nguyên 3 status hiện tại:
  - `pending`
  - `confirmed`
  - `cancelled`

## File đã sửa

- `backend/controllers/orderController.js`
- `backend/routes/orderRoutes.js`
- `client/src/pages/MyOrdersPage.jsx`
- `client/src/pages/OrderDetailPage.jsx`
- `client/src/pages/AdminOrdersPage.jsx`
- `client/src/App.jsx`

## API đã cập nhật

- `GET /api/orders/my-orders`
  - Hỗ trợ query `?status=...`
  - Nếu không có `status` hoặc `status=all` thì trả tất cả đơn của user hiện tại
  - Nếu `status` hợp lệ thì filter theo status

- `GET /api/orders`
  - Hỗ trợ query `?status=...`
  - Dùng cho admin
  - Nếu không có `status` hoặc `status=all` thì trả tất cả đơn

- `GET /api/orders/:id`
  - Vẫn lấy chi tiết một đơn
  - Đã yêu cầu đăng nhập
  - Chỉ chủ đơn hàng hoặc admin mới xem được

## Luồng lọc đơn theo status

- Ở `MyOrdersPage`, khi user bấm tab:
  - `Tất cả`
  - `Chờ xác nhận`
  - `Đã xác nhận`
  - `Đã hủy`
- Frontend gọi lại API `/api/orders/my-orders?status=...`
- Backend nhận `req.query.status`
- Nếu status hợp lệ thì thêm điều kiện `status` vào `Order.find(...)`
- Nếu không có hoặc là `all` thì trả toàn bộ đơn của user

- Ở `AdminOrdersPage`, tab admin cũng gọi lại backend theo `?status=...`
- Như vậy admin không cần tải toàn bộ đơn rồi mới lọc ở frontend

## Luồng xem chi tiết đơn hàng

- Từ `MyOrdersPage`, user bấm `Xem chi tiết`
- Frontend chuyển đến route `/my-orders/:id`
- `OrderDetailPage` gọi `GET /api/orders/:id`
- Backend kiểm tra:
  - nếu là admin thì được xem
  - nếu là user thường thì phải đúng chủ đơn hàng
- Frontend hiển thị:
  - mã đơn
  - ngày đặt
  - trạng thái đơn
  - trạng thái thanh toán
  - thông tin giao hàng
  - danh sách sản phẩm
  - tổng tiền
  - phương thức thanh toán
  - timeline đơn giản theo `status`

## Manual Test Checklist

### 1. User - Danh sách đơn hàng

- [x] Đăng nhập user thường → vào `/my-orders` thấy danh sách đơn của chính user đó
- [x] Tab `Tất cả` hiển thị toàn bộ đơn
- [x] Tab `Chờ xác nhận` chỉ hiển thị đơn `pending`
- [x] Tab `Đã xác nhận` chỉ hiển thị đơn `confirmed`
- [x] Tab `Đã hủy` chỉ hiển thị đơn `cancelled`
- [x] User chưa có đơn → hiển thị trạng thái rỗng hợp lý

### 2. User - Chi tiết đơn hàng

- [x] Bấm `Xem chi tiết` → vào đúng `/my-orders/:id`
- [x] Chi tiết hiển thị đúng mã đơn
- [x] Hiển thị đúng trạng thái đơn
- [x] Hiển thị đúng trạng thái thanh toán
- [x] Hiển thị đúng thông tin giao hàng
- [x] Hiển thị đúng danh sách sản phẩm
- [x] Hiển thị đúng tổng tiền
- [x] Timeline hiển thị đúng theo status

### 3. Phân quyền đơn hàng

- [ ] User A xem đơn của User A → thành công
- [ ] User B mở link đơn của User A → bị chặn
- [ ] Chưa đăng nhập mở `/my-orders/:id` → bị chặn hoặc chuyển login
- [ ] Admin xem đơn bất kỳ → thành công

### 4. Admin Orders

- [ ] Admin vào `/admin/orders` thấy danh sách đơn
- [ ] Tab `Tất cả` hiển thị toàn bộ đơn
- [ ] Tab `pending` chỉ hiện đơn chờ xác nhận
- [ ] Tab `confirmed` chỉ hiện đơn đã xác nhận
- [ ] Tab `cancelled` chỉ hiện đơn đã hủy
- [ ] Admin đổi trạng thái đơn thành công
- [ ] Sau khi đổi trạng thái, user thấy trạng thái mới ở `/my-orders`

### 5. Build / lỗi giao diện

- [x] `npm run build` client pass
- [ ] `/my-orders` không vỡ giao diện desktop
- [ ] `/my-orders` không vỡ giao diện mobile
- [ ] `/my-orders/:id` không vỡ giao diện

## Vấn đề còn tồn tại

- Chưa có thêm các trạng thái giao hàng chi tiết như `shipping`, `delivered`.
- Timeline hiện mới map từ 3 status cũ nên còn đơn giản.
- Chưa có tìm kiếm mã đơn trong `MyOrdersPage`.
- Chưa có phân trang cho lịch sử đơn hàng nếu số lượng đơn lớn.

## Ghi chú bảo vệ đồ án

- Lọc theo status được chuyển xuống backend để dữ liệu đúng hơn và giảm phụ thuộc vào lọc ở frontend.
- `OrderDetailPage` giúp tách danh sách đơn và chi tiết đơn, giao diện gọn hơn và dễ mở rộng sau này.
- `GET /api/orders/:id` cần kiểm tra chủ sở hữu đơn hàng để tránh lộ dữ liệu đơn của user khác.
- Ở bước này cố tình không mở rộng status mới để không ảnh hưởng logic cũ của checkout và admin.
