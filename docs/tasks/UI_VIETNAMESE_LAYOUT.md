# UI_VIETNAMESE_LAYOUT

- Task Name: Chuẩn hóa giao diện tiếng Việt và thu gọn bố cục trang
- Status: DONE
- Last Updated: 2026-06-13

## Mục tiêu

- Chuẩn hóa text hiển thị trên frontend sang tiếng Việt dễ đọc.
- Loại bỏ các chuỗi lỗi mã hóa kiểu `KhÃ...`, `Ä...`.
- Thu gọn phần nội dung trong `Outlet` theo cả chiều ngang và chiều dọc.
- Giảm chiều cao một số section để giao diện gọn hơn.

## Các file đã sửa

- `client/src/layouts/MainLayout.jsx`
- `client/src/components/Navbar.jsx`
- `client/src/components/HeroBanner.jsx`
- `client/src/components/CategorySection.jsx`
- `client/src/components/Footer.jsx`
- `client/src/components/ProductCard.jsx`
- `client/src/components/TrustBadges.jsx`
- `client/src/pages/ProductListPage.jsx`
- `client/src/pages/PhonesPage.jsx`
- `client/src/pages/LoginPage.jsx`
- `client/src/pages/RegisterPage.jsx`
- `client/src/pages/CartPage.jsx`
- `client/src/pages/MyOrdersPage.jsx`
- `client/src/pages/OrderSuccessPage.jsx`

## Nội dung thay đổi

- Bọc `Outlet` bằng một container hẹp hơn trong `MainLayout`.
- Giảm `padding`, `space-y`, chiều cao banner và card ở trang chủ.
- Chuẩn hóa text menu, nút bấm, tiêu đề, mô tả sang tiếng Việt dễ đọc.
- Làm card sản phẩm và các khối cam kết gọn hơn.
- Đồng bộ text ở trang danh sách điện thoại, đăng nhập, đăng ký, giỏ hàng, đơn hàng của tôi và trang thành công.

## Luồng trước và sau khi sửa

- Trước khi sửa:
  - Nhiều text UI bị lỗi mã hóa.
  - Một số section có khoảng trắng lớn, nhìn dài và thừa.
- Sau khi sửa:
  - Text hiển thị dễ đọc hơn.
  - Trang chủ và các trang chính gọn hơn theo cả chiều ngang lẫn chiều dọc.
  - Phần nội dung trong `Outlet` được khống chế chiều rộng tốt hơn.

## Các bước test thủ công

- [ ] Mở trang chủ, kiểm tra menu và ô tìm kiếm hiển thị tiếng Việt đúng.
- [ ] Kiểm tra banner trang chủ thấp hơn trước, không quá dài.
- [ ] Kiểm tra section danh mục, sản phẩm và footer gọn hơn.
- [ ] Vào `/phones`, kiểm tra bộ lọc và phân trang hiển thị đúng tiếng Việt.
- [ ] Vào `/login`, `/register`, kiểm tra text form hiển thị đúng.
- [ ] Vào `/cart`, kiểm tra text giỏ hàng hiển thị đúng.
- [ ] Vào `/my-orders`, kiểm tra text lịch sử đơn hàng hiển thị đúng.
- [ ] Tạo đơn hàng và vào `/order-success`, kiểm tra text hiển thị đúng.

## Kết quả test

- `npm run build` trong `client/` đã chạy thành công.

## Vấn đề còn tồn tại

- Các trang sau có thể tinh chỉnh thêm nếu muốn đồng bộ 100% về câu chữ và phong cách:
  - `CheckoutPage`
  - `TradeInPage`
  - `ProductDetailPage`
  - admin UI

## Ghi chú phục vụ bảo vệ đồ án

- `MainLayout` là nơi bọc `Navbar`, `Outlet`, `Footer`, nên chỉnh ở đây sẽ ảnh hưởng toàn bộ trang user.
- `Outlet` không tự hiển thị nội dung, nó chỉ là chỗ để router render page con vào.
- Muốn giao diện gọn hơn thì không nên scale toàn trang bằng CSS, mà nên giảm `max-width`, `padding`, `margin`, `space-y` và chiều cao từng section.
