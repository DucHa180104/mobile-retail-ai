# Task Name
S6 - Ẩn thông điệp lỗi nội bộ khỏi client

# Status
DONE

# Last Updated
2026-06-24

# Mục tiêu
- Không trả thẳng `error.message` nội bộ ra client.
- Tách lỗi business và lỗi kỹ thuật.
- Client chỉ nhận thông báo chung khi backend gặp lỗi nội bộ.

# Các file đã sửa
- `backend/middleware/errorHandler.js`
- `backend/server.js`
- `backend/controllers/orderController.js`
- `backend/controllers/productController.js`
- `backend/controllers/authController.js`
- `backend/routes/productRoutes.errorHandling.test.js`

# Nội dung thay đổi
- Tạo middleware `errorHandler` để xử lý lỗi tập trung.
- Mount `errorHandler` ở cuối `server.js`.
- Sửa các `catch` trong controller chính:
  - `orderController`
  - `productController`
  - `authController`
- Các lỗi nội bộ được chuyển qua `next(error)`.
- `errorHandler` log lỗi ở server nhưng chỉ trả:
  - `500`
  - `{ "message": "Internal server error" }`
- Với `productController`, lỗi validate đầu vào vẫn trả `400` với thông báo an toàn `Invalid product data`.

# Luồng dữ liệu trước khi sửa
1. Request vào controller.
2. Nếu có lỗi trong `catch`, nhiều nơi trả `error.message` ra client.
3. Client có thể thấy thông tin kỹ thuật nội bộ.

# Luồng dữ liệu sau khi sửa
1. Request vào controller.
2. Lỗi business vẫn trả rõ trong controller.
3. Lỗi nội bộ đi qua `next(error)`.
4. `errorHandler` log lỗi thật ở server.
5. Client chỉ nhận `Internal server error`.

# Manual Test Checklist
- [ ] Gọi một API gây lỗi nội bộ giả lập
- [ ] Kiểm tra response status là `500`
- [ ] Kiểm tra body chỉ có `Internal server error`
- [ ] Kiểm tra response không chứa `error.message` kỹ thuật
- [ ] Kiểm tra lỗi business như `Product not found` vẫn hiển thị đúng

# Kết quả test tự động
- Đã thêm file test:
  - `backend/routes/productRoutes.errorHandling.test.js`
- Test ép lỗi nội bộ tại `GET /api/products`
- Kết quả:
  - `1 file passed`
  - `1 test passed`

# Vấn đề còn tồn tại
- Chưa quét toàn bộ mọi controller phụ trong hệ thống.
- `console.error` vẫn log `error.message` ở server, đây là chủ đích để debug, không trả ra client.
- Có thể chuẩn hóa sâu hơn bằng custom error class trong tương lai.

# Ghi chú phục vụ bảo vệ đồ án
- Lỗi này thuộc nhóm OWASP `A05: Security Misconfiguration` / lộ thông tin xử lý nội bộ.
- Điểm quan trọng là phân biệt:
  - lỗi business: vẫn trả rõ
  - lỗi nội bộ: không lộ chi tiết
- Em đã có test tự động chứng minh backend không còn trả chuỗi lỗi Mongo nội bộ về frontend.
