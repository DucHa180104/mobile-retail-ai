# Task Name
Mở rộng dữ liệu seed sản phẩm

# Status
DONE

# Last Updated
2026-07-09

# Mục tiêu
- Tạo dữ liệu demo thật nhiều để phục vụ lọc, tìm kiếm, phân trang và demo đồ án.
- Có đủ:
  - điện thoại mới / cũ
  - máy tính bảng
  - phụ kiện
- Tên sản phẩm hiển thị bằng tiếng Việt có dấu.

# Các file đã sửa
- `backend/seed/productsSeeder.js`

# Nội dung thay đổi
- Viết lại seeder theo hướng dùng template để sinh dữ liệu lớn.
- Dùng ảnh local trong `backend/uploads` để tránh link ảnh chết.
- Giữ lại 2 tài khoản demo:
  - `admin@example.com / admin123`
  - `user@example.com / user123`
- Sinh sản phẩm theo 3 nhóm:
  - `phone`
  - `tablet`
  - `accessory`

# Kết quả mong đợi
- Sau khi chạy lại seed, database có rất nhiều sản phẩm để demo.
- Trang điện thoại, máy tính bảng, phụ kiện đều có dữ liệu đủ nhiều để test phân trang và bộ lọc.

# Cách chạy
```bash
cd backend
npm run seed
```

# Lưu ý
- Lệnh seed sẽ xóa dữ liệu sản phẩm demo cũ và tạo lại từ đầu.
- Lệnh seed cũng xóa user cũ trong file seeder hiện tại và thêm lại 2 tài khoản demo.
