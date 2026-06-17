# UI - Đổi nút Mua ngay sang trang chi tiết

- **Trạng thái:** DONE
- **Cập nhật lần cuối:** 2026-06-15

## Mục tiêu

- Đổi hành vi nút `Mua ngay` ở trang user để đúng với nội dung hiển thị.
- Khi người dùng bấm `Mua ngay`, hệ thống chuyển sang trang chi tiết sản phẩm thay vì âm thầm thêm vào giỏ.

## File đã sửa

- `client/src/pages/PhonesPage.jsx`
- `client/src/components/ProductCard.jsx`

## Nội dung thay đổi

- Ở trang danh sách điện thoại, nút chính của mỗi card đổi từ hành vi `addToCart` sang link tới `/products/:id`.
- Ở component `ProductCard` dùng chung, nút `Mua ngay` cũng đổi sang link tới trang chi tiết để đồng nhất trải nghiệm.
- Giữ nguyên nút mũi tên đi tới chi tiết sản phẩm.

## Luồng trước và sau khi sửa

- Trước khi sửa:
  - Card có thể hiển thị chữ `Mua ngay` hoặc `Thêm vào giỏ`.
  - Một số chỗ bấm nút chính sẽ thêm sản phẩm vào giỏ.
- Sau khi sửa:
  - Nút chính hiển thị `Mua ngay`.
  - Bấm vào sẽ mở trang chi tiết sản phẩm để người dùng xem kỹ máy trước khi mua.

## Manual Test Checklist

- [ ] Vào `/phones`, kiểm tra nút chính trên card hiển thị `Mua ngay`
- [ ] Bấm `Mua ngay` trên một sản phẩm bất kỳ
- [ ] Hệ thống chuyển đúng tới `/products/:id`
- [ ] Không tự thêm sản phẩm vào giỏ khi chỉ bấm `Mua ngay`
- [ ] Nút trái tim yêu thích vẫn hoạt động bình thường
- [ ] Nút mũi tên xem chi tiết vẫn hoạt động bình thường
- [ ] Trang chủ hoặc wishlist nếu dùng `ProductCard` cũng có hành vi `Mua ngay` giống nhau

## Kết quả test

- Chưa test tay đầy đủ toàn bộ checklist.

## Ghi chú bảo vệ đồ án

- Đây là chỉnh sửa UX để câu chữ và hành vi đồng nhất.
- Với web bán điện thoại cũ, cho người dùng vào trang chi tiết trước sẽ hợp lý hơn vì họ cần xem kỹ tình trạng máy, ảnh thật và thông tin cụ thể trước khi quyết định mua.
