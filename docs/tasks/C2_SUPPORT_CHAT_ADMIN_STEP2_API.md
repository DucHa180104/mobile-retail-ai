# Task Name
C2 - Chat với admin - Bước 2 tạo API backend cơ bản

# Status
DONE

# Last Updated
2026-07-08

# Mục tiêu
- Cho user lấy hội thoại hỗ trợ của mình.
- Cho user gửi tin nhắn tới admin.
- Cho admin xem danh sách hội thoại.
- Cho admin xem tin nhắn và trả lời user.

# Các file đã sửa
- `backend/controllers/supportChatController.js`
- `backend/routes/supportChatRoutes.js`
- `backend/server.js`

# API đã thêm
- `GET /api/support-chat/me`
- `POST /api/support-chat/me/messages`
- `GET /api/support-chat/admin/conversations`
- `GET /api/support-chat/admin/conversations/:conversationId/messages`
- `POST /api/support-chat/admin/conversations/:conversationId/messages`

# Luồng dữ liệu
## User
- User gọi `GET /api/support-chat/me`
- Backend tìm hoặc tạo `SupportConversation`
- Backend trả conversation + messages

- User gọi `POST /api/support-chat/me/messages`
- Backend tạo `SupportMessage`
- Backend cập nhật `lastMessage`, `lastMessageAt`, `lastSenderType` trong conversation

## Admin
- Admin gọi `GET /api/support-chat/admin/conversations`
- Backend trả danh sách hội thoại và populate thông tin user

- Admin gọi `GET /api/support-chat/admin/conversations/:conversationId/messages`
- Backend trả chi tiết conversation + messages
- Backend đánh dấu các tin user gửi là đã đọc

- Admin gọi `POST /api/support-chat/admin/conversations/:conversationId/messages`
- Backend tạo tin nhắn reply của admin
- Backend cập nhật thông tin tin nhắn cuối trong conversation

# Các bước test thủ công
- Đăng nhập user thường:
  - gọi `GET /api/support-chat/me`
  - gọi `POST /api/support-chat/me/messages`
- Đăng nhập admin:
  - gọi `GET /api/support-chat/admin/conversations`
  - gọi `GET /api/support-chat/admin/conversations/:id/messages`
  - gọi `POST /api/support-chat/admin/conversations/:id/messages`

# Kết quả test
- Chưa chạy test tự động ở bước này.
- Chưa làm UI ở bước này.

# Vấn đề còn tồn tại
- Chưa có trang user/admin để dùng API này.
- Chưa có polling.
- Chưa có unread badge ở UI.

# Ghi chú phục vụ bảo vệ đồ án
- Backend đã đủ nền tảng để làm chat 2 chiều.
- Thiết kế hiện tại ưu tiên dễ hiểu, dễ demo, chưa dùng socket realtime.
