# Task Name
P3.1 - Điều chỉnh Product Detail cho hợp logic máy mới / máy cũ

# Status
DONE

# Last Updated
2026-07-07

# Mục tiêu
- Máy mới ưu tiên hiển thị cấu hình và thông số kỹ thuật.
- Máy cũ ưu tiên hiển thị tình trạng thực tế, pin, ngoại hình, sửa chữa, bảo hành.
- Không sửa backend nếu chưa cần.

# Các file đã sửa
- `client/src/pages/ProductDetailPage.jsx`
- `docs/MENTOR_FEEDBACK_ACTION_PLAN.md`

# Nội dung thay đổi
- Viết lại `ProductDetailPage.jsx` theo hướng sạch và dễ bảo trì hơn.
- Thêm nhánh giao diện theo `product.condition !== "new"`.
- Máy cũ:
  - giữ khối tình trạng thực tế
  - giữ thông tin pin, màn hình, thân máy, Face ID, sửa chữa, phụ kiện
- Máy mới:
  - đổi phần nổi bật sang cấu hình, chip, màn hình, pin, camera
  - khối thông tin nhanh chuyển sang kiểu xem cấu hình / bảo hành / trạng thái hàng
- Đổi text mô tả và lưu ý mua hàng theo từng loại sản phẩm.

# Luồng dữ liệu trước và sau khi sửa
## Trước
- Mọi sản phẩm gần như đều render theo kiểu máy cũ.
- Máy mới vẫn hiện các field như pin sức khỏe, thân máy, sửa chữa.

## Sau
- Frontend vẫn fetch cùng API `GET /api/products/:id`.
- Sau khi lấy `product`, trang kiểm tra:
  - nếu `condition === "new"` → render layout thiên về cấu hình
  - nếu khác `new` → render layout thiên về tình trạng máy cũ

# Các bước test thủ công
- Mở 1 sản phẩm `condition = "new"`:
  - kiểm tra khối nổi bật thiên về cấu hình
  - kiểm tra khối thông tin nhanh không còn mang nặng kiểu máy cũ
- Mở 1 sản phẩm `condition = "used_99"` hoặc `used_good`:
  - kiểm tra còn hiển thị pin, màn hình, thân máy, sửa chữa
- Kiểm tra:
  - ảnh gallery vẫn đổi được
  - thêm giỏ / mua ngay vẫn hoạt động
  - review vẫn hiển thị

# Kết quả test
- `npm run build` ở `client/` đã pass sau khi sửa.

# Vấn đề còn tồn tại
- Dữ liệu seed hiện chưa tách thật rõ giữa dòng máy mới và máy cũ ở mức nội dung mô tả.
- Nếu muốn giống các site lớn hơn nữa thì cần làm sâu hơn ở schema và dữ liệu seed.

# Ghi chú phục vụ bảo vệ đồ án
- Điểm quan trọng để trình bày:
  - cùng một schema Product nhưng frontend có thể render 2 kiểu chi tiết khác nhau
  - máy mới và máy cũ có ưu tiên thông tin khác nhau
  - đây là bước chỉnh UX/domain logic, không phải thay đổi API
