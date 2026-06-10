# A3_UPLOAD_IMAGE

- Task Name: Upload ảnh sản phẩm local bằng multer
- Status: DONE
- Last Updated: 2026-06-10

## Mục tiêu

- Thay cách nhập URL ảnh thủ công bằng upload ảnh từ máy local trong môi trường dev.
- Lưu file ảnh vào `backend/uploads/`.
- Backend trả về URL ảnh sau khi upload để frontend lưu vào field `images` của `Product`.

## Các file đã sửa

- `backend/package.json`
- `backend/package-lock.json`
- `backend/server.js`
- `backend/routes/uploadRoutes.js`
- `backend/uploads/.gitkeep`
- `client/src/pages/AdminProductsPage.jsx`

## Nội dung thay đổi

- Cài `multer` cho backend.
- Tạo route mới `POST /api/uploads`.
- Chỉ cho upload file:
  - `png`
  - `jpg`
  - `jpeg`
  - `webp`
- Giới hạn dung lượng file 5MB.
- Tạo và serve thư mục `backend/uploads/` qua `/uploads`.
- `AdminProductsPage` đổi từ textarea URL sang input file.
- Form admin hỗ trợ upload nhiều ảnh theo cách đơn giản:
  - chọn một hoặc nhiều file
  - upload tuần tự từng ảnh
  - cộng dồn URL vào mảng `images`
  - cho xóa từng ảnh trước khi lưu
- Khi admin chọn ảnh:
  - frontend gửi `FormData`
  - backend lưu file
  - backend trả `imageUrl`
  - frontend cập nhật preview và lưu URL vào mảng ảnh của form product
- Khi tạo/sửa sản phẩm, frontend vẫn lưu `images` dưới dạng mảng URL như cũ.

## Luồng upload ảnh

### Trước khi sửa

- Admin nhập URL ảnh thủ công vào form sản phẩm.
- Frontend gửi URL đó lên `POST /api/products` hoặc `PUT /api/products/:id`.

### Sau khi sửa

- Admin chọn file ảnh trong form sản phẩm.
- Frontend gửi `FormData` lên `POST /api/uploads`.
- Backend:
  - kiểm tra quyền admin
  - kiểm tra loại file
  - kiểm tra kích thước file
  - lưu file vào `backend/uploads`
  - trả `imageUrl`
- Frontend nhận `imageUrl`, hiển thị preview và đưa vào `formData.images`.
- Khi lưu sản phẩm, frontend gửi `images: [imageUrl]` lên API product.
- Ảnh đầu tiên trong mảng được dùng làm ảnh chính ở bảng/admin và các trang user.

## Cách test thủ công

1. Chạy backend:
   - `cd backend`
   - `npm run dev`
2. Chạy frontend:
   - `cd client`
   - `npm run dev`
3. Đăng nhập bằng tài khoản admin.
4. Vào `/admin/products`.
5. Bấm `Thêm sản phẩm` hoặc `Sửa`.
6. Chọn một hoặc nhiều file ảnh `.png`, `.jpg`, `.jpeg` hoặc `.webp`.
7. Kiểm tra:
   - có trạng thái đang upload
   - có preview nhiều ảnh nếu chọn nhiều file
   - URL ảnh được cập nhật vào form
   - có thể xóa từng ảnh khỏi danh sách preview
8. Lưu sản phẩm.
9. Kiểm tra bảng sản phẩm:
   - ảnh hiển thị đúng
10. Mở URL ảnh trả về từ backend trong browser:
   - `http://localhost:5000/uploads/<ten-file>`

## Kết quả mong đợi

- Upload ảnh thành công với file hợp lệ.
- File được lưu trong `backend/uploads/`.
- Backend trả URL ảnh đúng.
- `AdminProductsPage` hiển thị preview ảnh ngay sau khi upload.
- Tạo/sửa sản phẩm vẫn hoạt động như cũ.
- Ảnh vừa upload hiển thị trong bảng sản phẩm admin.

## Kết quả test

- Đã test tay thành công trên local.
- Upload ảnh hợp lệ trả về `imageUrl` đúng.
- Preview ảnh hiển thị sau khi upload.
- Hỗ trợ cộng dồn nhiều ảnh vào cùng một sản phẩm.
- Khi lưu sản phẩm, URL ảnh được lưu vào field `images`.
- Ảnh hiển thị đúng trong bảng quản lý sản phẩm admin.
- Chưa có test tự động cho route upload.

## Manual Test Checklist

- [x] Upload file JPG hợp lệ
- [ ] Upload file PNG hợp lệ
- [ ] Upload file WEBP hợp lệ
- [ ] Upload file vượt quá giới hạn 5MB
- [x] Upload file không phải ảnh, ví dụ `.txt`
- [x] Tạo sản phẩm mới bằng ảnh upload
- [x] Sửa sản phẩm cũ bằng ảnh upload mới
- [x] Ảnh hiển thị đúng trong trang admin
- [x] Ảnh hiển thị đúng ở trang danh sách sản phẩm
- [x] Ảnh hiển thị đúng ở trang chi tiết sản phẩm

## Vấn đề còn tồn tại

- Form hiện hỗ trợ nhiều ảnh nhưng vẫn quy ước `images[0]` là ảnh chính.
- Chưa có xóa file cũ khi admin thay ảnh mới.
- Chưa có dọn file rác nếu upload xong nhưng không lưu sản phẩm.
- Mới phù hợp local dev, chưa phù hợp production/cloud storage.
- Chưa có test tự động cho upload route.

## Ghi chú phục vụ bảo vệ đồ án

- `Product` không lưu binary ảnh trong MongoDB, chỉ lưu URL/đường dẫn ảnh.
- `multer` được dùng để xử lý `multipart/form-data`.
- Route upload được bảo vệ bằng `protect` + `protectAdmin`.
- Frontend không gửi file cùng lúc với request tạo sản phẩm; nó upload ảnh trước, lấy URL, sau đó mới lưu product.
- `images` vẫn là mảng, nên hệ thống có thể lưu ảnh chính và thêm các ảnh chụp nhiều góc của máy.
- Cách này đơn giản, dễ demo và phù hợp local dev.
