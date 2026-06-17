# UI - Chỉnh giỏ hàng ngay trong trang checkout

- **Trạng thái:** DONE
- **Cập nhật lần cuối:** 2026-06-15

## Mục tiêu

- Cho người dùng chỉnh số lượng sản phẩm ngay trong trang checkout.
- Cho người dùng xóa sản phẩm khỏi đơn ngay tại phần tóm tắt đơn hàng.
- Giữ nguyên logic đặt hàng hiện tại.

## File đã sửa

- `client/src/pages/CheckoutPage.jsx`

## Nội dung thay đổi

- Thêm nút `-` và `+` trong từng sản phẩm ở khối `Tóm tắt đơn hàng`.
- Thêm nút `Xóa` cho từng sản phẩm.
- Tự động cập nhật:
  - số lượng từng sản phẩm
  - tổng số lượng
  - tổng thanh toán

## Luồng dữ liệu

- Trang checkout dùng trực tiếp các hàm từ `CartContext`:
  - `increaseQuantity`
  - `decreaseQuantity`
  - `removeFromCart`
- Khi người dùng bấm tăng/giảm/xóa:
  - giỏ hàng được cập nhật
  - summary trong checkout render lại ngay
- Khi đặt hàng thành công:
  - vẫn dùng `clearCart()` như cũ

## Manual Test Checklist

- [ ] Vào `/checkout` với giỏ có ít nhất 2 sản phẩm
- [ ] Bấm `+` để tăng số lượng một sản phẩm
- [ ] Bấm `-` để giảm số lượng một sản phẩm
- [ ] Khi giảm về 0 thì sản phẩm bị xóa khỏi danh sách
- [ ] Bấm `Xóa` thì sản phẩm biến mất khỏi checkout
- [ ] Tổng số lượng cập nhật đúng
- [ ] Tổng thanh toán cập nhật đúng
- [ ] Nếu xóa hết sản phẩm thì checkout chuyển sang trạng thái giỏ trống
- [ ] Đặt hàng sau khi chỉnh số lượng vẫn hoạt động bình thường

## Kết quả test

- Chưa test tay đầy đủ toàn bộ checklist.

## Ghi chú phục vụ bảo vệ đồ án

- Đây là cải tiến UX, giúp user không phải quay lại trang giỏ hàng chỉ để sửa số lượng.
- Logic đơn hàng không thay đổi, chỉ tận dụng lại các hàm sẵn có của `CartContext`.
