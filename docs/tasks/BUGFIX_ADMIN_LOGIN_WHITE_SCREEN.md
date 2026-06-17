# Bugfix - Trắng trang khi đăng nhập admin

- **Trạng thái:** DONE
- **Cập nhật lần cuối:** 2026-06-15

## Mục tiêu

- Giảm rủi ro trắng trang khi đăng nhập bằng tài khoản admin.
- Làm luồng sau login của admin rõ ràng hơn.

## File đã sửa

- `client/src/context/CartContext.jsx`
- `client/src/pages/LoginPage.jsx`
- `client/src/App.jsx`

## Nội dung thay đổi

- Thêm `sanitizeCartItems()` trong `CartContext` để lọc item cart lỗi hoặc thiếu dữ liệu.
- Khi đăng nhập thành công:
  - nếu là `admin` thì chuyển thẳng tới `/admin/dashboard`
  - nếu là user thường thì vẫn về `/`
- Thêm route index cho `/admin` để tự chuyển sang `/admin/dashboard`.

## Giả thuyết nguyên nhân

- Tài khoản admin có thể đang gặp dữ liệu cart cũ hoặc item cart không hợp lệ.
- Khi app render và tính tổng giỏ hàng từ dữ liệu lỗi, frontend có thể nổ runtime và gây trắng trang.
- Ngoài ra, điều hướng admin về thẳng dashboard cũng giúp tránh vòng vào trang user không cần thiết.

## Manual Test Checklist

- [ ] Đăng nhập bằng tài khoản admin
- [ ] Sau login đi thẳng vào `/admin/dashboard`
- [ ] Mở trực tiếp `/admin` thì tự chuyển sang `/admin/dashboard`
- [ ] Navbar / cart badge không làm trắng trang
- [ ] User thường đăng nhập vẫn về `/`

## Kết quả test

- `npm run build` frontend pass.
- Chưa test tay đầy đủ toàn bộ checklist.
