# A5_WISHLIST

- Task Name: Danh sách yêu thích sản phẩm
- Status: DONE
- Last Updated: 2026-06-12

## Mục tiêu

- Cho phép user đã đăng nhập thêm hoặc bỏ sản phẩm khỏi danh sách yêu thích bằng icon trái tim.
- Hiển thị icon tim màu đỏ khi sản phẩm đã được yêu thích.
- Nếu chưa đăng nhập mà bấm tim thì hiện thông báo yêu cầu đăng nhập.
- Tạo trang `/wishlist` để user xem các sản phẩm yêu thích.
- Hiển thị nút yêu thích ở cả trang danh sách và trang chi tiết sản phẩm.
- Lưu wishlist theo từng user ở backend.

## File đã sửa

- `backend/models/User.js`
- `backend/controllers/wishlistController.js`
- `backend/routes/wishlistRoutes.js`
- `backend/server.js`
- `client/src/App.jsx`
- `client/src/components/Navbar.jsx`
- `client/src/components/ProductCard.jsx`
- `client/src/pages/ProductListPage.jsx`
- `client/src/pages/PhonesPage.jsx`
- `client/src/pages/ProductDetailPage.jsx`
- `client/src/pages/WishlistPage.jsx`

## API đã thêm

- `GET /api/wishlist`
  - Yêu cầu đăng nhập bằng token.
  - Trả về danh sách sản phẩm yêu thích của user hiện tại.

- `POST /api/wishlist/toggle`
  - Yêu cầu đăng nhập bằng token.
  - Body:

```json
{
  "productId": "..."
}
```

  - Nếu sản phẩm chưa có trong wishlist thì thêm vào.
  - Nếu đã có rồi thì xóa ra.
  - Trả về:

```json
{
  "isWishlisted": true,
  "wishlist": []
}
```

## Luồng dữ liệu

- Backend:
  - User model có thêm field `wishlist` là mảng `ObjectId` tham chiếu tới `Product`.
  - Khi frontend gọi `GET /api/wishlist`, backend lấy user hiện tại và `populate("wishlist")`.
  - Khi frontend gọi `POST /api/wishlist/toggle`, backend kiểm tra `productId`, tìm user, sau đó thêm hoặc xóa sản phẩm trong `wishlist`.

- Frontend:
  - `ProductListPage`, `PhonesPage` và `ProductDetailPage` sẽ gọi `GET /api/wishlist` khi user đã đăng nhập để biết sản phẩm nào đang được yêu thích.
  - Card sản phẩm và ảnh ở trang chi tiết nhận trạng thái `isWishlisted` để đổi màu icon tim.
  - Khi bấm tim, frontend gọi `POST /api/wishlist/toggle` rồi cập nhật lại state `wishlist`.
  - `WishlistPage` gọi `GET /api/wishlist` để hiển thị danh sách yêu thích dạng lưới.

## Manual Test Checklist

- [ ] Chưa đăng nhập bấm tim ở trang chủ
- [ ] Chưa đăng nhập bấm tim ở trang điện thoại
- [ ] Chưa đăng nhập bấm tim ở trang chi tiết sản phẩm
- [ ] Đăng nhập rồi bấm tim, icon chuyển đỏ
- [ ] Bấm lại lần 2, icon trở về bình thường
- [ ] Reload trang, trạng thái tim vẫn đúng
- [ ] Link `Yêu thích` xuất hiện trên Navbar khi đã đăng nhập
- [ ] Vào `/wishlist` thấy đúng các sản phẩm đã thích
- [ ] Bỏ yêu thích ngay trong `/wishlist` thì sản phẩm biến mất khỏi danh sách
- [ ] Bấm tim ở trang chi tiết sản phẩm thì trạng thái đồng bộ với `/wishlist`
- [ ] User khác đăng nhập không thấy wishlist của user trước
- [x] `npm run build` trong `client/` chạy thành công

## Vấn đề còn tồn tại

- Chưa có `WishlistContext`, nên mỗi trang đang tự gọi API wishlist riêng.
- Chưa hiển thị số lượng wishlist trên Navbar.
- Thông báo hiện đang dùng `window.alert`, phù hợp local dev nhưng chưa đẹp bằng toast UI.

## Ghi chú bảo vệ đồ án

- Wishlist được lưu trong `User` thay vì tạo model riêng để giữ giải pháp đơn giản, dễ hiểu.
- `populate("wishlist")` giúp backend trả về đầy đủ thông tin sản phẩm thay vì chỉ trả `productId`.
- Icon tim đỏ không phải do frontend tự nhớ tạm thời, mà dựa trên dữ liệu wishlist thật lấy từ backend.
- API `toggle` giúp frontend đơn giản hơn: chỉ cần bấm tim là backend tự quyết định thêm hay xóa.
- Trang chi tiết sản phẩm dùng cùng API wishlist nên hành vi thêm/bỏ yêu thích luôn đồng bộ với các trang danh sách.
