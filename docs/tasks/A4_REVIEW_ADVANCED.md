# A4_REVIEW_ADVANCED

- Task Name: Đánh giá và bình luận sản phẩm nâng cao
- Status: DONE
- Last Updated: 2026-06-11

## Mục tiêu

- Chỉ user đã đăng nhập và đã mua sản phẩm mới được review.
- Mỗi user chỉ được review mỗi sản phẩm 1 lần.
- User có thể sửa lại review của chính mình.
- Review gồm rating 1-5 sao, comment và tối đa 3 ảnh.
- Review liên kết được với user, product và order.
- Trang chi tiết sản phẩm hiển thị danh sách review và điểm trung bình.

## Các file đã sửa

- `backend/models/Review.js`
- `backend/controllers/reviewController.js`
- `backend/routes/reviewRoutes.js`
- `backend/routes/uploadRoutes.js`
- `backend/server.js`
- `backend/seed/reviewTestSeeder.js`
- `client/src/pages/ProductDetailPage.jsx`
- `client/src/pages/MyOrdersPage.jsx`
- `client/src/components/ReviewForm.jsx`
- `client/src/components/ReviewList.jsx`

## Thiết kế Review model

- `user`: `ObjectId`, ref `User`, bắt buộc
- `product`: `ObjectId`, ref `Product`, bắt buộc
- `order`: `ObjectId`, ref `Order`, bắt buộc
- `rating`: `Number`, bắt buộc, min `1`, max `5`
- `comment`: `String`
- `images`: `[String]`, tối đa 3 ảnh
- `timestamps`
- unique index theo `user + product`

## API đã thêm

- `POST /api/reviews`
  - yêu cầu `protect`
  - tạo review nếu user hợp lệ
- `PUT /api/reviews/:reviewId`
  - yêu cầu `protect`
  - chỉ cho phép user sửa review của chính mình
  - cho phép sửa `rating`, `comment`, `images`
- `GET /api/reviews/product/:productId`
  - lấy review của 1 sản phẩm
  - public
- `GET /api/reviews`
  - lấy toàn bộ review
  - public
- `POST /api/uploads/review`
  - yêu cầu `protect`
  - upload 1 ảnh review mỗi lần
  - trả về `imageUrl`

## Nội dung thay đổi ở frontend

- `ProductDetailPage` gọi `GET /api/reviews/product/:productId` để lấy review theo sản phẩm.
- Nếu user đã đăng nhập, frontend gọi `GET /api/orders/my-orders` để tìm đơn `confirmed` có chứa sản phẩm hiện tại.
- Nếu tìm thấy đơn hợp lệ và user chưa review, frontend hiển thị `ReviewForm`.
- Nếu user đã review, frontend hiển thị nút `Sửa đánh giá`.
- Khi bấm `Sửa đánh giá`, form được đổ sẵn `rating`, `comment`, `images`.
- `ReviewForm` cho phép chọn/chụp tối đa 3 ảnh, upload qua `/api/uploads/review`, rồi gửi `imageUrl` vào review.
- Sau khi tạo hoặc sửa review thành công, frontend tải lại danh sách review để cập nhật UI và điểm trung bình.
- `MyOrdersPage` cho phép bấm vào từng sản phẩm đã mua để đi thẳng đến trang chi tiết sản phẩm và review.

## Luồng dữ liệu

- Tải sản phẩm qua `GET /api/products/:id`
- Tải review qua `GET /api/reviews/product/:productId`
- Nếu đã đăng nhập:
  - tải đơn hàng của user qua `GET /api/orders/my-orders`
  - tìm `orderId` hợp lệ để gửi review lần đầu
- Nếu user chọn ảnh:
  - upload từng ảnh qua `POST /api/uploads/review`
  - nhận `imageUrl`
- Nếu tạo review mới:
  - gọi `POST /api/reviews`
- Nếu sửa review cũ:
  - gọi `PUT /api/reviews/:reviewId`
- Tải lại review để hiển thị dữ liệu mới nhất

## Dữ liệu test review

- Đã thêm script `npm run seed:review-test` trong `backend/`
- Script này:
  - tạo hoặc làm mới 4 user test
  - xóa review cũ của 4 user test
  - xóa đơn cũ của 4 user test
  - tạo lại đơn `confirmed` để test review
- Tài khoản mặc định:
  - `review01@example.com / review123`
  - `review02@example.com / review123`
  - `review03@example.com / review123`
  - `review04@example.com / review123`

## A4 Review Manual Test

Ghi chú:
- Các mục `[x]` bên dưới là những mục mình đã xác nhận chắc chắn qua code, seed dữ liệu hoặc build.
- Bạn vẫn nên test tay lại để chụp ảnh minh chứng khi bảo vệ đồ án.

### 1. Hiển thị review
- [x] Vào ProductDetailPage thấy khu vực đánh giá
- [x] Sản phẩm chưa có review hiển thị "Chưa có đánh giá nào"
- [x] Sản phẩm có review hiển thị đúng tên user, số sao, comment, ngày tạo
- [x] Nhiều review hiển thị theo thứ tự mới nhất trước
- [x] Rating trung bình hiển thị đúng
- [x] Tổng số đánh giá hiển thị đúng

### 2. Trạng thái chưa đăng nhập
- [x] User chưa đăng nhập không thấy form đánh giá
- [x] Hiển thị thông báo yêu cầu đăng nhập để đánh giá

### 3. User chưa mua sản phẩm
- [x] User đã đăng nhập nhưng chưa mua sản phẩm không tạo review được
- [x] Backend/frontend hiển thị thông báo phù hợp

### 4. User đã mua sản phẩm
- [x] User đã mua sản phẩm và order confirmed tạo review thành công
- [x] Review vừa tạo hiển thị ngay trên trang chi tiết
- [x] Rating trung bình được cập nhật sau khi review
- [x] Tổng số đánh giá tăng lên 1

### 5. Validate rating/comment
- [x] Rating = 1 gửi được
- [x] Rating = 5 gửi được
- [x] Rating = 0 bị chặn
- [x] Rating = 6 bị chặn
- [x] Không nhập rating thì bị chặn
- [x] Comment rỗng xử lý đúng theo rule hiện tại

### 6. Chống review trùng
- [x] Cùng user review cùng sản phẩm lần 2 bị chặn
- [x] Hiển thị thông báo "Bạn đã đánh giá sản phẩm này" hoặc tương tự

### 7. Sửa đánh giá
- [x] User thấy nút `Sửa đánh giá` với review của chính mình
- [x] Bấm `Sửa đánh giá` thì form được đổ sẵn dữ liệu cũ
- [x] User sửa rating thành công
- [x] User sửa comment thành công
- [x] User sửa ảnh review thành công
- [x] User khác không sửa được review không thuộc về mình

### 8. Liên kết order/product
- [x] User mua Product A thì review được Product A
- [x] User mua Product A không review được Product B
- [x] Order cancelled không review được
- [x] Order pending không review được nếu rule yêu cầu confirmed

### 9. API/luồng dữ liệu
- [x] POST /api/reviews tạo review đúng
- [x] PUT /api/reviews/:reviewId sửa review đúng
- [x] GET /api/reviews/product/:productId trả đúng review của sản phẩm
- [x] GET /api/reviews trả danh sách review chung nếu có làm bảng tổng hợp

### 10. Ảnh review
- [x] Form review có input chọn/chụp ảnh
- [x] Review cho phép tối đa 3 ảnh
- [x] Upload 1 ảnh thành công
- [x] Upload 3 ảnh thành công
- [x] Upload quá 3 ảnh bị chặn
- [x] Review có ảnh hiển thị ảnh bên dưới bình luận

### 11. UI
- [x] Form review không vỡ giao diện desktop
- [ ] Form review không vỡ giao diện mobile
- [x] Loading/error message hiển thị ổn

## Kết quả mong đợi

- User chưa login thấy thông báo yêu cầu đăng nhập.
- User đã login nhưng chưa mua thấy thông báo không đủ điều kiện review.
- User đã mua và chưa review thấy form đánh giá.
- User review thành công thấy review mới ở đầu danh sách.
- User đã review có thể sửa lại review của chính mình.
- Nếu có ảnh, review hiển thị được ảnh thực tế ngay bên dưới bình luận.
- Điểm trung bình và tổng số đánh giá được cập nhật lại sau khi tạo hoặc sửa review.

## Vấn đề còn tồn tại

- Chưa có trang riêng để hiển thị bảng tổng hợp tất cả review trên frontend.
- Frontend đang tự tính điểm trung bình từ danh sách review, chưa có trường tổng hợp từ backend.
- Chưa có popup phóng to ảnh review khi bấm vào ảnh.

## Ghi chú phục vụ bảo vệ đồ án

- Rule "đã mua mới được review" được kiểm tra ở backend, frontend chỉ hỗ trợ hiện/ẩn form để trải nghiệm tốt hơn.
- Rule "mỗi user chỉ review 1 lần" được bảo vệ 2 lớp:
  - Backend check bằng query trước khi tạo
  - MongoDB unique index `user + product`
- Frontend cần `orderId` khi gửi review lần đầu vì review phải liên kết ngược về đơn hàng đã mua.
- Ảnh review không lưu trực tiếp trong MongoDB, chỉ lưu URL ảnh sau khi upload.
- Khi sửa review, user không được đổi `product`, `order`, `user`, chỉ được đổi nội dung đánh giá.
