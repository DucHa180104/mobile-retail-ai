# Task Name
A2 - Trang phụ kiện

# Status
DONE

# Last Updated
2026-07-09

# Mục tiêu
- Tạo route riêng cho danh mục `Phụ kiện`.
- Hiển thị và lọc đúng các sản phẩm thuộc nhóm accessory.
- Có dữ liệu mẫu để demo và test thủ công.

# Các file đã sửa
- `client/src/App.jsx`
- `client/src/components/Navbar.jsx`
- `client/src/pages/AccessoriesPage.jsx`
- `backend/seed/productsSeeder.js`

# Nội dung thay đổi
- Thêm route `/accessories`.
- Menu `Phụ kiện` trên navbar trỏ đúng sang route mới.
- Tạo `AccessoriesPage.jsx` với:
  - tìm kiếm theo từ khóa
  - lọc hãng
  - lọc nhóm phụ kiện
  - lọc tình trạng
  - lọc khoảng giá
  - sort
  - phân trang
  - wishlist
- Seeder thêm dữ liệu mẫu phụ kiện:
  - tai nghe
  - sạc / cáp
  - bút cảm ứng
  - bao da / bàn phím

# Luồng dữ liệu
- User vào `/accessories`
- Frontend gọi `/api/products?category=accessory`
- Backend trả về danh sách phụ kiện
- Frontend lọc thêm nhóm phụ kiện theo tên/mô tả sản phẩm
- User xem danh sách, lọc, sort và mở chi tiết sản phẩm

# Các bước test thủ công
- Vào `/accessories` thấy danh sách phụ kiện.
- Lọc hãng hoạt động đúng.
- Lọc nhóm phụ kiện hoạt động đúng.
- Lọc khoảng giá hoạt động đúng.
- Sort giá thấp / giá cao / mới nhất hoạt động đúng.
- Bấm sản phẩm mở đúng trang chi tiết.

# Kết quả test
- Frontend build pass.
- Cần seed lại dữ liệu để database hiện tại có phụ kiện mẫu.

# Vấn đề còn tồn tại
- Bộ lọc `nhóm phụ kiện` hiện đang suy luận từ tên/mô tả sản phẩm ở frontend, chưa có field `type` riêng trong schema.
- Form admin hiện chưa có chọn `category`, nên muốn quản trị phụ kiện đầy đủ cần làm tiếp phần admin.

# Ghi chú phục vụ bảo vệ đồ án
- Phần accessory đang đi theo hướng tiết kiệm thay đổi backend:
  - backend phân loại bằng `category`
  - frontend xử lý nhóm phụ kiện bằng logic suy luận
- Nếu cần nâng cấp sau:
  - thêm field `type` cho phụ kiện
  - thêm filter `type` trực tiếp từ backend
