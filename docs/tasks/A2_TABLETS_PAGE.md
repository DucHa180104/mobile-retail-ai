# Task Name
A2 - Trang máy tính bảng

# Status
DONE

# Last Updated
2026-07-09

# Mục tiêu
- Tạo route riêng cho danh mục `Máy tính bảng`.
- Bộ lọc và tìm kiếm chỉ lấy sản phẩm thuộc nhóm tablet.
- Có dữ liệu mẫu tablet để test phân trang, tìm kiếm, lọc.

# Các file đã sửa
- `backend/models/Product.js`
- `backend/controllers/productController.js`
- `backend/seed/productsSeeder.js`
- `client/src/App.jsx`
- `client/src/components/Navbar.jsx`
- `client/src/pages/TabletsPage.jsx`

# Nội dung thay đổi
- Thêm field `category` vào schema `Product`.
- Backend `GET /api/products` hỗ trợ query `category`.
- Navbar đổi link `Máy tính bảng` sang `/tablets`.
- App thêm route `/tablets`.
- Tạo `TabletsPage.jsx` với:
  - search theo `searchTerm`
  - filter hãng
  - filter tình trạng
  - filter dung lượng
  - filter khoảng giá
  - sort giá / mới nhất
  - pagination
  - wishlist giống trang điện thoại
- Seeder thêm dữ liệu mẫu tablet.

# Luồng dữ liệu trước và sau khi sửa
- Trước:
  - Menu `Máy tính bảng` chưa có route thật.
  - Backend chưa phân biệt phone / tablet.
  - Dữ liệu seed gần như chỉ có điện thoại.
- Sau:
  - User vào `/tablets`.
  - Frontend gọi `/api/products?category=tablet&...`.
  - Backend filter theo `category`.
  - Chỉ sản phẩm tablet được trả về để hiển thị.

# Các bước test thủ công
- Vào `/tablets` thấy danh sách máy tính bảng.
- Tìm kiếm tên tablet hoạt động đúng.
- Lọc hãng hoạt động đúng.
- Lọc dung lượng hoạt động đúng.
- Lọc khoảng giá hoạt động đúng.
- Sort mới nhất / giá thấp / giá cao hoạt động đúng.
- Chuyển trang hoạt động đúng khi có nhiều sản phẩm.

# Kết quả test
- Frontend build pass.
- Route `/tablets` đã được nối vào app.
- Cần seed lại dữ liệu để nhìn thấy tablet trong database hiện tại.

# Vấn đề còn tồn tại
- Form admin hiện chưa có field chọn `category`, nên nếu admin tạo sản phẩm mới từ giao diện thì mặc định vẫn là `phone`.
- Nếu muốn quản trị đầy đủ tablet/phụ kiện trong admin, nên làm task tiếp theo cho `AdminProductsPage`.

# Ghi chú phục vụ bảo vệ đồ án
- Đây là bước tách danh mục theo backend, không phải chỉ lọc giao diện.
- Điểm chính để giải thích:
  - thêm `category` trong schema
  - backend nhận `category` từ query
  - frontend route `/tablets` luôn gửi `category=tablet`
  - seed thêm dữ liệu tablet để demo
