# D3_REMOVE_HARDCODE_URL

- Task Name: Bỏ hardcode URL ở frontend
- Status: DONE
- Last Updated: 2026-06-12

## Mục tiêu

- Loại bỏ các URL backend bị hardcode trong frontend.
- Đưa base URL vào biến môi trường của Vite.
- Tạo helper dùng chung để build API URL mà không thay đổi logic nghiệp vụ.

## Các file đã sửa

- `client/.env.example`
- `client/src/lib/api.js`
- `client/src/pages/AdminDashboardPage.jsx`
- `client/src/pages/AdminOrdersPage.jsx`
- `client/src/pages/AdminProductsPage.jsx`
- `client/src/pages/CheckoutPage.jsx`
- `client/src/pages/LoginPage.jsx`
- `client/src/pages/MyOrdersPage.jsx`
- `client/src/pages/PhonesPage.jsx`
- `client/src/pages/ProductDetailPage.jsx`
- `client/src/pages/ProductListPage.jsx`
- `client/src/pages/RegisterPage.jsx`
- `client/src/pages/TradeInPage.jsx`

## Nội dung thay đổi

- Tạo `client/.env.example` với biến:
  - `VITE_API_BASE_URL=http://localhost:5000`
- Tạo helper `client/src/lib/api.js` gồm:
  - `API_BASE_URL`
  - `buildApiUrl()`
- Refactor toàn bộ `fetch("http://localhost:5000/...")` trong frontend sang:
  - `fetch(buildApiUrl("/api/..."))`
- Không thay đổi body request, headers, token hay luồng nghiệp vụ hiện có.

## Luồng dữ liệu trước và sau khi sửa

### Trước khi sửa

- Mỗi page frontend tự nối thẳng đến:
  - `http://localhost:5000/api/...`
- Khi đổi môi trường, phải sửa tay từng file.

### Sau khi sửa

- Mỗi page frontend gọi:
  - `buildApiUrl("/api/...")`
- Base URL được đọc từ:
  - `import.meta.env.VITE_API_BASE_URL`
- Khi đổi môi trường, chỉ cần sửa file `.env`.

## Checklist test tay

- [ ] Mở trang chủ và kiểm tra load danh sách sản phẩm
- [ ] Mở `/phones` và test search/filter/sort
- [ ] Mở trang chi tiết sản phẩm
- [ ] Đăng ký tài khoản mới
- [ ] Đăng nhập tài khoản
- [ ] Checkout tạo đơn hàng
- [ ] Mở `/my-orders`
- [ ] Vào `/admin/dashboard`
- [ ] Vào `/admin/orders`
- [ ] Vào `/admin/products`
- [ ] Upload ảnh sản phẩm trong admin
- [ ] Test trade-in estimate

## Kết quả mong đợi

- Frontend không còn phụ thuộc trực tiếp vào `http://localhost:5000`.
- Toàn bộ API frontend vẫn hoạt động thông qua helper `buildApiUrl()`.
- Khi đổi backend host/port chỉ cần sửa biến môi trường, không cần sửa từng page.

## Vấn đề còn tồn tại

- README và một số file docs vẫn còn nhắc đến `localhost` cho mục đích hướng dẫn local dev.
- Backend chưa có biến env riêng cho public base URL của uploads; hiện tại route upload vẫn trả absolute URL dựa trên `req.protocol` và `host`.
- Chưa có test tự động riêng cho helper `buildApiUrl()`.

## Ghi chú phục vụ bảo vệ đồ án

- D3 chỉ refactor cách cấu hình URL, không đổi nghiệp vụ.
- `VITE_API_BASE_URL` là biến môi trường phía frontend của Vite.
- `buildApiUrl()` giúp tập trung hóa cấu hình backend endpoint, tránh lặp lại và tránh hardcode.
