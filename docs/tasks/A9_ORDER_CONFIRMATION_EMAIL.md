# A9_ORDER_CONFIRMATION_EMAIL

- Task Name: Email xác nhận đơn hàng
- Status: DONE
- Last Updated: 2026-06-14

## Mục tiêu

- Gửi email xác nhận đơn hàng sau khi tạo order thành công.
- Hỗ trợ cả user đã đăng nhập và guest checkout.
- Lưu email liên hệ trực tiếp trong order để dùng lại về sau.
- Dùng `Nodemailer + Mailtrap` để chạy local dev, không dùng Gmail thật.

## File đã sửa

- `backend/package.json`
- `backend/package-lock.json`
- `backend/models/Order.js`
- `backend/controllers/orderController.js`
- `backend/services/emailService.js`
- `backend/.env.example`
- `client/src/pages/CheckoutPage.jsx`
- `client/src/pages/OrderSuccessPage.jsx`

## Biến môi trường cần cấu hình

- `MAILTRAP_HOST`
- `MAILTRAP_PORT`
- `MAILTRAP_USER`
- `MAILTRAP_PASS`
- `MAIL_FROM`

## Luồng gửi email

- User hoặc guest nhập email trong `CheckoutPage`.
- Frontend gửi `contactEmail` lên `POST /api/orders`.
- Backend validate email và lưu vào `order.contactEmail`.
- Sau khi:
  - tạo order thành công
  - trừ stock thành công
- Backend gọi `sendOrderConfirmationEmail(order, order.contactEmail)`.
- Email gồm:
  - mã đơn
  - ngày đặt
  - tên người nhận
  - tổng tiền
  - trạng thái đơn
  - phương thức thanh toán
  - danh sách sản phẩm

## Lý do không rollback order nếu gửi email lỗi

- Email là tác vụ bổ sung sau khi order đã được tạo thành công.
- Nếu Mailtrap lỗi mà rollback order thì user sẽ không đặt hàng được, dù dữ liệu đơn hàng hợp lệ.
- Vì vậy:
  - order vẫn được tạo
  - chỉ `console.error(...)` lỗi email
  - cách này ổn hơn cho local dev và demo đồ án

## Manual Test Checklist

- [ ] User đăng nhập tạo order -> Mailtrap nhận email
- [ ] Guest nhập email tạo order -> Mailtrap nhận email
- [ ] Email có đúng mã đơn
- [ ] Email có đúng tổng tiền
- [ ] Email có đúng danh sách sản phẩm
- [ ] Email có đúng trạng thái đơn
- [ ] `OrderSuccessPage` hiển thị đúng email nhận xác nhận
- [ ] Nếu user đã đăng nhập thì email được tự điền sẵn ở checkout
- [ ] User vẫn có thể sửa email trước khi đặt hàng
- [ ] Mailtrap lỗi thì order vẫn tạo thành công
- [x] `npm run build` client pass

## Vấn đề còn tồn tại

- Chưa có template HTML đẹp, mới ở mức đơn giản để dễ demo.
- Chưa có hàng đợi gửi mail nền.
- Chưa có resend email xác nhận từ trang admin hoặc trang user.
- Nếu chưa cấu hình Mailtrap trong `.env` thì backend sẽ log lỗi mail nhưng order vẫn tạo.

## Ghi chú bảo vệ đồ án

- `contactEmail` được lưu trong `Order` để cả guest và user đăng nhập đều nhận được email xác nhận.
- `Nodemailer` chịu trách nhiệm gửi mail, còn `Mailtrap` là SMTP sandbox để test local.
- Gửi mail được đặt ngay trong `createOrder` vì đây là nơi biết chắc order đã tạo thành công.
- Không rollback order khi gửi mail lỗi là quyết định kỹ thuật có chủ đích để bảo vệ trải nghiệm đặt hàng.
