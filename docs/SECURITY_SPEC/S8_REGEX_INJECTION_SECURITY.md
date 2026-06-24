# Task Name
S8 - Chống regex injection / ReDoS qua `keyword`

# Status
DONE

# Last Updated
2026-06-24

# Mục tiêu
- Không cho người dùng điều khiển trực tiếp `$regex` qua `keyword`.
- Escape ký tự regex đặc biệt trước khi query MongoDB.
- Giới hạn độ dài `keyword` để giảm nguy cơ abuse.

# Các file đã sửa
- `backend/controllers/productController.js`
- `backend/routes/productRoutes.keywordSecurity.test.js`

# Nội dung thay đổi
- Thêm `normalizedKeyword = keyword.trim().slice(0, 100)`.
- Dùng `escapeRegex(normalizedKeyword)` trước khi đưa vào `$regex`.
- Áp dụng cho cả tìm theo `name` và `brand`.

# Luồng dữ liệu trước khi sửa
1. Client gọi `/api/products?keyword=...`
2. Backend lấy nguyên `keyword`
3. Nhét thẳng vào `$regex`
4. MongoDB thực thi regex người dùng nhập

# Luồng dữ liệu sau khi sửa
1. Client gọi `/api/products?keyword=...`
2. Backend `trim()` và giới hạn độ dài
3. Backend `escapeRegex(keyword)`
4. MongoDB chỉ tìm theo chuỗi text an toàn

# Manual Test Checklist
- [ ] Tìm `iphone` vẫn ra sản phẩm iPhone
- [ ] Tìm `(a+)+$` không làm API lỗi/treo
- [ ] Tìm `(a+)+$` chỉ match literal text nếu dữ liệu có chuỗi đó
- [ ] Gửi keyword quá dài, API vẫn phản hồi bình thường
- [ ] Search các filter khác không bị ảnh hưởng

# Kết quả test tự động
- Đã thêm 3 test case:
  - keyword bình thường
  - keyword regex đặc biệt
  - keyword quá dài

# Vấn đề còn tồn tại
- Đây là bản bảo vệ bằng `escapeRegex`, chưa phải full-text search engine.
- Nếu sau này muốn tìm kiếm thông minh hơn thì nên chuyển sang semantic search hoặc search service riêng.

# Ghi chú phục vụ bảo vệ đồ án
- Lỗi này map vào OWASP `A03: Injection`.
- Điểm chính là backend không còn dùng trực tiếp input người dùng làm regex pattern.
- Em đã bổ sung giới hạn độ dài để giảm thêm nguy cơ ReDoS.
