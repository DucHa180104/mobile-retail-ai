# Task Name
S5 - Chống mass assignment khi tạo/sửa sản phẩm

# Status
DONE

# Last Updated
2026-06-24

# Mục tiêu
- Không cho backend nhận nguyên `req.body` khi tạo/sửa sản phẩm.
- Chỉ cho phép các field hợp lệ theo schema `Product`.
- Bỏ qua field lạ ở cả level ngoài và object lồng `usedDetails`, `specs`.

# Các file đã sửa
- `backend/controllers/productController.js`
- `backend/routes/productRoutes.massAssignment.test.js`

# Nội dung thay đổi
- Thay `Product.create(req.body)` bằng payload đã lọc.
- Thay `findByIdAndUpdate(..., req.body, ...)` bằng payload đã lọc.
- Thêm helper:
  - `buildProductPayload`
  - `pickUsedDetails`
  - `pickSpecs`
  - `normalizeImages`
  - `normalizeString`
  - `normalizeNumber`
  - `hasOwn`
- Chỉ giữ các field hợp lệ:
  - `name`
  - `brand`
  - `price`
  - `stock`
  - `condition`
  - `images`
  - `description`
  - `usedDetails`
  - `specs`

# Luồng dữ liệu trước khi sửa
1. Admin gọi `POST /api/products` hoặc `PUT /api/products/:id`
2. Backend lấy gần như nguyên `req.body`
3. Dữ liệu được ghi thẳng vào MongoDB

# Luồng dữ liệu sau khi sửa
1. Admin gọi `POST /api/products` hoặc `PUT /api/products/:id`
2. Backend chạy `buildProductPayload(req.body)`
3. Chỉ các field hợp lệ được giữ lại
4. Field lạ bị bỏ qua
5. MongoDB chỉ lưu payload đã được whitelist

# Manual Test Checklist
- [ ] Tạo sản phẩm kèm field lạ như `role`, `randomField`
- [ ] Kiểm tra sản phẩm vẫn tạo được nhưng field lạ không bị lưu
- [ ] Tạo sản phẩm với `usedDetails.hackField`
- [ ] Kiểm tra `hackField` bị bỏ qua
- [ ] Sửa sản phẩm với `specs.unsafeSpec`
- [ ] Kiểm tra `unsafeSpec` bị bỏ qua
- [ ] Kiểm tra update partial không làm mất các field không gửi lên

# Kết quả test tự động
- Đã thêm 3 test case:
  - tạo sản phẩm với field lạ ở top-level
  - tạo sản phẩm với field lạ trong `usedDetails/specs`
  - cập nhật sản phẩm chỉ nhận field hợp lệ

# Vấn đề còn tồn tại
- Chưa chặn riêng trường hợp admin cố tình gửi giá trị rỗng nhưng vẫn hợp lệ kiểu dữ liệu.
- `getProducts` vẫn còn nhận `keyword` chưa escape, thuộc phạm vi S8 chứ không phải S5.

# Ghi chú phục vụ bảo vệ đồ án
- Lỗi này map vào OWASP `A08: Software and Data Integrity Failures` / nhóm input handling.
- Điểm quan trọng là backend không còn tin toàn bộ `req.body`.
- Cách sửa là whitelist field theo schema thay vì blacklist thủ công.
