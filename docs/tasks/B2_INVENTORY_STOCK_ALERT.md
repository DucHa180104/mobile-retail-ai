# B2 - Quản lý tồn kho và cảnh báo hết hàng

- **Trạng thái:** DONE
- **Cập nhật lần cuối:** 2026-06-15

## Mục tiêu

- Hiển thị trạng thái tồn kho rõ ràng trong trang quản trị sản phẩm.
- Giúp admin lọc nhanh các sản phẩm còn hàng, sắp hết hoặc hết hàng.
- Thêm cảnh báo tồn kho ở dashboard để admin biết sản phẩm nào cần xử lý sớm.

## Hiện trạng stock đã có

- Schema `Product` đã có field `stock`.
- Luồng tạo đơn ở backend đã kiểm tra tồn kho và trừ stock khi đặt hàng thành công.
- Vì vậy task B2 chỉ cần tận dụng dữ liệu `stock` hiện có, không phải thêm schema mới.

## File đã sửa

- `client/src/pages/AdminProductsPage.jsx`
- `client/src/pages/AdminDashboardPage.jsx`
- `docs/tasks/B2_INVENTORY_STOCK_ALERT.md`

## Logic phân loại tồn kho

- `stock === 0` → `Hết hàng`
- `stock > 0 && stock <= 5` → `Sắp hết`
- `stock > 5` → `Còn hàng`

## Nội dung thay đổi

### 1. Admin Products

- Thêm badge trạng thái tồn kho trong bảng sản phẩm.
- Thêm filter tồn kho:
  - Tất cả tồn kho
  - Còn hàng
  - Sắp hết
  - Hết hàng
- Filter xử lý ở frontend từ danh sách products đang tải sẵn.

### 2. Admin Dashboard

- Thêm thống kê:
  - Sản phẩm hết hàng
  - Sản phẩm sắp hết
- Thêm khối cảnh báo tồn kho:
  - Lấy tối đa 5 sản phẩm có stock thấp nhất
  - Ưu tiên các sản phẩm có stock từ 0 đến 5
- Nếu không có sản phẩm sắp hết hoặc hết hàng thì hiển thị trạng thái rỗng.

## Manual Test Checklist

- [ ] Product có `stock = 0` hiển thị badge `Hết hàng`
- [ ] Product có `stock = 1-5` hiển thị badge `Sắp hết`
- [ ] Product có `stock > 5` hiển thị badge `Còn hàng`
- [ ] Filter tồn kho ở Admin Products hoạt động đúng
- [ ] Dashboard hiển thị đúng số sản phẩm hết hàng
- [ ] Dashboard hiển thị đúng số sản phẩm sắp hết
- [ ] Dashboard hiển thị đúng 5 sản phẩm stock thấp nhất
- [ ] Nếu không có sản phẩm sắp hết/hết hàng thì dashboard hiện thông báo phù hợp
- [ ] Checkout làm giảm stock và sau khi reload, Admin Products cập nhật đúng
- [ ] Checkout làm giảm stock và sau khi reload, Dashboard cập nhật đúng

## Kết quả test

- Chưa test tay đầy đủ toàn bộ checklist sau khi sửa.

## Vấn đề còn tồn tại

- Filter tồn kho hiện xử lý ở frontend, chưa đẩy xuống backend.
- Dashboard mới hiển thị cảnh báo cơ bản, chưa có biểu đồ tồn kho theo thời gian.
- Chưa có chức năng nhập thêm hàng hoặc chỉnh stock nhanh theo lô.

## Ghi chú phục vụ bảo vệ đồ án

- Điểm quan trọng của task này là tận dụng field `stock` đã có sẵn, không làm backend phức tạp thêm.
- Phân loại tồn kho theo 3 mức giúp admin nhìn nhanh tình trạng kho.
- Dashboard cảnh báo stock thấp giúp chứng minh hệ thống không chỉ bán hàng mà còn hỗ trợ quản lý vận hành.
