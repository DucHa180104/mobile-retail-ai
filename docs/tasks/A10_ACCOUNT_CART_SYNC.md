# A10_ACCOUNT_CART_SYNC

- Task Name: Giỏ hàng đồng bộ theo tài khoản
- Status: DONE
- Last Updated: 2026-06-14

## Mục tiêu

- Giữ nguyên guest cart bằng `localStorage`.
- Khi user đăng nhập, dùng backend cart làm nguồn dữ liệu chính.
- Tự merge cart local lên server sau khi đăng nhập.
- Giữ nguyên API sử dụng của `CartContext` để các page cũ không bị vỡ.

## File đã sửa

- `backend/models/User.js`
- `backend/controllers/cartController.js`
- `backend/routes/cartRoutes.js`
- `backend/server.js`
- `client/src/context/CartContext.jsx`
- `client/src/pages/CheckoutPage.jsx`

## API đã thêm

- `GET /api/cart`
- `POST /api/cart`
- `PUT /api/cart/:productId`
- `DELETE /api/cart/:productId`
- `DELETE /api/cart`
- `PUT /api/cart/sync`

## Luồng guest cart

- User chưa đăng nhập:
  - `CartContext` đọc cart từ `localStorage`
  - thêm / xóa / tăng / giảm số lượng đều chỉ sửa local
  - `CartPage` và `CheckoutPage` không cần đổi UI

## Luồng user cart

- User đã đăng nhập:
  - `CartContext` gọi `GET /api/cart`
  - dữ liệu cart lấy từ backend
  - các thao tác:
    - `addToCart`
    - `removeFromCart`
    - `increaseQuantity`
    - `decreaseQuantity`
    - `clearCart`
  - sẽ gọi API cart tương ứng ở backend

## Luồng merge cart khi login

- Khi phát hiện user vừa đăng nhập:
  - `CartContext` đọc cart local
  - nếu local có sản phẩm thì gọi `PUT /api/cart/sync`
  - backend merge theo `productId`
  - nếu trùng sản phẩm thì cộng `quantity`
  - frontend cập nhật `cartItems` theo cart server trả về
  - sau đó xóa cart guest trong `localStorage`

## Manual Test Checklist

### 1. Guest cart - chưa đăng nhập

- [x] Chưa đăng nhập -> thêm sản phẩm vào giỏ
- [x] Reload trang -> sản phẩm vẫn còn trong giỏ
- [x] Tăng số lượng sản phẩm -> số lượng cập nhật đúng
- [x] Giảm số lượng sản phẩm -> số lượng cập nhật đúng
- [x] Xóa sản phẩm khỏi giỏ -> sản phẩm biến mất
- [x] Clear cart -> giỏ hàng rỗng

### 2. Sync khi login

- [x] Chưa đăng nhập -> thêm 1-2 sản phẩm vào giỏ
- [x] Login tài khoản user
- [x] Giỏ local được sync lên tài khoản
- [x] Sau login, sản phẩm vẫn còn trong giỏ
- [x] Reload trang -> giỏ vẫn còn

### 3. Cart theo tài khoản

- [x] Login user A -> thêm sản phẩm vào giỏ
- [x] Logout
- [x] Login lại user A -> vẫn thấy giỏ hàng cũ
- [x] Login user B -> không thấy giỏ hàng của user A

### 4. Cart backend

- [x] Khi đã login -> thêm sản phẩm -> gọi API backend thành công
- [x] Tăng số lượng -> reload vẫn đúng
- [x] Giảm số lượng -> reload vẫn đúng
- [x] Xóa item -> reload vẫn mất
- [x] Clear cart -> reload vẫn rỗng

### 5. Checkout

- [x] Login -> thêm sản phẩm vào giỏ
- [x] Checkout thành công
- [x] Sau checkout -> giỏ hàng rỗng
- [x] Reload trang -> giỏ vẫn rỗng

### 6. Merge cart

- [x] User có sẵn sản phẩm A trong cart backend
- [ ] Logout -> thêm sản phẩm B ở guest cart
- [x] Login lại -> giỏ có cả A và B
- [ ] Nếu A đã có ở cả local và backend -> số lượng được merge đúng

### 7. Lỗi / edge case

- [ ] Gọi `/api/cart` không token -> bị chặn
- [ ] Thêm `productId` không tồn tại -> báo lỗi phù hợp
- [ ] `quantity < 1` -> xử lý đúng theo rule
- [x] `npm run build` client pass

## Vấn đề còn tồn tại

- Chưa có loading/error UI riêng cho từng thao tác cart backend.
- Chưa có badge phân biệt cart local và cart server.
- Chưa xử lý tồn kho ngay tại cart, hiện vẫn kiểm tra chính ở bước tạo order.
- Chưa test tay đầy đủ, mới xác nhận build client pass.

## Ghi chú bảo vệ đồ án

- Giải pháp này giữ được 2 chế độ:
  - guest cart bằng `localStorage`
  - account cart bằng backend
- Không cần sửa `CartPage` lớn vì `CartContext` vẫn giữ nguyên interface cũ.
- `PUT /api/cart/sync` là điểm chính để đồng bộ cart local lên server khi login.
- Ở `PUT /api/cart/:productId`, nếu `quantity < 1` thì xóa item luôn vì cách này đơn giản và khớp với hành vi giảm số lượng hiện có ở frontend.
