# Lưu Lịch Sử Chatbot & Admin Xem Log

- **Trạng thái:** DONE
- **Cập nhật lần cuối:** 2026-06-19

## Mục tiêu

- Lưu lịch sử chat vào MongoDB theo từng user đã đăng nhập.
- Khi user mở lại chatbot vẫn thấy lịch sử cũ từ server.
- Admin có trang riêng để xem log chatbot theo từng user.

## File đã tạo

- `backend/models/ChatHistory.js`
- `backend/controllers/chatAdminController.js`
- `backend/routes/chatAdminRoutes.js`
- `client/src/pages/AdminChatbotLogsPage.jsx`

## File đã sửa

- `backend/controllers/chatController.js`
- `backend/routes/chatRoutes.js`
- `backend/server.js`
- `client/src/components/ChatbotWidget.jsx`
- `client/src/App.jsx`
- `client/src/layouts/AdminLayout.jsx`
- `client/src/components/admin/AdminSidebar.jsx`

## API đã thêm / cập nhật

- `GET /api/chat/history`
  - dùng `protect`
  - trả lịch sử chat của user hiện tại

- `POST /api/chat`
  - dùng `protectOptional`
  - guest vẫn chat được như cũ
  - nếu có token hợp lệ thì backend tự lưu lịch sử vào MongoDB

- `GET /api/admin/chat-logs`
  - dùng `protect + protectAdmin`
  - admin xem toàn bộ log chatbot theo từng user

## Luồng dữ liệu

### 1. User đã đăng nhập mở chatbot

- Frontend gọi `GET /api/chat/history`
- Backend lấy `ChatHistory` theo `req.user._id`
- Trả về mảng `messages`
- Widget hiển thị lại lịch sử cũ

### 2. User gửi câu hỏi mới

- Frontend gửi `POST /api/chat`
- Nếu có token:
  - `protectOptional` gắn `req.user`
  - `chatController` gọi Gemini như cũ
  - sau khi có câu trả lời, backend lưu:
    - message của user
    - message của bot
    - danh sách sản phẩm gợi ý
    - `currentPath`
    - `currentProductId`
- Nếu là guest:
  - vẫn chat bình thường
  - không lưu vào MongoDB

### 3. Admin xem log

- Admin vào `/admin/chatbot-logs`
- Frontend gọi `GET /api/admin/chat-logs`
- Backend trả danh sách log theo từng user
- Admin xem được:
  - tên user
  - email
  - tổng số tin nhắn
  - câu hỏi gần nhất
  - toàn bộ hội thoại đã lưu

## Cấu trúc lưu trong MongoDB

Collection `ChatHistory` gồm:

- `user`
- `messages[]`

Mỗi `message` gồm:

- `role`
- `text`
- `products`
- `currentPath`
- `currentProductId`
- `createdAt`

## Manual Test Checklist

- [ ] User chưa đăng nhập mở chatbot vẫn chat được
- [ ] Guest reload trang vẫn chỉ dùng lịch sử local như cũ
- [ ] User đã đăng nhập gửi câu hỏi mới
- [ ] Reload trang khi đã đăng nhập vẫn thấy lịch sử chat từ MongoDB
- [ ] Đóng / mở widget khi đã đăng nhập vẫn thấy lịch sử
- [ ] User A có lịch sử riêng
- [ ] User B không thấy lịch sử của User A
- [ ] Admin vào `/admin/chatbot-logs` xem được log
- [ ] Admin thấy đúng tên user và email
- [ ] Admin thấy đúng nội dung user hỏi
- [ ] Admin thấy đúng nội dung bot trả lời
- [ ] Admin thấy sản phẩm chatbot đã gợi ý
- [ ] User thường gọi `GET /api/admin/chat-logs` bị chặn

## Vấn đề còn tồn tại

- Guest chat chưa lưu vào MongoDB, chỉ lưu local.
- Chưa có nút xóa lịch sử chat.
- Admin mới chỉ xem log, chưa có filter nâng cao theo ngày hoặc theo user.
- Lịch sử hiện đang lưu tối đa 100 message gần nhất cho mỗi user.

## Ghi chú bảo vệ đồ án

- `protectOptional` là điểm quan trọng giúp giữ nguyên chat guest nhưng vẫn hỗ trợ lưu lịch sử cho user đã đăng nhập.
- `ChatHistory` dùng `user` unique để mỗi user có một bản ghi lịch sử chính.
- Frontend không cần đổi UI lớn, chỉ đổi nguồn dữ liệu:
  - guest dùng localStorage
  - user dùng MongoDB qua API
- Admin log là lớp quản trị, vì vậy phải khóa bằng `protect + protectAdmin` ở backend, không chỉ khóa bằng route frontend.
