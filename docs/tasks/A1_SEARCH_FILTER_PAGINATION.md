# A1_SEARCH_FILTER_PAGINATION

- Task Name: Tìm kiếm + Lọc + Phân trang sản phẩm
- Status: DONE
- Last Updated: 2026-06-10

## Mục tiêu

- Hỗ trợ tìm kiếm, lọc, sắp xếp và phân trang cho trang danh sách điện thoại.
- Chuyển phân trang từ frontend sang backend để tránh tải toàn bộ dữ liệu rồi mới chia trang.
- Bổ sung lọc theo dung lượng và khoảng giá để phù hợp hơn với web bán điện thoại cũ.

## Các file đã sửa

- `backend/controllers/productController.js`
- `client/src/pages/PhonesPage.jsx`
- `client/src/pages/ProductListPage.jsx`
- `client/src/pages/AdminDashboardPage.jsx`
- `client/src/pages/AdminProductsPage.jsx`
- `backend/seed/productsSeeder.js`

## Nội dung thay đổi

- Backend `GET /api/products` nhận thêm:
  - `page`
  - `limit`
  - `storage`
  - `minPrice`
  - `maxPrice`
- Backend dùng:
  - `countDocuments`
  - `skip`
  - `limit`
  để phân trang thật.
- Backend trả response có metadata:
  - `products`
  - `currentPage`
  - `totalPages`
  - `totalProducts`
  - `pageSize`
- Frontend `PhonesPage` gửi thêm lên API:
  - `page`
  - `limit`
  - `storage`
  - `minPrice`
  - `maxPrice`
- Frontend bỏ `slice()` và `useMemo()` cho phân trang cục bộ.
- Frontend thêm filter:
  - dung lượng
  - khoảng giá preset
- Cập nhật `ProductListPage` và `AdminDashboardPage` để đọc đúng response mới của `GET /api/products`.
- Cập nhật `AdminProductsPage` gọi `GET /api/products?page=1&limit=1000` để admin nhìn thấy gần như toàn bộ danh sách sản phẩm.
- Seeder được mở rộng thêm nhiều sản phẩm mẫu để dễ test nhiều trang.

## Luồng dữ liệu trước và sau khi sửa

### Trước khi sửa

- `Navbar` nhập từ khóa tìm kiếm.
- `MainLayout` giữ `searchTerm`.
- `PhonesPage` gọi `GET /api/products`.
- Backend chỉ search/filter/sort.
- Frontend nhận toàn bộ danh sách rồi tự chia trang bằng `slice()`.

### Sau khi sửa

- `Navbar` nhập từ khóa tìm kiếm.
- `MainLayout` giữ `searchTerm`.
- `PhonesPage` gọi `GET /api/products` với:
  - `keyword`
  - `brand`
  - `condition`
  - `storage`
  - `minPrice`
  - `maxPrice`
  - `sort`
  - `page`
  - `limit`
- Backend search/filter/sort và phân trang bằng MongoDB.
- Backend trả metadata phân trang.
- Frontend render trực tiếp dữ liệu của trang hiện tại.

## Các bước test thủ công

1. Chạy lại seed:
   - `cd backend`
   - `npm run seed`
2. Mở trang:
   - `/phones`
3. Bấm sang trang 2, 3...
4. Test search bằng ô tìm kiếm trên navbar.
5. Test filter theo hãng.
6. Test filter theo tình trạng.
7. Test filter theo dung lượng.
8. Test filter theo khoảng giá.
9. Test sort theo giá tăng/giảm.
10. Khi đổi search/filter/sort, kiểm tra có tự quay về trang 1.
11. Mở `/` và `/admin/dashboard` để chắc chắn các trang cũ vẫn đọc đúng response mới.
12. Mở `/admin/products` và kiểm tra danh sách hiện nhiều hơn 6 sản phẩm.

## Kết quả test

- Đã test tay sau khi seed lại dữ liệu.
- Backend pagination hoạt động đúng với search/filter/sort.
- Filter dung lượng và khoảng giá đã được nối backend/frontend.
- Đã fix lỗi trang trắng do `ProductListPage` và `AdminDashboardPage` vẫn xử lý response `/api/products` như mảng thuần.
- `AdminProductsPage` đã hiển thị gần như toàn bộ sản phẩm thay vì chỉ 6 item đầu.
- Chưa chạy test tự động.

## Vấn đề còn tồn tại

- Chưa có test tự động cho `GET /api/products`.
- Một số file cũ trong project vẫn còn lỗi encoding tiếng Việt.

## Ghi chú phục vụ bảo vệ đồ án

- Phần tìm kiếm, lọc và sắp xếp đã đi qua backend.
- Điểm mới của task này là chuyển phân trang từ frontend sang backend.
- Trước đây frontend tải toàn bộ sản phẩm rồi mới chia trang, hiện tại backend chỉ trả đúng dữ liệu của trang được yêu cầu.
- Khoảng giá được làm theo preset để giữ UI đơn giản, dễ test và phù hợp tiến độ đồ án.
